import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { Sandbox, ZERO_SHA, parseJsonResult, prePushLine } from '../helpers/repo.js';

// Audit findings covered here: H-10, M-1, M-6. The policy that judges a push (llll.policy.json and
// .guardignore) is the one the remote already has. A push cannot loosen the rules that judge it,
// and a change to those files is itself a SOFT_BLOCK for a person to look at.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

const leak = (): string => `const key = "${FAKE.awsKey}";\n`;

function push(cwd?: string) {
  const res = sb.run(['push', '--json'], { cwd });
  const result = parseJsonResult(res.stdout);
  return { code: res.code, verdict: result?.verdict, findings: result?.findings ?? [], stdout: res.stdout, stderr: res.stderr };
}

const ids = (findings: { id: string }[]): string[] => findings.map(f => f.id);

describe('a push cannot loosen the policy that judges it', () => {
  it('does not apply a .guardignore that arrives in the same push', () => {
    sb.commit({ '.guardignore': 'secret.js\n', 'secret.js': leak() });

    const { code, verdict, findings } = push();

    expect(verdict).toBe('HARD_BLOCK');
    expect(code).toBe(1);
    expect(ids(findings)).toContain('PG-H001');
  });

  it('does not apply a policy that turns secret scanning off in the same push', () => {
    sb.commit({ 'llll.policy.json': JSON.stringify({ pushRules: { hardBlock: false } }), 'src/c.js': leak() });

    expect(push().verdict).toBe('HARD_BLOCK');
  });

  it('does not apply a policy that disables the guard in the same push', () => {
    sb.commit({ 'llll.policy.json': JSON.stringify({ enabled: false }), 'src/c.js': leak() });

    expect(push().code).toBe(1);
  });

  it('ignores a .guardignore that only exists in the working tree', () => {
    sb.commit({ 'x.js': leak() });
    sb.write('.guardignore', '*.js\n');

    expect(push().code).toBe(1);
  });

  it('ignores a policy file that only exists in the working tree', () => {
    sb.commit({ 'x.js': leak() });
    sb.write('llll.policy.json', JSON.stringify({ enabled: false }));

    expect(push().code).toBe(1);
  });
});

describe('a change to the policy is reviewed (PG-S011)', () => {
  it.each(['.guardignore', 'llll.policy.json', 'llll.whitelist.json'])('flags a change to %s as a SOFT_BLOCK', file => {
    sb.commit({ [file]: file.endsWith('.json') ? '{}\n' : '# nothing\n' });

    const { code, verdict, findings } = push();

    expect(ids(findings)).toEqual(['PG-S011']);
    expect(findings[0].file).toBe(file);
    expect(verdict).toBe('SOFT_BLOCK');
    expect(code).toBe(1);
  });

  it('does not flag a file of the same name in a subdirectory, which the guard never reads', () => {
    sb.commit({ 'docs/.guardignore': '# nothing\n', 'docs/llll.policy.json': '{}\n' });

    expect(push().code).toBe(0);
  });

  it('lets a person accept the change with an override', () => {
    sb.commit({ '.guardignore': '# nothing\n' });
    const token = push().findings[0].overrideToken as string | undefined;
    expect(token).toMatch(/^[0-9a-f]{12}$/);

    sb.run(['override', `PG-S011@${token}`, 'reviewed the ignore list', '--yes']);

    expect(push().code).toBe(0);
  });

  it('flags the change even when the published .guardignore would ignore the file', () => {
    sb.publish({ '.guardignore': '*\n' });
    sb.commit({ '.guardignore': '# loosened\n*\n' }, 'edit the ignore list');

    const { code, findings } = push();

    expect(ids(findings)).toContain('PG-S011');
    expect(code).toBe(1);
  });
});

