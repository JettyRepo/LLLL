import { chmodSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { knownBug } from '../helpers/known-bug.js';
import { Sandbox } from '../helpers/repo.js';

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

describe('install-hook', () => {
  it('installs a pre-push hook in a plain repository', () => {
    const res = sb.run(['install-hook']);

    expect(res.code).toBe(0);
    expect(sb.exists('.git/hooks/pre-push')).toBe(true);
  });

  knownBug('installs into a linked worktree (audit H-11)', () => {
    const wt = join(sb.root, 'wt');
    sb.git(['worktree', 'add', wt, '-b', 'wt-branch']);

    const res = sb.run(['install-hook'], { cwd: wt });

    // `.git` is a file in a worktree, so writing to `.git/hooks` throws ENOTDIR.
    expect(res.code).toBe(0);
    expect(sb.exists('pre-push', hooksDir(wt))).toBe(true);
  });

  knownBug('honours core.hooksPath, for example husky (audit H-11)', () => {
    sb.git(['config', 'core.hooksPath', '.husky']);
    mkdirSync(join(sb.work, '.husky'), { recursive: true });

    sb.run(['install-hook']);

    // Git reads hooks from .husky; a hook written to .git/hooks never runs.
    expect(sb.exists('.husky/pre-push')).toBe(true);
  });

  knownBug('keeps an existing third-party hook when --force is used (audit H-11)', () => {
    const dir = hooksDir(sb.work);
    sb.write('pre-push', '#!/bin/sh\n# CUSTOM_MARKER\nexit 0\n', dir);
    chmodSync(join(dir, 'pre-push'), 0o755);

    sb.run(['install-hook', '--force']);

    // Either chained or backed up, the original hook body must survive somewhere.
    const survives = readdirSync(dir).some(name => {
      try {
        return readFileSync(join(dir, name), 'utf-8').includes('CUSTOM_MARKER');
      } catch {
        return false;
      }
    });
    expect(survives).toBe(true);
  });

  knownBug('does not run a network-fetching npx of the unscoped name (audit H-4)', () => {
    sb.run(['install-hook']);

    const hook = sb.read('.git/hooks/pre-push');

    // `npm view llll-guard` is 404: whoever registers that name would run code on every push.
    expect(hook).not.toMatch(/npx\s+llll-guard/);
  });

  knownBug('forwards git arguments and stdin to the engine (audit C-5)', () => {
    sb.run(['install-hook']);

    const hook = sb.read('.git/hooks/pre-push');

    expect(hook).toContain('"$@"');
  });

  it.todo('the hook execs the shim, so it keeps working after nvm or volta switches node versions');
  it.todo('a legacy hook that calls `guard push` with no arguments is recognised or rewritten on first run');
});
