import { minimatch } from 'minimatch';
import { scanFileChange } from '../scanners/file-scan.js';
import { scanPolicyFilePath } from '../scanners/policy-scanner.js';
import { createPublishedValueCheck } from '../scanners/published-values.js';
import { readPolicyAt, type Policy } from '../config/baseline.js';
import { printResult } from '../output/terminal.js';
import { printJsonResult } from '../output/json.js';
import { parseLog, type AddedLine } from '../diff.js';
import { git, gitLines } from '../git.js';
import { findingToken, loadActiveOverrides } from '../overrides.js';
import {
  parsePrePushInput,
  rangeForPushedRef,
  resolveManualRange,
  type ResolvedRange,
} from '../range.js';
import { GuardError } from '../errors.js';
import { readStdin } from '../stdin.js';
import type { Finding, OverrideEntry, ScanResult, Verdict } from '../types.js';

export interface PushOptions {
  json?: boolean;
  remote?: string;
  branch?: string;
  range?: string;
  /** Read the refs being pushed from stdin, in the format git sends to a pre-push hook. */
  stdin?: boolean;
}

const DEFAULT_MAX_COMMITS = 5000;

// Everything that could make `git log -p` show less than the commits contain is pinned:
//  - --text: treat every file as text, so `.gitattributes` (`-diff`, `binary`) and NUL bytes
//    cannot reduce a file to "Binary files differ" with no added lines.
//  - log.showRoot: the root commit is otherwise omitted by `log -p` when this is false.
//  - diff.relative: otherwise only the current subdirectory is shown.
//  - log.showSignature: keeps gpg output out of the stream.
//  - core.quotePath and the explicit prefixes: stable, parseable paths.
const LOG_ARGS = [
  '-c', 'core.quotePath=false',
  '-c', 'log.showRoot=true',
  '-c', 'diff.relative=false',
  '-c', 'log.showSignature=false',
  'log', '-p', '--cc', '-U0', '--text',
  '--no-color', '--no-ext-diff', '--no-textconv',
  '--src-prefix=a/', '--dst-prefix=b/',
  '--format=%x00COMMIT %H',
];

/** Above this many outgoing commits the scan stops with an error rather than skipping some. */
function maxCommits(): number {
  const raw = process.env.LLLL_GUARD_MAX_COMMITS;
  if (raw === undefined || raw === '') return DEFAULT_MAX_COMMITS;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new GuardError(`LLLL_GUARD_MAX_COMMITS must be a positive integer, got "${raw}".`);
  }
  return value;
}

/** `llll-guard push`: manual mode (upstream or --range), or `--stdin` with git's hook input. */
export async function pushCommand(options: PushOptions): Promise<void> {
  // Drain stdin first when git is feeding it, so git never writes into a closed pipe.
  const hookInput = options.stdin ? await readStdin() : undefined;

  const ranges =
    hookInput !== undefined
      ? rangesFromPrePushInput(hookInput, options.remote ?? 'origin')
      : [resolveManualRange({ remote: options.remote, branch: options.branch, range: options.range })];

  await scanRanges(ranges, options);
}

export function rangesFromPrePushInput(input: string, remote: string | undefined): ResolvedRange[] {
  return parsePrePushInput(input)
    .map(ref => rangeForPushedRef(ref, remote))
    .filter((range): range is ResolvedRange => range !== null);
}