describe('the policy the remote already has', () => {
  it('applies a published .guardignore', () => {
    sb.publish({ '.guardignore': 'generated/*.js\n' });
    sb.commit({ 'generated/x.js': leak() });

    expect(push().code).toBe(0);
  });

  it('applies a published policy that disables a rule, and says that findings were hidden', () => {
    sb.publish({ 'llll.policy.json': JSON.stringify({ pushRules: { disabledRules: ['PG-W002'] } }) });
    sb.commit({ 'src/app.js': 'console.log("debug");\n' });

    const { findings, stdout } = push();
    const result = JSON.parse(stdout.slice(stdout.indexOf('{'))) as { suppressedByPolicy?: Record<string, number> };

    expect(ids(findings)).not.toContain('PG-W002');
    expect(result.suppressedByPolicy).toEqual({ 'PG-W002': 1 });
  });

  it('tells the user in plain output what the policy hid', () => {
    sb.publish({ 'llll.policy.json': JSON.stringify({ pushRules: { disabledRules: ['PG-W002'] } }) });
    sb.commit({ 'src/app.js': 'console.log("debug");\n' });

    expect(sb.run(['push']).stdout).toContain('Hidden by disabledRules in the policy: PG-W002 x1');
  });

  it('skips the scan when the published policy disables the guard', () => {
    sb.publish({ 'llll.policy.json': JSON.stringify({ enabled: false }) });
    sb.commit({ 'src/c.js': leak() });

    const res = sb.run(['push']);

    expect(res.code).toBe(0);
    expect(res.stdout).toContain('disabled');
  });

  it('exits 2 when the published policy cannot be read', () => {
    sb.publish({ 'llll.policy.json': '{ not json' });
    sb.commit({ 'a.js': 'const a = 1;\n' });

    const res = sb.run(['push']);

    expect(res.code).toBe(2);
    expect(res.stderr).toContain('llll.policy.json');
  });

  it('reads the policy from the repository root when run from a subdirectory', () => {
    sb.publish({ '.guardignore': 'generated/*.js\n', 'generated/keep.txt': 'x\n' });
    sb.commit({ 'generated/x.js': leak() });

    expect(push(join(sb.work, 'generated')).code).toBe(0);
  });

  it('stops applying a policy once it is gone from the remote version', () => {
    sb.publish({ '.guardignore': 'generated/*.js\n' });
    sb.publish({ '.guardignore': '# emptied\n' });
    sb.commit({ 'generated/x.js': leak() });

    expect(push().code).toBe(1);
  });
});

describe('the policy for a new branch (hook mode)', () => {
  it('comes from the remote branch it was cut from', () => {
    sb.publish({ '.guardignore': 'generated/*.js\n' });
    sb.switchNew('feature/x');
    const sha = sb.commit({ 'generated/x.js': leak() });

    const res = sb.runPrePushHook([prePushLine('refs/heads/feature/x', sha, 'refs/heads/feature/x', ZERO_SHA)]);

    expect(res.code).toBe(0);
  });

  it('is the default when the remote has nothing yet, even if the first commits carry a policy', () => {
    const solo = join(sb.root, 'solo');
    mkdirSync(solo);
    sb.git(['init', '-b', 'main'], solo);
    const sha = sb.commit({ '.guardignore': 'secret.js\n', 'secret.js': leak() }, 'first', solo);

    const res = sb.runPrePushHook([prePushLine('refs/heads/main', sha, 'refs/heads/main', ZERO_SHA)], {
      cwd: solo,
      remoteName: 'origin',
      remoteUrl: join(sb.root, 'empty.git'),
    });

    expect(res.code).toBe(1);
  });

  it('uses the remote sha as the base for an existing branch', () => {
    const remoteSha = sb.publish({ '.guardignore': 'generated/*.js\n' });
    const sha = sb.commit({ 'generated/x.js': leak() });

    const res = sb.runPrePushHook([prePushLine('refs/heads/main', sha, 'refs/heads/main', remoteSha)]);

    expect(res.code).toBe(0);
  });
});
