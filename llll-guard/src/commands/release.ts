import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import {
  checkReleaseSize,
  checkReleaseWhitelist,
  scanInlineSourceMap,
  scanReleaseContent,
  scanReleaseFiles,
  scanSourceMapContent,
  unscannedFile,
} from '../scanners/release-scanner.js';
import { scanForSourceMapReferences } from '../scanners/source-map-scanner.js';
import { readPolicyAt } from '../config/baseline.js';
import { loadConfig, loadWhitelist } from '../config/loader.js';
import { GuardError } from '../errors.js';
import { printResult } from '../output/terminal.js';
import { printJsonResult } from '../output/json.js';
import { remotePolicyBase } from '../range.js';
import type { Finding, GuardConfig, ScanResult, Verdict, WhitelistConfig } from '../types.js';

interface ReleaseOptions {
  json?: boolean;
  dir?: string;
}

interface Artifact {
  /** Where the files are on disk. */
  root: string;
  /** Paths inside the package, with `/` separators, as npm reports them. */
  files: string[];
  /** Entries that are not regular files (links, pipes, devices): never read, always reported. */
  nonRegular: { path: string; what: string }[];
}

const DEFAULT_MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_NPM_OUTPUT = 64 * 1024 * 1024;

/**
 * Above this size a file is not read, and that is a finding (RG-S008), so the limit can only
 * make the gate stricter, never switch it off.
 */
function maxFileBytes(): number {
  const raw = process.env.LLLL_GUARD_MAX_FILE_BYTES;
  if (raw === undefined || raw === '') return DEFAULT_MAX_FILE_BYTES;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new GuardError(`LLLL_GUARD_MAX_FILE_BYTES must be a positive integer, got "${raw}".`);
  }
  return value;
}

/**
 * The policy for a release is the one the remote's default branch has, for the same reason as for
 * a push: the package being released is unreviewed and must not carry the rules that judge it.
 * Without a repository or a remote branch the working tree is all there is, and the output says so.
 */
function resolvePolicy(notes: string[]): { config: GuardConfig; whitelist: WhitelistConfig } {
  const base = remotePolicyBase();
  if (base !== null) {
    const policy = readPolicyAt(base);
    return { config: policy.config, whitelist: policy.whitelist };
  }
  notes.push(
    'There is no remote branch to read the policy from, so llll.policy.json and llll.whitelist.json come from the working tree.',
  );
  return { config: loadConfig(), whitelist: loadWhitelist() };
}