export async function scanRanges(ranges: ResolvedRange[], options: { json?: boolean }): Promise<void> {
  const isPublishedValue = createPublishedValueCheck();
  const policies = new Map<string | null, Policy>();
  const policyFor = (base: string | null): Policy => {
    let policy = policies.get(base);
    if (!policy) {
      policy = readPolicyAt(base);
      policies.set(base, policy);
    }
    return policy;
  };

  const allFindings: Finding[] = [];
  const suppressedByPolicy: Record<string, number> = {};
  const seenCommits = new Set<string>();
  // A commit is scanned once per policy that judges it, not once per push: two refs can share a
  // commit and be judged by different policies, and the stricter one must get its say.
  const scannedUnder = new Set<string>();
  const notes: string[] = [];
  const note = (text: string): void => {
    if (!notes.includes(text)) notes.push(text);
  };
  let scannedFiles = 0;
  let skippedByGuardignore = 0;
  let disabledRanges = 0;

  for (const range of ranges) {
    // The policy comes from what the remote already has, not from the commits being pushed.
    const policy = policyFor(range.base);
    const { config } = policy;
    if (!config.enabled) {
      disabledRanges++;
      note(`${range.label}: the guard is disabled by the policy on the remote, so this ref was not scanned.`);
      continue;
    }
    if (range.base === null) {
      note(
        'The remote has no policy to read yet, so the built-in defaults apply. A policy in the pushed commits takes effect from the next push.',
      );
    }
    if (!config.pushRules.hardBlock) note('Secret scanning (hardBlock) is turned off by the policy on the remote.');
    if (!config.pushRules.softBlock) note('Policy review (softBlock) is turned off by the policy on the remote.');
    if (policy.ignorePatterns.some(pattern => /^\*{1,2}(?:\/\*{1,2})?$/.test(pattern))) {
      note('The .guardignore on the remote ignores every file.');
    }

    const total = Number.parseInt(git(['rev-list', '--count', ...range.revArgs, '--']), 10);
    if (total === 0) continue;

    // Scanning only some of the commits and exiting 0 would let a secret hide in the rest.
    const cap = maxCommits();
    if (total > cap) {
      throw new GuardError(
        `${range.label}: ${total} outgoing commits exceeds the scan limit of ${cap}. ` +
          'Raise LLLL_GUARD_MAX_COMMITS to scan them all, or pass --range to scan a smaller range.',
      );
    }

    let skipCommit = false;
    let parsedInRange = 0;
    const lines = gitLines([...LOG_ARGS, ...range.revArgs, '--']);
    for await (const event of parseLog(lines)) {
      if (event.kind === 'commit') {
        parsedInRange++;
        const key = `${event.commit}@${range.base ?? ''}`;
        skipCommit = scannedUnder.has(key);
        scannedUnder.add(key);
        seenCommits.add(event.commit);
        continue;
      }
      if (skipCommit) continue;

      const fileFindings: Finding[] = [];

      // Before the ignore check: no ignore pattern may hide a change to the policy itself. A file
      // that was deleted, or moved away from a policy name, is a change to the policy too.
      for (const path of event.oldPath ? [event.path, event.oldPath] : [event.path]) {
        const policyChange = scanPolicyFilePath(path);
        if (policyChange) fileFindings.push(policyChange);
      }

      // A deleted file has nothing to scan.
      if (!event.deleted) {
        if (matchesAny(event.path, config.excludePatterns)) {
          // Generated files such as lock files: skipped by default, no need to mention it.
        } else if (matchesAny(event.path, policy.ignorePatterns)) {
          skippedByGuardignore++;
        } else {
          scannedFiles++;
          fileFindings.push(
            ...scanFileChange({ path: event.path, added: event.added }, config, { isPublishedValue }),
          );
        }
      }

      for (const finding of fileFindings) {
        if (config.pushRules.disabledRules.includes(finding.id)) {
          suppressedByPolicy[finding.id] = (suppressedByPolicy[finding.id] ?? 0) + 1;
          continue;
        }
        allFindings.push({
          ...finding,
          line: realLineNumber(finding.line, event.added),
          commit: event.commit,
        });
      }
    }

    // A parser that quietly swallows part of the output is the failure we cannot afford.
    if (parsedInRange !== total) {
      throw new GuardError(
        `${range.label}: git reported ${total} outgoing commits but only ${parsedInRange} were read. Refusing to pass a partial scan.`,
      );
    }
  }

  if (skippedByGuardignore > 0) {
    note(`${skippedByGuardignore} file(s) were not scanned because of the .guardignore on the remote.`);
  }

  // The same finding reached through two policies is one finding.
  const findings = allFindings.filter(
    (finding, index) =>
      allFindings.findIndex(
        other =>
          other.id === finding.id &&
          other.file === finding.file &&
          other.commit === finding.commit &&
          other.line === finding.line &&
          other.severity === finding.severity,
      ) === index,
  );

  const appliedOverrides = applyOverrides(findings);
  const verdict = determineVerdict(findings);

  const result: ScanResult = {
    gate: 'push',
    verdict,
    timestamp: new Date().toISOString(),
    scannedCommits: seenCommits.size,
    scannedFiles,
    findings,
    overrides: appliedOverrides,
    ...(Object.keys(suppressedByPolicy).length > 0 ? { suppressedByPolicy } : {}),
    ...(notes.length > 0 ? { notes } : {}),
  };

  if (options.json) {
    printJsonResult(result);
  } else {
    if ((ranges.length === 0 || seenCommits.size === 0) && disabledRanges === 0) {
      console.log('No outgoing commits found. Nothing to scan.');
    }
    printResult(result);
  }

  if (verdict === 'HARD_BLOCK' || verdict === 'SOFT_BLOCK') {
    process.exitCode = 1;
  }
}

/**
 * Gives every SOFT_BLOCK finding its override token and marks the ones an active override covers.
 * Returns the overrides that were used.
 */
function applyOverrides(findings: Finding[]): OverrideEntry[] {
  const soft = findings.filter(f => f.severity === 'SOFT_BLOCK');
  if (soft.length === 0) return [];

  const active = loadActiveOverrides();
  const used = new Map<string, OverrideEntry>();

  for (const finding of soft) {
    const token = findingToken(finding);
    finding.overrideToken = token;
    const entry = active.get(token);
    if (entry && entry.findingIds.includes(finding.id)) {
      finding.overridden = true;
      finding.overrideJustification = entry.justification;
      used.set(token, entry);
    }
  }
  return [...used.values()];
}

/** The scanners report a position among the added lines; map it to the line in the file. */
function realLineNumber(position: number | undefined, added: AddedLine[]): number | undefined {
  if (position === undefined) return undefined;
  return added[position - 1]?.line ?? position;
}

function matchesAny(filePath: string, patterns: string[]): boolean {
  // matchBase: a pattern without "/" such as package-lock.json matches at any depth.
  return patterns.some(pattern => minimatch(filePath, pattern, { matchBase: true, dot: true }));
}

function determineVerdict(findings: Finding[]): Verdict {
  if (findings.some(f => f.severity === 'HARD_BLOCK')) return 'HARD_BLOCK';
  if (findings.some(f => f.severity === 'SOFT_BLOCK' && !f.overridden)) return 'SOFT_BLOCK';
  if (findings.some(f => f.severity === 'WARN')) return 'WARN';
  return 'PASS';
}
