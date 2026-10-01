import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export const PKG_ROOT = resolve(HERE, '..', '..');
export const REPO_ROOT = resolve(PKG_ROOT, '..');
/** The CLI built by tests/helpers/global-setup.ts. */
export const CLI = join(PKG_ROOT, '.test-dist', 'index.js');
/** The bash guard script at the repository root. */
export const BASH_GUARD = join(REPO_ROOT, 'guard');

export interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * Environment that keeps the developer's own git configuration (global
 * `core.hooksPath`, husky, an installed LLLL hook) out of the fixtures, and
 * pins the author so commits work on a clean CI machine.
 */
export function isolatedEnv(home: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('GIT_') || key === 'HOME' || key === 'XDG_CONFIG_HOME') continue;
    env[key] = value;
  }
  return {
    ...env,
    HOME: home,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Test Author',
    GIT_AUTHOR_EMAIL: 'author@example.com',
    GIT_COMMITTER_NAME: 'Test Author',
    GIT_COMMITTER_EMAIL: 'author@example.com',
    GIT_TERMINAL_PROMPT: '0',
    npm_config_update_notifier: 'false',
    npm_config_fund: 'false',
    npm_config_audit: 'false',
  };
}

/** A throwaway working repository with a bare `origin` that already has `main`. */
export class Sandbox {
  readonly root: string;
  readonly home: string;
  readonly remote: string;
  readonly work: string;
  readonly env: NodeJS.ProcessEnv;

  private constructor(root: string) {
    this.root = root;
    this.home = join(root, 'home');
    this.remote = join(root, 'remote.git');
    this.work = join(root, 'work');
    this.env = isolatedEnv(this.home);
  }