export async function releaseCommand(options: ReleaseOptions): Promise<void> {
  const notes: string[] = [];
  const { config, whitelist } = resolvePolicy(notes);

  if (!config.enabled) {
    notes.push('The guard is disabled by the policy, so nothing was scanned. This is not a clean result.');
    finish({ findings: [], scannedFiles: 0, notes, options });
    return;
  }

  const artifact = options.dir ? artifactFromDirectory(options.dir) : artifactFromNpm();
  if (artifact.files.length === 0 && artifact.nonRegular.length === 0) {
    // A release gate that found nothing to look at has not checked anything.
    throw new GuardError('Nothing to scan: the release artifact has no files. Build the package first, or pass --dir.');
  }

  const findings: Finding[] = [];
  findings.push(...scanReleaseFiles(artifact.files, { internalFilePatterns: config.internalFilePatterns }));

  for (const entry of artifact.nonRegular) {
    findings.push(unscannedFile(entry.path, `it is ${entry.what}, and the gate does not follow or open those`));
  }

  const cap = maxFileBytes();
  let scannedFiles = 0;
  let totalSize = 0;
  for (const file of artifact.files) {
    const loaded = readForScan(artifact.root, file, cap);
    totalSize += loaded.size;
    if (loaded.text === null) {
      findings.push(unscannedFile(file, loaded.reason));
      continue;
    }
    scannedFiles++;

    const { text } = loaded;
    if (/\.map$/i.test(file)) {
      const mapFinding = scanSourceMapContent(text, file);
      if (mapFinding) findings.push(mapFinding);
    }
    // `//# sourceMappingURL=` sits at the end of a script or stylesheet, and in the map itself.
    if (/\.(?:[cm]?js|css|map)$/i.test(file)) {
      findings.push(...scanForSourceMapReferences(text, file));
      findings.push(...scanInlineSourceMap(text, file));
    }
    findings.push(...scanReleaseContent(text, file));
  }

  // RG-S006: for a directory scan, only a directory that is a package has a whitelist to look for.
  const packageDir = options.dir ? artifact.root : process.cwd();
  if (!options.dir || existsSync(join(packageDir, 'package.json'))) {
    const whitelistFinding = checkReleaseWhitelist(
      hasFilesField(join(packageDir, 'package.json')),
      existsSync(join(packageDir, '.npmignore')),
    );
    if (whitelistFinding) findings.push(whitelistFinding);
  }

  const sizeFinding = checkReleaseSize(totalSize, whitelist.maxPackageSize);
  if (sizeFinding) findings.push(sizeFinding);

  // Rule classes the policy turns off, and individual rules it disables, are applied and reported.
  const { releaseRules } = config;
  if (!releaseRules.hardBlock) notes.push('HARD_BLOCK release rules are turned off by the policy.');
  if (!releaseRules.softBlock) notes.push('SOFT_BLOCK release rules are turned off by the policy.');
  if (!releaseRules.warn) notes.push('WARN release findings are turned off by the policy.');
  const suppressedByPolicy: Record<string, number> = {};
  const kept = findings.filter(finding => {
    const off =
      releaseRules.disabledRules.includes(finding.id) ||
      (finding.severity === 'HARD_BLOCK' && !releaseRules.hardBlock) ||
      (finding.severity === 'SOFT_BLOCK' && !releaseRules.softBlock) ||
      (finding.severity === 'WARN' && !releaseRules.warn);
    if (off) suppressedByPolicy[finding.id] = (suppressedByPolicy[finding.id] ?? 0) + 1;
    return !off;
  });

  finish({ findings: kept, scannedFiles, notes, suppressedByPolicy, options });
}

interface Outcome {
  findings: Finding[];
  scannedFiles: number;
  notes: string[];
  suppressedByPolicy?: Record<string, number>;
  options: ReleaseOptions;
}

function finish({ findings, scannedFiles, notes, suppressedByPolicy, options }: Outcome): void {
  const verdict = determineVerdict(findings);

  const result: ScanResult = {
    gate: 'release',
    verdict,
    timestamp: new Date().toISOString(),
    scannedFiles,
    findings,
    overrides: [],
    ...(suppressedByPolicy && Object.keys(suppressedByPolicy).length > 0 ? { suppressedByPolicy } : {}),
    ...(notes.length > 0 ? { notes } : {}),
  };

  if (options.json) {
    printJsonResult(result);
  } else {
    printResult(result);
  }

  if (verdict === 'HARD_BLOCK' || verdict === 'SOFT_BLOCK') {
    process.exitCode = 1;
  }
}

interface PackageJson {
  name?: string;
  version?: string;
  files?: unknown;
}

function readPackageJson(path: string): PackageJson {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf-8'));
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('expected a JSON object');
    return parsed as PackageJson;
  } catch (error) {
    throw new GuardError(`Cannot read ${path}: ${(error as Error).message}`);
  }
}

/**
 * What `npm pack` would publish, with the user's own npm configuration, so that the list is the
 * one `npm publish` would use. `--ignore-scripts` keeps it from running the package's own `prepack`
 * and `prepare` scripts: the gate runs on code that has not been reviewed yet, and a script's
 * output would also end up in the JSON. Build the package before running the gate.
 *
 * Settings in `.npmrc` or the environment (workspaces) can point npm at another package than the
 * one in this directory. Then the file list is not for what is here, so the gate stops.
 */
