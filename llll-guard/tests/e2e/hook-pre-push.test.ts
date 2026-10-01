import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { CLI, Sandbox, ZERO_SHA, parseJsonResult, prePushLine } from '../helpers/repo.js';

// Audit finding covered here: C-5. `llll-guard hook pre-push <remote> <url>` is what the
// installed hook runs; git sends `<local ref> <local sha> <remote ref> <remote sha>` per
// ref on stdin. The range to scan comes from those lines, never from a guess.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

const leak = (): string => `const key = "${FAKE.awsKey}";\n`;
const clean = (): string => 'const a = 1;\n';

/** Pushes `main` so that its current content counts as already published. */
function publishMain(): void {
  sb.git(['push', 'origin', 'main']);
}

describe('hook pre-push: new refs', () => {
  it('scans only commits that are not on any remote branch, not the whole history', () => {
    sb.commit({ 'old.js': leak() }, 'old leak, already published');
    publishMain();
    sb.switchNew('feature/x');
    const sha = sb.commit({ 'ok.js': clean() }, 'clean change');

    const res = sb.runPrePushHook([
      prePushLine('refs/heads/feature/x', sha, 'refs/heads/feature/x', ZERO_SHA),
    ]);

    const result = parseJsonResult(res.stdout);
    expect(res.code).toBe(0);
    expect(result?.verdict).toBe('PASS');
    expect(result?.scannedCommits).toBe(1);
  });

  it('blocks a secret in a commit on a new branch', () => {
    sb.switchNew('feature/x');
    const sha = sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.runPrePushHook([
      prePushLine('refs/heads/feature/x', sha, 'refs/heads/feature/x', ZERO_SHA),
    ]);

    expect(res.code).toBe(1);
    expect(parseJsonResult(res.stdout)?.verdict).toBe('HARD_BLOCK');
  });

  it('treats the URL of a configured remote as that remote, so its published history is not re-scanned', () => {
    sb.commit({ 'old.js': leak() }, 'old leak, already published');
    publishMain();
    sb.switchNew('feature/x');
    const sha = sb.commit({ 'ok.js': clean() }, 'clean change');

    // git passes the URL, not the name, for a push such as `git push <url> branch`.
    const res = sb.runPrePushHook(
      [prePushLine('refs/heads/feature/x', sha, 'refs/heads/feature/x', ZERO_SHA)],
      { remoteName: `${sb.remote}/`, remoteUrl: `${sb.remote}/` },
    );

    expect(res.code).toBe(0);
  });

  it('scans everything when pushing to a remote it cannot match to a configured one', () => {
    sb.commit({ 'old.js': leak() }, 'leak that exists on origin only');
    publishMain();
    sb.switchNew('feature/x');
    const sha = sb.commit({ 'ok.js': clean() }, 'clean change');
    const other = join(sb.root, 'other.git');
    sb.git(['init', '--bare', '-b', 'main', other], sb.root);

    const res = sb.runPrePushHook(
      [prePushLine('refs/heads/feature/x', sha, 'refs/heads/feature/x', ZERO_SHA)],
      { remoteName: other, remoteUrl: other },
    );

    // Nothing is known about what `other` already has, and the old leak would be published there.
    expect(res.code).toBe(1);
  });

  it('blocks a new secret when pushing to a remote given by URL', () => {
    sb.switchNew('feature/x');
    const sha = sb.commit({ 'src/config.js': leak() }, 'add config');
    const other = join(sb.root, 'other.git');
    sb.git(['init', '--bare', '-b', 'main', other], sb.root);

    const res = sb.runPrePushHook(
      [prePushLine('refs/heads/feature/x', sha, 'refs/heads/feature/x', ZERO_SHA)],
      { remoteName: other, remoteUrl: other },
    );

    expect(res.code).toBe(1);
  });

  it('scans a first push to an empty remote, where no remote branch exists yet', () => {
    const solo = join(sb.root, 'solo');
    mkdirSync(solo);
    sb.git(['init', '-b', 'main'], solo);
    sb.commit({ 'readme.txt': 'hello\n' }, 'first', solo);
    const sha = sb.commit({ 'src/config.js': leak() }, 'add config', solo);

    const res = sb.runPrePushHook(
      [prePushLine('refs/heads/main', sha, 'refs/heads/main', ZERO_SHA)],
      { cwd: solo, remoteName: 'origin', remoteUrl: join(sb.root, 'empty.git') },
    );

    expect(res.code).toBe(1);
  });

  it('scans every commit of a large import within a reasonable time', () => {
    const base = sb.git(['rev-parse', 'HEAD']);
    const tip = sb.fastImportCommits('bulk', 1200, base);
    const started = Date.now();

    const res = sb.runPrePushHook([prePushLine('refs/heads/bulk', tip, 'refs/heads/bulk', ZERO_SHA)]);

    expect(res.code).toBe(0);
    expect(Date.now() - started).toBeLessThan(30_000);
    expect(parseJsonResult(res.stdout)?.scannedCommits).toBe(1200);
  });

  it('refuses to pass a partial scan when the outgoing commits exceed the limit', () => {
    const base = sb.git(['rev-parse', 'HEAD']);
    const tip = sb.fastImportCommits('bulk', 1200, base);

    const res = sb.runPrePushHook([prePushLine('refs/heads/bulk', tip, 'refs/heads/bulk', ZERO_SHA)], {
      env: { LLLL_GUARD_MAX_COMMITS: '1000' },
    });

    // Skipping the oldest commits and exiting 0 would let a secret hide in them.
    expect(res.code).toBe(2);
    expect(res.stderr).toMatch(/1200.*limit of 1000/);
  });

  it('rejects a non-numeric LLLL_GUARD_MAX_COMMITS instead of silently using the default', () => {
    const sha = sb.commit({ 'ok.js': clean() }, 'clean change');

    const res = sb.runPrePushHook([prePushLine('refs/heads/main', sha, 'refs/heads/main', ZERO_SHA)], {
      env: { LLLL_GUARD_MAX_COMMITS: 'lots' },
    });

    expect(res.code).toBe(2);
    expect(res.stderr).toContain('LLLL_GUARD_MAX_COMMITS');
  });
});

