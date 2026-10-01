import { spawn } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { CLI, Sandbox, parseJsonResult } from '../helpers/repo.js';

// Audit findings covered here: C-5 (range resolution), H-5 (large diffs),
// M-7 (exit codes). Manual mode: `llll-guard push` compares against the upstream.
// Hook mode (pre-push stdin) is covered in hook-pre-push.test.ts.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

const leak = (): string => `const key = "${FAKE.awsKey}";\n`;

describe('push (manual mode): what gets scanned', () => {
  it('blocks a secret in commits that are ahead of the tracked branch', () => {
    sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(1);
    expect(parseJsonResult(res.stdout)?.verdict).toBe('HARD_BLOCK');
  });

  it('never passes a secret on the first push of a new branch (audit C-5)', () => {
    sb.switchNew('feature/new');
    sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.run(['push', '--json']);

    // Either a block (1) or a tool error (2) is acceptable. Exit 0 is not.
    expect(res.code).not.toBe(0);
  });

  it('exits 2, not 0, when the branch has no upstream to compare against (audit C-5)', () => {
    sb.switchNew('feature/new');
    sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.run(['push']);

    expect(res.code).toBe(2);
    expect(res.stderr).toMatch(/upstream/i);
  });

  it('blocks a secret that one commit adds and the next commit removes (audit C-5)', () => {
    sb.commit({ 'src/config.js': leak() }, 'add key');
    sb.commit({ 'src/config.js': 'const key = process.env.KEY;\n' }, 'remove key');

    const res = sb.run(['push', '--json']);

    // Both commits are pushed, so the key is in history even though the net diff is clean.
    expect(res.code).toBe(1);
  });

  it('still scans the outgoing commits when the diff is larger than 1 MiB (audit H-5)', () => {
    const filler = `${'x'.repeat(79)}\n`.repeat(20_000);
    sb.commit({ 'vendor/blob.js': filler + leak() }, 'vendor blob');

    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(1);
  });

  it('accepts an explicit --range', () => {
    const base = sb.git(['rev-parse', 'HEAD']);
    sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.run(['push', '--range', `${base}..HEAD`, '--json']);

    expect(res.code).toBe(1);
  });

  it('passes when there is nothing outgoing', () => {
    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(0);
  });
});

describe('push (manual mode): errors and output', () => {
  it('exits 2 for a --range git cannot resolve (audit M-7)', () => {
    const res = sb.run(['push', '--range', 'no-such-ref..HEAD']);

    expect(res.code).toBe(2);
  });

  it('refuses a --range that looks like a git option', () => {
    const res = sb.run(['push', '--range', '--output=PWNED']);

    expect(res.code).toBe(2);
    expect(sb.exists('PWNED')).toBe(false);
  });

  it('exits 2 when llll.policy.json is not valid JSON (audit M-7)', () => {
    sb.write('llll.policy.json', '{ not json');
    sb.commit({ 'a.js': 'const a = 1;\n' });

    const res = sb.run(['push']);

    expect(res.code).toBe(2);
    expect(res.stderr).toContain('llll.policy.json');
  });

  it('refuses a negated pattern in .guardignore instead of silently ignoring every other file', () => {
    // minimatch reads "!keep.js" as "everything except keep.js".
    sb.write('.guardignore', '!keep.js\n');
    sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.run(['push']);

    expect(res.code).toBe(2);
    expect(res.stderr).toContain('negated pattern');
  });

  it('refuses a negated pattern in llll.policy.json excludePatterns', () => {
    sb.write('llll.policy.json', JSON.stringify({ excludePatterns: ['!keep.js'] }));
    sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.run(['push']);

    expect(res.code).toBe(2);
  });

  it.each([
    ['hardBlock set to null', { pushRules: { hardBlock: null } }],
    ['hardBlock set to 0', { pushRules: { hardBlock: 0 } }],
    ['softBlock given as a string', { pushRules: { softBlock: 'no' } }],
    ['disabledRules given as a string, which would match as a substring', { pushRules: { disabledRules: 'PG-H0' } }],
    ['disabledRules holding a non-string', { pushRules: { disabledRules: [1] } }],
    ['pushRules given as an array', { pushRules: [] }],
    ['enabled given as a string', { enabled: 'no' }],
    ['excludePatterns given as a string', { excludePatterns: '*.md' }],
  ])('refuses a policy file with %s, instead of weakening the guard', (_label, policy) => {
    sb.write('llll.policy.json', JSON.stringify(policy));
    sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.run(['push']);

    expect(res.code).toBe(2);
    expect(res.stderr).toContain('llll.policy.json');
  });

  it('still accepts an explicit false, which is a deliberate choice', () => {
    sb.write('llll.policy.json', JSON.stringify({ pushRules: { hardBlock: false } }));
    sb.commit({ 'src/config.js': leak() }, 'add config');

    expect(sb.run(['push']).code).toBe(0);
  });

  it('tells the user a committed secret must be removed from history and rotated (audit M)', () => {
    sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.run(['push']);

    expect(res.stdout).toMatch(/rotate/i);
    expect(res.stdout).toMatch(/history/i);
  });

  it('records the commit that introduced each finding', () => {
    const sha = sb.commit({ 'src/config.js': leak() }, 'add config');

    const findings = parseJsonResult(sb.run(['push', '--json']).stdout)?.findings ?? [];

    expect(findings.find(f => f.id === 'PG-H001')?.commit).toBe(sha);
  });

  it('does not wait for stdin in manual mode, even when stdin stays open (audit E)', async () => {
    sb.commit({ 'a.js': 'const a = 1;\n' });
    const child = spawn(process.execPath, [CLI, 'push', '--json'], {
      cwd: sb.work,
      env: sb.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    child.stdout.resume();
    child.stderr.resume();

    const code = await new Promise<number | null>((resolve, reject) => {
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('push hung waiting for stdin'));
      }, 15_000);
      child.on('close', exitCode => {
        clearTimeout(timer);
        resolve(exitCode);
      });
    });

    expect(code).toBe(0);
  });
});
