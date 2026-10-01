import { chmodSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { CLI, BASH_GUARD, Sandbox, ZERO_SHA, prePushLine } from '../helpers/repo.js';

// Audit findings covered here: H-11 (worktrees, core.hooksPath, existing hooks),
// H-4 (the hook must not run a network-fetching `npx` of an unscoped name),
// C-5 (the hook must forward git's arguments and stdin).

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

function hooksDir(cwd: string): string {
  return resolve(cwd, sb.git(['rev-parse', '--git-path', 'hooks'], cwd));
}

function writeHook(dir: string, body: string): void {
  mkdirSync(dir, { recursive: true });
  sb.write('pre-push', body, dir);
  chmodSync(join(dir, 'pre-push'), 0o755);
}

/** Installs through the launcher, as a user does, with the engine pointed at the test build. */
function install(args: string[] = [], cwd?: string) {
  return sb.spawn('/bin/bash', [BASH_GUARD, 'install-hook', ...args], { cwd, env: { ...sb.env, LLLL_GUARD_BIN: CLI } });
}

/** Runs the installed hook the way git does. */
function runHook(dir: string, input: string, env: NodeJS.ProcessEnv = {}) {
  return sb.spawn(join(dir, 'pre-push'), ['origin', sb.remote], {
    input,
    env: { ...sb.env, LLLL_GUARD_BIN: CLI, ...env },
  });
}

describe('install-hook', () => {
  it('installs a pre-push hook in a plain repository', () => {
    const res = sb.run(['install-hook']);

    expect(res.code).toBe(0);
    expect(sb.exists('.git/hooks/pre-push')).toBe(true);
  });

  it('installs into a linked worktree (audit H-11)', () => {
    const wt = join(sb.root, 'wt');
    sb.git(['worktree', 'add', wt, '-b', 'wt-branch']);

    const res = sb.run(['install-hook'], { cwd: wt });

    expect(res.code).toBe(0);
    expect(sb.exists('pre-push', hooksDir(wt))).toBe(true);
  });

  it('honours core.hooksPath, for example husky (audit H-11)', () => {
    sb.git(['config', 'core.hooksPath', '.husky']);
    mkdirSync(join(sb.work, '.husky'), { recursive: true });

    sb.run(['install-hook']);

    expect(sb.exists('.husky/pre-push')).toBe(true);
  });

  it('keeps an existing third-party hook when --force is used (audit H-11)', () => {
    const dir = hooksDir(sb.work);
    writeHook(dir, '#!/bin/sh\n# CUSTOM_MARKER\nexit 0\n');

    sb.run(['install-hook', '--force']);

    const survives = readdirSync(dir).some(name => {
      try {
        return readFileSync(join(dir, name), 'utf-8').includes('CUSTOM_MARKER');
      } catch {
        return false;
      }
    });
    expect(survives).toBe(true);
    expect(readdirSync(dir).some(name => name.startsWith('pre-push.bak.'))).toBe(true);
  });

  it('does not run a network-fetching npx of the unscoped name (audit H-4)', () => {
    sb.run(['install-hook']);

    expect(sb.read('.git/hooks/pre-push')).not.toMatch(/npx\s+llll-guard/);
  });

  it('forwards git arguments and stdin to the engine (audit C-5)', () => {
    sb.run(['install-hook']);

    const hook = sb.read('.git/hooks/pre-push');

    expect(hook).toContain('"$@"');
    expect(hook).toContain('< "$input"');
  });

  it('is idempotent: a second install refreshes the hook and does not chain it to itself', () => {
    sb.run(['install-hook']);
    const first = sb.read('.git/hooks/pre-push');

    const res = sb.run(['install-hook']);

    expect(res.code).toBe(0);
    expect(sb.read('.git/hooks/pre-push')).toBe(first);
    expect(sb.exists('.git/hooks/pre-push.pre-llll')).toBe(false);
  });

  it('chains an existing hook of yours: it runs after the guard, with the same stdin and arguments', () => {
    const dir = hooksDir(sb.work);
    writeHook(dir, '#!/bin/sh\necho "ARGS:$1" > "$(dirname "$0")/chained.out"\ncat >> "$(dirname "$0")/chained.out"\nexit 0\n');

    const res = sb.run(['install-hook']);
    expect(res.code).toBe(0);
    expect(sb.exists('.git/hooks/pre-push.pre-llll')).toBe(true);

    const head = sb.git(['rev-parse', 'HEAD']);
    const line = prePushLine('refs/heads/main', head, 'refs/heads/main', head);
    const run = runHook(dir, `${line}\n`);

    expect(run.code).toBe(0);
    const out = sb.read('chained.out', dir);
    expect(out).toContain('ARGS:origin');
    expect(out).toContain(line);
  });

  it('does not run the chained hook when the guard blocks the push', () => {
    const dir = hooksDir(sb.work);
    writeHook(dir, '#!/bin/sh\ntouch "$(dirname "$0")/chained.ran"\nexit 0\n');
    sb.run(['install-hook']);

    const head = sb.commit({ 'src/config.js': `const key = "${FAKE.awsKey}";\n` });
    const run = runHook(dir, `${prePushLine('refs/heads/main', head, 'refs/heads/main', ZERO_SHA)}\n`);

    expect(run.code).toBe(1);
    expect(sb.exists('chained.ran', dir)).toBe(false);
  });

  it('stops the push when the chained hook fails', () => {
    const dir = hooksDir(sb.work);
    writeHook(dir, '#!/bin/sh\nexit 7\n');
    sb.run(['install-hook']);

    const head = sb.git(['rev-parse', 'HEAD']);
    const run = runHook(dir, `${prePushLine('refs/heads/main', head, 'refs/heads/main', head)}\n`);

    expect(run.code).toBe(7);
  });

  it('replaces a hook written by an earlier version instead of chaining it', () => {
    const dir = hooksDir(sb.work);
    writeHook(dir, '#!/usr/bin/env bash\n# LLLL Guard — Pre-Push Compliance Gate\n# Installed by: guard install-hook\nexec guard push\n');

    sb.run(['install-hook']);

    expect(sb.exists('pre-push.pre-llll', dir)).toBe(false);
    expect(sb.read('pre-push', dir)).toContain('LLLL-GUARD-MANAGED');
  });

  it('does not rename a hook that lives inside the project (husky): it says what line to add', () => {
    sb.git(['config', 'core.hooksPath', '.husky']);
    writeHook(join(sb.work, '.husky'), '#!/bin/sh\necho husky\n');

    const res = sb.run(['install-hook']);

    expect(res.code).toBe(2);
    expect(res.stderr).toContain('hook pre-push "$@"');
    expect(sb.read('.husky/pre-push')).toContain('echo husky');
    expect(sb.exists('.husky/pre-push.pre-llll')).toBe(false);
  });

  it('does not chain a hook manager (husky v4, overcommit), which would stop running silently', () => {
    const dir = hooksDir(sb.work);
    writeHook(dir, '#!/bin/sh\n. "$(dirname "$0")/husky.sh"\n');

    const res = sb.run(['install-hook']);

    expect(res.code).toBe(2);
    expect(res.stderr).toContain('hook manager');
    expect(sb.exists('pre-push.pre-llll', dir)).toBe(false);
    expect(sb.read('pre-push', dir)).toContain('husky.sh');
  });

  it('for husky 9 names the file husky does not regenerate', () => {
    sb.git(['config', 'core.hooksPath', '.husky/_']);
    writeHook(join(sb.work, '.husky/_'), '#!/bin/sh\n. "$(dirname "$0")/h"\n');

    const res = sb.run(['install-hook']);

    expect(res.code).toBe(2);
    expect(res.stderr).toContain(join('.husky', 'pre-push'));
    expect(res.stderr).toContain('reads standard input');
  });

  it('shell-quotes the launcher path, so a path with a quote or space cannot inject code', () => {
    const odd = join(sb.root, "it's here");
    mkdirSync(odd);
    sb.write('guard', '#!/bin/sh\n# LLLL-GUARD-SHIM\nexit 0\n', odd);
    chmodSync(join(odd, 'guard'), 0o755);

    sb.run(['install-hook', '--shim', join(odd, 'guard')]);

    const hook = sb.read('.git/hooks/pre-push');
    expect(hook).toContain(`'${odd.replace(/'/g, `'\\''`)}/guard'`);
    expect(runHook(hooksDir(sb.work), '').code).toBe(0);
  });
});

describe('install-hook: failure handling', () => {
  it('a launcher that exists but is not executable stops the push instead of reporting it missing', () => {
    const odd = join(sb.root, 'launcher');
    sb.write('guard', '#!/bin/sh\nexit 0\n', odd);
    chmodSync(join(odd, 'guard'), 0o644);
    sb.run(['install-hook', '--shim', join(odd, 'guard')]);

    const run = runHook(hooksDir(sb.work), '', { PATH: '/usr/bin:/bin' });

    expect(run.code).toBe(2);
    expect(run.stderr).toContain('not executable');
  });

  it('puts the hook of yours back when the new hook cannot be written', () => {
    const dir = hooksDir(sb.work);
    writeHook(dir, '#!/bin/sh\n# CUSTOM_MARKER\nexit 0\n');
    // A directory where the staged file goes makes the write fail after the chain move.
    mkdirSync(join(dir, 'pre-push.llll-new'));

    const res = sb.run(['install-hook']);

    expect(res.code).toBe(2);
    expect(sb.read('pre-push', dir)).toContain('CUSTOM_MARKER');
    expect(sb.exists('pre-push.pre-llll', dir)).toBe(false);
  });

  it('uninstall does not revive a pre-push.pre-llll that was never chained', () => {
    const dir = hooksDir(sb.work);
    writeHook(dir, '#!/bin/sh\n# LLLL Guard — Pre-Push Compliance Gate\nexec guard push\n');
    sb.write('pre-push.pre-llll', '#!/bin/sh\n# STRAY\n', dir);
    sb.run(['install-hook']);

    sb.run(['uninstall-hook']);

    expect(sb.exists('pre-push', dir)).toBe(false);
    expect(sb.read('pre-push.pre-llll', dir)).toContain('STRAY');
  });
});

describe('uninstall-hook', () => {
  it('removes the hook', () => {
    sb.run(['install-hook']);

    const res = sb.run(['uninstall-hook']);

    expect(res.code).toBe(0);
    expect(sb.exists('.git/hooks/pre-push')).toBe(false);
  });

  it('restores the hook it chained', () => {
    const dir = hooksDir(sb.work);
    writeHook(dir, '#!/bin/sh\n# CUSTOM_MARKER\nexit 0\n');
    sb.run(['install-hook']);

    sb.run(['uninstall-hook']);

    expect(sb.read('pre-push', dir)).toContain('CUSTOM_MARKER');
    expect(sb.exists('pre-push.pre-llll', dir)).toBe(false);
  });

  it('leaves a hook that is not ours alone', () => {
    const dir = hooksDir(sb.work);
    writeHook(dir, '#!/bin/sh\n# CUSTOM_MARKER\nexit 0\n');

    const res = sb.run(['uninstall-hook']);

    expect(res.stdout).toContain('left alone');
    expect(sb.read('pre-push', dir)).toContain('CUSTOM_MARKER');
  });

  it('says so when there is nothing to remove', () => {
    expect(sb.run(['uninstall-hook']).stdout).toContain('no pre-push hook');
  });
});

describe('the installed hook', () => {
  it('blocks a push with a leaked key and passes a clean one', () => {
    install();
    const dir = hooksDir(sb.work);

    const clean = sb.git(['rev-parse', 'HEAD']);
    expect(runHook(dir, `${prePushLine('refs/heads/main', clean, 'refs/heads/main', clean)}\n`).code).toBe(0);

    const dirty = sb.commit({ 'src/config.js': `const key = "${FAKE.awsKey}";\n` });
    expect(runHook(dir, `${prePushLine('refs/heads/main', dirty, 'refs/heads/main', ZERO_SHA)}\n`).code).toBe(1);
  });

  it('with no launcher and no llll-guard on PATH it warns and lets the push through (0.2.x), or stops it when strict', () => {
    sb.run(['install-hook', '--shim', join(sb.root, 'does-not-exist')]);
    const dir = hooksDir(sb.work);
    const env = { PATH: '/usr/bin:/bin' };

    const warn = sb.spawn(join(dir, 'pre-push'), ['origin', sb.remote], { env: { ...sb.env, ...env } });
    expect(warn.code).toBe(0);
    expect(warn.stderr).toContain('NOT checked');

    const strict = sb.spawn(join(dir, 'pre-push'), ['origin', sb.remote], {
      env: { ...sb.env, ...env, LLLL_GUARD_STRICT: '1' },
    });
    expect(strict.code).toBe(2);
  });
});