describe('push --stdin (for a legacy hook that still calls `push`)', () => {
  it('reads the pushed refs from stdin and blocks a secret on a new branch', () => {
    sb.switchNew('feature/x');
    const sha = sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.run(['push', '--stdin', '--json'], {
      input: prePushLine('refs/heads/feature/x', sha, 'refs/heads/feature/x', ZERO_SHA) + '\n',
    });

    expect(res.code).toBe(1);
  });

  it('passes a clean new branch', () => {
    sb.switchNew('feature/x');
    const sha = sb.commit({ 'ok.js': clean() }, 'clean change');

    const res = sb.run(['push', '--stdin', '--json'], {
      input: prePushLine('refs/heads/feature/x', sha, 'refs/heads/feature/x', ZERO_SHA) + '\n',
    });

    expect(res.code).toBe(0);
  });
});

describe('hook pre-push: existing refs', () => {
  it('scans remote-sha..local-sha for a normal push', () => {
    const remoteSha = sb.git(['rev-parse', 'HEAD']);
    const sha = sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.runPrePushHook([prePushLine('refs/heads/main', sha, 'refs/heads/main', remoteSha)]);

    expect(res.code).toBe(1);
  });

  it('does not fail with "bad object" when the remote sha is unknown locally (force-push)', () => {
    const unknown = 'a'.repeat(40);
    const sha = sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.runPrePushHook([prePushLine('refs/heads/main', sha, 'refs/heads/main', unknown)]);

    expect(res.code).toBe(1);
    expect(parseJsonResult(res.stdout)?.verdict).toBe('HARD_BLOCK');
  });

  it('passes a clean force-push whose remote sha is unknown locally', () => {
    const unknown = 'a'.repeat(40);
    const sha = sb.commit({ 'ok.js': clean() }, 'clean change');

    const res = sb.runPrePushHook([prePushLine('refs/heads/main', sha, 'refs/heads/main', unknown)]);

    expect(res.code).toBe(0);
  });

  it('catches a secret introduced while resolving a merge conflict', () => {
    sb.commit({ 'f.js': 'line\n' }, 'base');
    publishMain();
    const remoteSha = sb.git(['rev-parse', 'HEAD']);
    sb.switchNew('feature/side');
    sb.commit({ 'f.js': 'from side\n' }, 'side change');
    sb.git(['switch', 'main']);
    sb.commit({ 'f.js': 'from main\n' }, 'main change');
    try {
      sb.git(['merge', 'feature/side']);
    } catch {
      // the conflict is expected
    }
    sb.write('f.js', leak());
    sb.git(['add', 'f.js']);
    sb.git(['commit', '-q', '--no-edit']);
    const tip = sb.git(['rev-parse', 'HEAD']);

    const res = sb.runPrePushHook([prePushLine('refs/heads/main', tip, 'refs/heads/main', remoteSha)]);

    expect(res.code).toBe(1);
    expect(parseJsonResult(res.stdout)?.findings.some(f => f.id === 'PG-H001')).toBe(true);
  });

  it('checks every ref git reports', () => {
    const remoteSha = sb.git(['rev-parse', 'HEAD']);
    const cleanSha = sb.commit({ 'ok.js': clean() }, 'clean change');
    sb.switchNew('feature/leaky');
    const leakySha = sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.runPrePushHook([
      prePushLine('refs/heads/main', cleanSha, 'refs/heads/main', remoteSha),
      prePushLine('refs/heads/feature/leaky', leakySha, 'refs/heads/feature/leaky', ZERO_SHA),
    ]);

    expect(res.code).toBe(1);
  });
});

