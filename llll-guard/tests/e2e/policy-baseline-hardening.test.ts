import { mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { Sandbox, ZERO_SHA, parseJsonResult, prePushLine } from '../helpers/repo.js';

// Review of P4 found ways to end up judged by a weaker policy than the project has, or to remove
// the policy without a review. Every one of them must stay closed.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

const leak = (): string => `const key = "${FAKE.awsKey}";\n`;
const STRICT = JSON.stringify({ internalFilePatterns: ['internal/**'] });

function push(cwd?: string) {
  const res = sb.run(['push', '--json'], { cwd });
  const result = parseJsonResult(res.stdout);
  return { code: res.code, verdict: result?.verdict, findings: result?.findings ?? [], stdout: res.stdout, stderr: res.stderr };
}

const ids = (findings: { id: string }[]): string[] => findings.map(f => f.id);
const parseResult = (stdout: string) => JSON.parse(stdout.slice(stdout.indexOf('{'))) as { notes?: string[]; suppressedByPolicy?: Record<string, number>; verdict: string; scannedFiles: number };

describe('removing or moving the policy is a policy change too', () => {
  it('flags deleting a policy file', () => {
    sb.publish({ 'llll.policy.json': STRICT, '.guardignore': '# none\n' });
    sb.git(['rm', '-q', 'llll.policy.json', '.guardignore']);
    sb.git(['commit', '-q', '-m', 'drop the policy']);

    const { code, findings } = push();

    expect(findings.filter(f => f.id === 'PG-S011').map(f => f.file).sort()).toEqual(['.guardignore', 'llll.policy.json']);
    expect(code).toBe(1);
  });

  it('flags moving a policy file away, by its old name', () => {
    sb.publish({ 'llll.policy.json': STRICT });
    sb.git(['mv', 'llll.policy.json', 'policy.bak']);
    sb.git(['commit', '-q', '-m', 'move the policy']);

    const { code, findings } = push();

    expect(findings.map(f => [f.id, f.file])).toContainEqual(['PG-S011', 'llll.policy.json']);
    expect(code).toBe(1);
  });

  it('gives a deletion its own override token, so one override does not cover the next deletion', () => {
    sb.publish({ 'llll.policy.json': STRICT });
    sb.git(['rm', '-q', 'llll.policy.json']);
    sb.git(['commit', '-q', '-m', 'drop the policy']);
    const token = push().findings.find(f => f.id === 'PG-S011')?.overrideToken as string;
    sb.run(['override', `PG-S011@${token}`, 'removing the policy on purpose', '--yes']);
    expect(push().code).toBe(0);

    sb.commit({ 'llll.policy.json': STRICT }, 'restore');
    sb.git(['rm', '-q', 'llll.policy.json']);
    sb.git(['commit', '-q', '-m', 'drop it again']);

    expect(push().code).toBe(1);
  });

  it('does not flag deleting an ordinary .env', () => {
    sb.write('.env', 'A=1\n');
    sb.git(['add', '-f', '.env']);
    sb.git(['commit', '-q', '-m', 'add env']);
    sb.git(['push', 'origin', 'main']);
    sb.git(['rm', '-q', '.env']);
    sb.git(['commit', '-q', '-m', 'remove env']);

    expect(push().code).toBe(0);
  });
});

describe('a policy file that is not a regular file', () => {
  it('flags a directory named .guardignore, whatever is inside it', () => {
    sb.commit({ '.guardignore/rules': '**\n' });

    const { code, findings } = push();

    expect(ids(findings)).toContain('PG-S011');
    expect(code).toBe(1);
  });

  it('refuses to read a published .guardignore that is a directory, instead of reading its listing as patterns', () => {
    sb.publish({ '.guardignore/rules': '**\n' });
    sb.commit({ 'x.js': leak() });

    const { code, stderr } = push();

    expect(code).toBe(2);
    expect(stderr).toContain('directory');
  });

  it('refuses to read a published llll.policy.json that is a directory', () => {
    sb.publish({ 'llll.policy.json/inner': '{}\n' });
    sb.commit({ 'x.js': leak() });

    expect(push().code).toBe(2);
  });

  it('refuses to read a policy file that is a symbolic link', () => {
    symlinkSync('elsewhere.txt', join(sb.work, '.guardignore'));
    sb.publish({ 'elsewhere.txt': '**\n' });
    sb.commit({ 'x.js': leak() });

    const { code, stderr } = push();

    expect(code).toBe(2);
    expect(stderr).toContain('symbolic link');
  });
});

describe('which policy a branch is judged by', () => {
  it('uses the default branch as it is now, not as it was when the branch was cut', () => {
    sb.switchNew('feature/x');
    sb.git(['switch', 'main']);
    sb.publish({ 'llll.policy.json': STRICT }, 'main gains a policy');
    sb.git(['switch', 'feature/x']);
    const sha = sb.commit({ 'internal/k.txt': 'plans\n' });

    const res = sb.runPrePushHook([prePushLine('refs/heads/feature/x', sha, 'refs/heads/feature/x', ZERO_SHA)]);

    expect(res.code).toBe(1);
    expect(parseResult(res.stdout).verdict).toBe('HARD_BLOCK');
  });

  it('judges an orphan branch by the remote policy, not by the defaults', () => {
    sb.publish({ 'llll.policy.json': STRICT });
    sb.git(['checkout', '-q', '--orphan', 'orphan']);
    sb.git(['rm', '-rfq', '.']);
    const sha = sb.commit({ 'internal/k.txt': 'plans\n' }, 'orphan');

    const res = sb.runPrePushHook([prePushLine('refs/heads/orphan', sha, 'refs/heads/orphan', ZERO_SHA)]);

    expect(res.code).toBe(1);
  });

  it('does not let `--range HEAD` take the policy from the commits being pushed', () => {
    sb.publish({ 'llll.policy.json': STRICT });
    sb.commit({ 'llll.policy.json': JSON.stringify({ internalFilePatterns: [] }), 'internal/k.txt': 'plans\n' });

    const res = sb.run(['push', '--range', 'HEAD', '--json']);

    expect(res.code).toBe(1);
    expect(ids(parseJsonResult(res.stdout)?.findings ?? [])).toContain('PG-H014');
  });

  it('refuses a symmetric range, whose start is ambiguous', () => {
    const res = sb.run(['push', '--range', 'origin/main...HEAD']);

    expect(res.code).toBe(2);
    expect(res.stderr).toContain('...');
  });

  it('does not let a policy that one branch loosened with an override govern that branch from then on', () => {
    sb.publish({ 'llll.policy.json': STRICT });
    sb.switchNew('feature/loose');
    sb.commit({ 'llll.policy.json': JSON.stringify({ internalFilePatterns: [] }) }, 'loosen the policy');
    const token = push().findings.find(f => f.id === 'PG-S011')?.overrideToken as string;
    sb.run(['override', `PG-S011@${token}`, 'loosening on purpose', '--yes']);
    sb.git(['push', 'origin', 'feature/loose']);
    const remoteSha = sb.git(['rev-parse', 'HEAD']);
    const sha = sb.commit({ 'internal/k.txt': 'plans\n' });

    const res = sb.runPrePushHook([prePushLine('refs/heads/feature/loose', sha, 'refs/heads/feature/loose', remoteSha)]);

    // The branch's own remote version is loose; the default branch's is not.
    expect(res.code).toBe(1);
  });

  it('still uses the exact remote sha when pushing the default branch itself', () => {
    const remoteSha = sb.publish({ '.guardignore': 'generated/*.js\n' });
    const sha = sb.commit({ 'generated/x.js': leak() });

    const res = sb.runPrePushHook([prePushLine('refs/heads/main', sha, 'refs/heads/main', remoteSha)]);

    expect(res.code).toBe(0);
  });
});

describe('one push, several refs, different policies', () => {
  /**
   * Two refs share a commit. The first is the default branch, judged by the exact commit it
   * replaces (a loose policy that ignores *.txt); the second is a new branch, judged by the local
   * view of the default branch (older and strict). The stricter policy must have its say whatever
   * order git reports the refs in.
   */
  function setUp(): { sha: string; main: string; feature: string; stale: string; fresh: string } {
    const stale = sb.git(['rev-parse', 'HEAD']);
    const fresh = sb.publish({ '.guardignore': '*.txt\n' }, 'main loosens the ignore list');
    sb.git(['update-ref', 'refs/remotes/origin/main', stale]);
    const sha = sb.commit({ 'leak.txt': leak() }, 'a secret in a .txt');
    return {
      sha,
      stale,
      fresh,
      main: prePushLine('refs/heads/main', sha, 'refs/heads/main', fresh),
      feature: prePushLine('refs/heads/feature/b', sha, 'refs/heads/feature/b', ZERO_SHA),
    };
  }

  // The secret itself must be found. A block for another reason (the new .guardignore raises
  // PG-S011 for the branch) would hide the very gap these tests are for.
  it('finds the secret when the loose ref is reported first', () => {
    const { main, feature } = setUp();

    const result = parseJsonResult(sb.runPrePushHook([main, feature]).stdout);

    expect(result?.verdict).toBe('HARD_BLOCK');
    expect(ids(result?.findings ?? [])).toContain('PG-H001');
  });

  it('finds the secret when the strict ref is reported first', () => {
    const { main, feature } = setUp();

    const result = parseJsonResult(sb.runPrePushHook([feature, main]).stdout);

    expect(result?.verdict).toBe('HARD_BLOCK');
    expect(ids(result?.findings ?? [])).toContain('PG-H001');
  });

  it('reports the finding once, not once per policy', () => {
    const { main, feature } = setUp();

    const findings = parseJsonResult(sb.runPrePushHook([main, feature]).stdout)?.findings ?? [];

    expect(findings.filter(f => f.id === 'PG-H001')).toHaveLength(1);
  });
});

describe('what the output says about how the push was judged', () => {
  it('says so when there is no remote policy to read and the defaults apply', () => {
    const solo = join(sb.root, 'solo');
    mkdirSync(solo);
    sb.git(['init', '-b', 'main'], solo);
    const sha = sb.commit({ 'ok.js': 'const a = 1;\n' }, 'first', solo);

    const res = sb.runPrePushHook([prePushLine('refs/heads/main', sha, 'refs/heads/main', ZERO_SHA)], {
      cwd: solo,
      remoteName: 'origin',
      remoteUrl: join(sb.root, 'empty.git'),
    });

    expect(parseResult(res.stdout).notes?.join(' ')).toMatch(/defaults/);
  });

  it('reports a disabled guard as a normal JSON result, not as plain text', () => {
    sb.publish({ 'llll.policy.json': JSON.stringify({ enabled: false }) });
    sb.commit({ 'src/c.js': leak() });

    const res = sb.run(['push', '--json']);
    const result = parseResult(res.stdout);

    expect(res.code).toBe(0);
    expect(result.verdict).toBe('PASS');
    expect(result.scannedFiles).toBe(0);
    expect(result.notes?.join(' ')).toMatch(/disabled/);
  });

  it('says that secret scanning is off when the policy turns it off', () => {
    sb.publish({ 'llll.policy.json': JSON.stringify({ pushRules: { hardBlock: false } }) });
    sb.commit({ 'src/c.js': leak() });

    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(0);
    expect(parseResult(res.stdout).notes?.join(' ')).toContain('hardBlock');
  });

  it('says that every file is ignored when the .guardignore says so, and how many were skipped', () => {
    sb.publish({ '.guardignore': '*\n' });
    sb.commit({ 'a.js': leak(), 'b.js': 'const b = 1;\n' });

    const notes = parseResult(sb.run(['push', '--json']).stdout).notes?.join(' ') ?? '';

    expect(notes).toContain('ignores every file');
    expect(notes).toMatch(/2 file\(s\) were not scanned/);
  });

  it('refuses a policy that disables PG-S011, the alarm for changing the policy', () => {
    sb.publish({ 'llll.policy.json': JSON.stringify({ pushRules: { disabledRules: ['PG-S011'] } }) });
    sb.commit({ 'a.js': 'const a = 1;\n' });

    const res = sb.run(['push']);

    expect(res.code).toBe(2);
    expect(res.stderr).toContain('PG-S011');
  });

  it('lets a policy disable a HARD rule, and says that findings were hidden', () => {
    sb.publish({ 'llll.policy.json': JSON.stringify({ pushRules: { disabledRules: ['PG-H001'] } }) });
    sb.commit({ 'src/c.js': leak() });

    const { code, stdout } = push();

    expect(code).toBe(0);
    expect(parseResult(stdout).suppressedByPolicy).toEqual({ 'PG-H001': 1 });
  });

  it('points to the way out when the policy on the remote cannot be read', () => {
    sb.publish({ 'llll.policy.json': '{ not json' });
    sb.commit({ 'a.js': 'const a = 1;\n' });

    expect(sb.run(['push']).stderr).toContain('--no-verify');
  });
});