function artifactFromNpm(): Artifact {
  const pkgPath = 'package.json';
  if (!existsSync(pkgPath)) {
    throw new GuardError(
      'There is no package.json here and no --dir to look at. Run this from the package root, or pass --dir <directory>.',
    );
  }
  const pkg = readPackageJson(pkgPath);

  let output: string;
  try {
    output = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: MAX_NPM_OUTPUT,
    });
  } catch (error) {
    const stderr = (error as { stderr?: Buffer | string }).stderr;
    const why = (stderr ? String(stderr) : (error as Error).message).trim();
    throw new GuardError(`npm pack failed, so the files that would be published are unknown: ${why}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(output);
  } catch {
    throw new GuardError('npm pack did not print the JSON file list that the release gate reads.');
  }
  if (!Array.isArray(data) || data.length !== 1) {
    throw new GuardError(
      `npm pack listed ${Array.isArray(data) ? data.length : 'no'} packages, not exactly one. A workspace setting in .npmrc or the environment is probably in effect: run the gate from the package directory without it.`,
    );
  }
  const pack = data[0] as { name?: string; version?: string; files?: { path?: unknown }[] };
  if (!Array.isArray(pack.files)) {
    throw new GuardError('npm pack printed no file list, so the files that would be published are unknown.');
  }
  if ((pkg.name !== undefined && pack.name !== pkg.name) || (pkg.version !== undefined && pack.version !== pkg.version)) {
    throw new GuardError(
      `npm would pack ${pack.name}@${pack.version}, but this directory is ${pkg.name}@${pkg.version}. A workspace setting in .npmrc or the environment points npm elsewhere, so the files listed are not the ones here.`,
    );
  }

  const files = pack.files.map(file => {
    if (typeof file.path !== 'string') throw new GuardError('npm pack printed a file entry without a path.');
    return file.path.split('\\').join('/');
  });
  return { root: process.cwd(), files, nonRegular: [] };
}

/**
 * Everything under the directory, nothing skipped: a tarball of it would carry `node_modules` and
 * `.git`, and a `.git/config` often holds a URL with credentials. Links, pipes and devices are not
 * followed or opened, but they are reported.
 */
function artifactFromDirectory(dir: string): Artifact {
  const root = resolve(dir);
  let isDirectory = false;
  try {
    isDirectory = lstatSync(root).isDirectory();
  } catch {
    // reported below
  }
  if (!isDirectory) throw new GuardError(`--dir ${dir} is not a directory.`);

  const files: string[] = [];
  const nonRegular: Artifact['nonRegular'] = [];
  const posix = (path: string): string => relative(root, path).split(sep).join('/');

  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile()) files.push(posix(fullPath));
      else if (entry.isSymbolicLink()) nonRegular.push({ path: posix(fullPath), what: 'a symbolic link' });
      else nonRegular.push({ path: posix(fullPath), what: 'not a regular file (a pipe, socket or device)' });
    }
  };
  walk(root);
  return { root, files, nonRegular };
}

type Loaded = { text: string; size: number } | { text: null; size: number; reason: string };

/**
 * The file's text, or the reason it could not be read. A file that cannot be read at all is an
 * error; one that is too large or not a regular file becomes a finding.
 *
 * The bytes are decoded as Latin-1 with NUL bytes removed. Every secret pattern is ASCII, and this
 * reads UTF-8, UTF-16 (with or without a byte order mark) and text padded with NULs alike, where a
 * UTF-8 decoder would see none of them. A file is never skipped for "looking binary".
 */
function readForScan(root: string, file: string, cap: number): Loaded {
  const path = join(root, file);
  try {
    const stats = lstatSync(path);
    if (!stats.isFile()) return { text: null, size: 0, reason: 'it is not a regular file' };
    if (stats.size > cap) {
      return { text: null, size: stats.size, reason: `it is larger than ${cap} bytes (LLLL_GUARD_MAX_FILE_BYTES)` };
    }
    return { text: readFileSync(path).toString('latin1').replace(/\0/g, ''), size: stats.size };
  } catch (error) {
    throw new GuardError(`Cannot read ${file} to scan it: ${(error as Error).message}`);
  }
}

function hasFilesField(packageJsonPath: string): boolean {
  try {
    return Array.isArray(readPackageJson(packageJsonPath).files);
  } catch {
    return false;
  }
}

function determineVerdict(findings: Finding[]): Verdict {
  if (findings.some(f => f.severity === 'HARD_BLOCK')) return 'HARD_BLOCK';
  if (findings.some(f => f.severity === 'SOFT_BLOCK' && !f.overridden)) return 'SOFT_BLOCK';
  if (findings.some(f => f.severity === 'WARN')) return 'WARN';
  return 'PASS';
}