describe('hook pre-push: nothing to scan', () => {
  it('passes when git sends no refs', () => {
    const res = sb.runPrePushHook([], { json: false });

    expect(res.code).toBe(0);
  });

  it('skips a ref that is being deleted', () => {
    const res = sb.runPrePushHook([prePushLine('(delete)', ZERO_SHA, 'refs/heads/old', 'b'.repeat(40))]);

    expect(res.code).toBe(0);
  });

  it('exits 2 on a malformed line instead of guessing', () => {
    const res = sb.runPrePushHook(['this is not a ref line']);

    expect(res.code).toBe(2);
  });

  it('rejects an unknown hook name', () => {
    const res = sb.run(['hook', 'post-commit']);

    expect(res.code).toBe(2);
  });
});

describe('through a real `git push`', () => {
  /**
   * A minimal pre-push hook that runs the engine the way the installed hook will after P6.
   * Until then `install-hook` still writes the old `npx llll-guard push` hook
   * (see hook-install.test.ts for the known-bug tests that cover it).
   */
  function installEngineHook(): void {
    const hook = join(sb.work, '.git', 'hooks', 'pre-push');
    writeFileSync(hook, `#!/bin/sh\nexec "${process.execPath}" "${CLI}" hook pre-push "$@"\n`);
    chmodSync(hook, 0o755);
  }

  const remoteHas = (branch: string): boolean =>
    sb.git(['ls-remote', '--heads', 'origin', branch]).length > 0;

  it('rejects the first push of a new branch that contains a secret, and nothing reaches the remote', () => {
    installEngineHook();
    sb.switchNew('feature/x');
    sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.spawn('git', ['push', '-u', 'origin', 'feature/x']);

    expect(res.code).not.toBe(0);
    expect(remoteHas('feature/x')).toBe(false);
  });

  it('lets a clean new branch through', () => {
    installEngineHook();
    sb.switchNew('feature/clean');
    sb.commit({ 'ok.js': clean() }, 'clean change');

    const res = sb.spawn('git', ['push', '-u', 'origin', 'feature/clean']);

    expect(res.code).toBe(0);
    expect(remoteHas('feature/clean')).toBe(true);
  });

  it('rejects a push whose net diff is clean but whose history contains a secret', () => {
    installEngineHook();
    sb.switchNew('feature/history');
    sb.commit({ 'src/config.js': leak() }, 'add key');
    sb.commit({ 'src/config.js': 'const key = process.env.KEY;\n' }, 'remove key');

    const res = sb.spawn('git', ['push', '-u', 'origin', 'feature/history']);

    expect(res.code).not.toBe(0);
    expect(remoteHas('feature/history')).toBe(false);
  });

  it('does not re-scan history that is already on the remote', () => {
    sb.commit({ 'old.js': leak() }, 'old leak, pushed before the guard existed');
    publishMain();
    installEngineHook();
    sb.switchNew('feature/later');
    sb.commit({ 'ok.js': clean() }, 'clean change');

    const res = sb.spawn('git', ['push', '-u', 'origin', 'feature/later']);

    expect(res.code).toBe(0);
  });

  it('rejects a force-push that overwrites the remote branch with a secret', () => {
    installEngineHook();
    sb.commit({ 'ok.js': clean() }, 'clean change');
    expect(sb.spawn('git', ['push', 'origin', 'main']).code).toBe(0);
    sb.git(['reset', '--hard', 'HEAD~1']);
    sb.commit({ 'src/config.js': leak() }, 'rewritten with a secret');

    const res = sb.spawn('git', ['push', '--force', 'origin', 'main']);

    expect(res.code).not.toBe(0);
  });

  it('allows deleting a remote branch', () => {
    installEngineHook();
    sb.switchNew('feature/gone');
    sb.commit({ 'ok.js': clean() }, 'clean change');
    expect(sb.spawn('git', ['push', '-u', 'origin', 'feature/gone']).code).toBe(0);

    const res = sb.spawn('git', ['push', 'origin', '--delete', 'feature/gone']);

    expect(res.code).toBe(0);
    expect(remoteHas('feature/gone')).toBe(false);
  });
});
