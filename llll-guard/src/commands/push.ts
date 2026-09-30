import { minimatch } from 'minimatch';
import { scanForSecrets, scanFilePathForSecrets } from '../scanners/secret-scanner.js';
import { scanForPolicyIssues, scanForCopyleftDeps } from '../scanners/policy-scanner.js';
import { loadConfig, loadGuardIgnore } from '../config/loader.js';
import { printResult } from '../output/terminal.js';
import { printJsonResult } from '../output/json.js';
import { parseLog, type AddedLine } from '../diff.js';
import { git, gitLines } from '../git.js';
import {
  parsePrePushInput,
  rangeForPushedRef,
  resolveManualRange,
  type ResolvedRange,
} from '../range.js';
import { GuardError } from '../errors.js';
import { readStdin } from '../stdin.js';
import type { Finding, GuardConfig, ScanResult, Verdict } from '../types.js';

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

  const config = loadConfig();
  if (!config.enabled) {
    console.log('LLLL Guard is disabled. Skipping scan.');
    return;
  }

  const ranges =
    hookInput !== undefined
      ? rangesFromPrePushInput(hookInput, options.remote ?? 'origin')
      : [resolveManualRange({ remote: options.remote, branch: options.branch, range: options.range })];

  await scanRanges(ranges, config, options);
}

export function rangesFromPrePushInput(input: string, remote: string | undefined): ResolvedRange[] {
  return parsePrePushInput(input)
    .map(ref => rangeForPushedRef(ref, remote))
    .filter((range): range is ResolvedRange => range !== null);
}

export async function scanRanges(
  ranges: ResolvedRange[],
  config: GuardConfig,
  options: { json?: boolean },
): Promise<void> {
  const ignorePatterns = loadGuardIgnore();
  const allFindings: Finding[] = [];
  const seenCommits = new Set<string>();
  let scannedFiles = 0;

  for (const range of ranges) {
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
        // A commit reachable from two pushed refs is scanned once.
        skipCommit = seenCommits.has(event.commit);
        seenCommits.add(event.commit);
        continue;
      }
      if (skipCommit) continue;

      if (shouldIgnore(event.path, config.excludePatterns, ignorePatterns)) continue;
      scannedFiles++;

      const fileFindings: Finding[] = [];
      const pathFinding = scanFilePathForSecrets(event.path);
      if (pathFinding) fileFindings.push(pathFinding);

      const content = event.added.map(l => l.text).join('\n');
      if (content) {
        if (config.pushRules.hardBlock) {
          fileFindings.push(...scanForSecrets(content, event.path));
        }
        if (config.pushRules.softBlock) {
          fileFindings.push(...scanForPolicyIssues(content, event.path));
          fileFindings.push(...scanForCopyleftDeps(content, event.path));
        }
      }

      for (const finding of fileFindings) {
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

  const filteredFindings = allFindings.filter(f => !config.pushRules.disabledRules.includes(f.id));
  const verdict = determineVerdict(filteredFindings);

  const result: ScanResult = {
    gate: 'push',
    verdict,
    timestamp: new Date().toISOString(),
    scannedCommits: seenCommits.size,
    scannedFiles,
    findings: filteredFindings,
    overrides: [],
  };

  if (options.json) {
    printJsonResult(result);
  } else {
    if (ranges.length === 0 || seenCommits.size === 0) {
      console.log('No outgoing commits found. Nothing to scan.');
    }
    printResult(result);
  }

  if (verdict === 'HARD_BLOCK' || verdict === 'SOFT_BLOCK') {
    process.exitCode = 1;
  }
}

/** The scanners report a position among the added lines; map it to the line in the file. */
function realLineNumber(position: number | undefined, added: AddedLine[]): number | undefined {
  if (position === undefined) return undefined;
  return added[position - 1]?.line ?? position;
}

function shouldIgnore(filePath: string, excludePatterns: string[], ignorePatterns: string[]): boolean {
  const allPatterns = [...excludePatterns, ...ignorePatterns];
  return allPatterns.some(pattern => minimatch(filePath, pattern));
}

function determineVerdict(findings: Finding[]): Verdict {
  if (findings.some(f => f.severity === 'HARD_BLOCK')) return 'HARD_BLOCK';
  if (findings.some(f => f.severity === 'SOFT_BLOCK' && !f.overridden)) return 'SOFT_BLOCK';
  if (findings.some(f => f.severity === 'WARN')) return 'WARN';
  return 'PASS';
}
