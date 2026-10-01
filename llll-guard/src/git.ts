import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { StringDecoder } from 'node:string_decoder';
import { GuardError } from './errors.js';

/** Arguments are always passed as an array, so nothing here reaches a shell. */
export class GitError extends GuardError {
  constructor(args: string[], stderr: string) {
    super(`git ${args.join(' ')} failed: ${stderr.trim() || 'no error output'}`);
    this.name = 'GitError';
  }
}

const MAX_BUFFER = 256 * 1024 * 1024;

/** Runs git and returns stdout without the trailing newline. Throws GitError on failure. */
export function git(args: string[], opts: { cwd?: string } = {}): string {
  try {
    return execFileSync('git', args, {
      cwd: opts.cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: MAX_BUFFER,
    }).replace(/\n$/, '');
  } catch (error) {
    const stderr = (error as { stderr?: Buffer | string }).stderr;
    throw new GitError(args, stderr ? String(stderr) : (error as Error).message);
  }
}

/** Runs git and returns stdout, or null when git exits non-zero. */
export function gitTry(args: string[], opts: { cwd?: string } = {}): string | null {
  try {
    return git(args, opts);
  } catch {
    return null;
  }
}

export function gitOk(args: string[], opts: { cwd?: string } = {}): boolean {
  return gitTry(args, opts) !== null;
}

/**
 * The content of the regular file `path` as it is in commit `rev`, or null if the commit has no
 * such path. A directory, a symbolic link or a submodule at that path is an error: reading it
 * as text would hand the guard a directory listing or a link target to treat as its policy.
 * A real failure (not a repository, a bad object) throws instead of reading as "no file".
 */
export function gitShowFile(rev: string, path: string): string | null {
  // --full-tree: paths are relative to the repository root, not to the directory we run in.
  const entry = git(['ls-tree', '--full-tree', '-z', rev, '--', path]);
  if (entry === '') return null;

  const match = /^(\d+) (\w+) ([0-9a-f]+)\t/.exec(entry);
  if (!match) throw new GitError(['ls-tree', rev, path], `unexpected output: ${JSON.stringify(entry.slice(0, 80))}`);
  const [, mode, type, oid] = match;
  if (type !== 'blob' || (mode !== '100644' && mode !== '100755')) {
    const what = type === 'blob' ? 'a symbolic link' : `a ${type === 'tree' ? 'directory' : type}`;
    throw new GuardError(`${path} at ${rev.slice(0, 12)} is ${what}, not a regular file. The guard will not read its policy from it.`);
  }
  // cat-file, not show: no text conversion is applied to a blob read this way.
  return git(['cat-file', 'blob', oid]);
}

/**
 * True if the commit exists locally. `rev-parse --verify --quiet` exits 1 for a missing
 * object and something else (usually 128) for a real failure; only the first is an answer.
 */
export function commitExists(sha: string): boolean {
  const args = ['rev-parse', '--verify', '--quiet', `${sha}^{commit}`];
  const result = spawnSync('git', args, { encoding: 'utf-8', stdio: ['ignore', 'ignore', 'pipe'] });
  if (result.error) throw new GitError(args, result.error.message);
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new GitError(args, result.stderr ?? '');
}

/**
 * Streams git's stdout line by line, so a huge diff is never held in memory and
 * never truncated. Throws GitError if git exits non-zero.
 */
export async function* gitLines(args: string[], opts: { cwd?: string } = {}): AsyncGenerator<string> {
  const child = spawn('git', args, { cwd: opts.cwd, stdio: ['ignore', 'pipe', 'pipe'] });

  let stderr = '';
  child.stderr.setEncoding('utf-8');
  child.stderr.on('data', (chunk: string) => {
    stderr += chunk;
  });

  const exited = new Promise<number | null>((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => resolve(code));
  });
  // Avoid an unhandled rejection if the consumer stops early.
  exited.catch(() => undefined);

  // Split on "\n" only. git does, and readline would also split on a lone "\r", which
  // hides everything after it from the scanner (a file with classic Mac line endings).
  const decoder = new StringDecoder('utf8');
  let pending = '';
  for await (const chunk of child.stdout) {
    pending += decoder.write(chunk as Buffer);
    const parts = pending.split('\n');
    pending = parts.pop() ?? '';
    for (const part of parts) yield part;
  }
  pending += decoder.end();
  if (pending !== '') yield pending;

  const code = await exited;
  if (code !== 0) {
    throw new GitError(args, stderr);
  }
}