  static create(): Sandbox {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'llll-guard-')));
    const sb = new Sandbox(root);
    mkdirSync(sb.home, { recursive: true });
    mkdirSync(sb.work, { recursive: true });

    sb.git(['init', '--bare', '-b', 'main', sb.remote], sb.root);
    sb.git(['init', '-b', 'main'], sb.work);
    sb.git(['remote', 'add', 'origin', sb.remote]);
    sb.commit({ 'README.txt': 'seed\n' }, 'seed');
    sb.git(['push', '-u', 'origin', 'main']);
    return sb;
  }

  cleanup(): void {
    rmSync(this.root, { recursive: true, force: true });
  }

  git(args: string[], cwd: string = this.work): string {
    return execFileSync('git', args, {
      cwd,
      env: this.env,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  }

  path(rel: string, cwd: string = this.work): string {
    return join(cwd, rel);
  }

  write(rel: string, content: string, cwd: string = this.work): void {
    const file = this.path(rel, cwd);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }

  read(rel: string, cwd: string = this.work): string {
    return readFileSync(this.path(rel, cwd), 'utf-8');
  }

  exists(rel: string, cwd: string = this.work): boolean {
    return existsSync(this.path(rel, cwd));
  }

  /** Writes the files, commits them and returns the new commit sha. */
  commit(files: Record<string, string>, message = 'change', cwd: string = this.work): string {
    for (const [rel, content] of Object.entries(files)) {
      this.write(rel, content, cwd);
    }
    this.git(['add', '-A'], cwd);
    this.git(['commit', '-q', '-m', message], cwd);
    return this.git(['rev-parse', 'HEAD'], cwd);
  }

  /**
   * Commits the files and pushes them to `origin/main` without any hook, so the remote already has
   * them. The guard reads its policy from what the remote has, so a test that wants a policy in
   * force publishes it first.
   */
  publish(files: Record<string, string>, message = 'publish', cwd: string = this.work): string {
    const sha = this.commit(files, message, cwd);
    this.git(['push', 'origin', 'main'], cwd);
    return sha;
  }

  switchNew(branch: string, cwd: string = this.work): void {
    this.git(['switch', '-c', branch], cwd);
  }

  /**
   * Creates `count` tiny commits on `branch` on top of `from` in one step, using
   * `git fast-import`, and returns the tip sha. Far faster than `count` real commits.
   */
  fastImportCommits(branch: string, count: number, from: string, cwd: string = this.work): string {
    const parts: string[] = [];
    for (let i = 1; i <= count; i++) {
      const message = `bulk ${i}`;
      const content = `${i}\n`;
      parts.push(
        `commit refs/heads/${branch}`,
        `committer Test Author <author@example.com> ${1_700_000_000 + i} +0000`,
        `data ${Buffer.byteLength(message)}`,
        message,
      );
      if (i === 1) parts.push(`from ${from}`);
      parts.push('M 100644 inline bulk.txt', `data ${Buffer.byteLength(content)}`, content);
    }
    const result = spawnSync('git', ['fast-import', '--quiet'], {
      cwd,
      env: this.env,
      input: parts.join('\n') + '\n',
      encoding: 'utf-8',
      maxBuffer: 64 * 1024 * 1024,
    });
    if (result.status !== 0) {
      throw new Error(`git fast-import failed: ${result.stderr}`);
    }
    return this.git(['rev-parse', branch], cwd);
  }

  /** Runs `llll-guard hook pre-push` the way git does: remote name and URL as arguments, refs on stdin. */
  runPrePushHook(
    lines: string[],
    opts: {
      cwd?: string;
      remoteName?: string;
      remoteUrl?: string;
      json?: boolean;
      env?: NodeJS.ProcessEnv;
    } = {},
  ): RunResult {
    const args = ['hook', 'pre-push', opts.remoteName ?? 'origin', opts.remoteUrl ?? this.remote];
    if (opts.json ?? true) args.push('--json');
    return this.run(args, {
      cwd: opts.cwd,
      input: lines.length > 0 ? lines.join('\n') + '\n' : '',
      env: opts.env,
    });
  }

  /** Runs the built TypeScript CLI. `env` is merged over the isolated environment. */
  run(args: string[], opts: { cwd?: string; input?: string; env?: NodeJS.ProcessEnv } = {}): RunResult {
    return this.spawn(process.execPath, [CLI, ...args], {
      cwd: opts.cwd,
      input: opts.input,
      env: opts.env ? { ...this.env, ...opts.env } : undefined,
    });
  }

  spawn(
    command: string,
    args: string[],
    opts: { cwd?: string; input?: string; env?: NodeJS.ProcessEnv } = {},
  ): RunResult {
    const result = spawnSync(command, args, {
      cwd: opts.cwd ?? this.work,
      env: opts.env ?? this.env,
      input: opts.input ?? '',
      encoding: 'utf-8',
      timeout: 45_000,
      maxBuffer: 64 * 1024 * 1024,
    });
    return {
      code: result.status ?? -1,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
    };
  }
}

export interface JsonFinding {
  id: string;
  severity: string;
  file?: string;
  line?: number;
  match?: string;
  category?: string;
  commit?: string;
  overrideToken?: string;
  overridden?: boolean;
  overrideJustification?: string;
}

export interface JsonResult {
  verdict: string;
  scannedFiles: number;
  scannedCommits?: number;
  findings: JsonFinding[];
  overrides?: unknown[];
  suppressedByPolicy?: Record<string, number>;
}

export const ZERO_SHA = '0'.repeat(40);

/** One line of the pre-push hook's stdin: `<local ref> <local sha> <remote ref> <remote sha>`. */
export function prePushLine(localRef: string, localSha: string, remoteRef: string, remoteSha: string): string {
  return `${localRef} ${localSha} ${remoteRef} ${remoteSha}`;
}

/** Extracts the JSON document printed by `--json`. Returns null if there is none. */
export function parseJsonResult(stdout: string): JsonResult | null {
  const start = stdout.indexOf('{');
  if (start === -1) return null;
  try {
    return JSON.parse(stdout.slice(start)) as JsonResult;
  } catch {
    return null;
  }
}

/** Major version of the given bash binary, or 0 when it cannot be run. */
export function bashMajorVersion(bash: string): number {
  try {
    const out = execFileSync(bash, ['-c', 'echo "${BASH_VERSINFO[0]}"'], { encoding: 'utf-8' });
    return Number.parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}
