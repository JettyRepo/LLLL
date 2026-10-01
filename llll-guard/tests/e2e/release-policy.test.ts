import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { Sandbox, parseJsonResult, type JsonFinding } from '../helpers/repo.js';

// Review of P5: the release gate trusted the package it was judging (a policy in the working tree
// could switch it off), listed the files of another package when npm was pointed at a workspace,
// and ignored the files a project marked as internal.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

interface Run {
  code: number;
  findings: JsonFinding[];
  notes: string[];
  stderr: string;
  stdout: string;
}

function release(args: string[] = [], env?: NodeJS.ProcessEnv, cwd?: string): Run {
  const res = sb.run(['release', '--json', ...args], { env, cwd });
  const result = parseJsonResult(res.stdout) as (ReturnType<typeof parseJsonResult> & { notes?: string[] }) | null;
  return { code: res.code, findings: result?.findings ?? [], notes: result?.notes ?? [], stderr: res.stderr, stdout: res.stdout };
}

const ids = (run: Run): string[] => run.findings.map(f => f.id);
const leaky = (): Record<string, string> => ({ 'index.js': `const key = "${FAKE.awsKey}";\n` });

function makePackage(files: Record<string, string>): void {
  sb.write('package.json', JSON.stringify({ name: 'pkg-under-test', version: '1.0.0', files: ['*'] }));
  for (const [rel, content] of Object.entries(files)) sb.write(rel, content);
}

describe('the policy for a release comes from the remote, not from the package being released', () => {
  it('ignores a working-tree policy that switches the guard off', () => {
    makePackage(leaky());
    sb.write('llll.policy.json', JSON.stringify({ enabled: false }));

    const run = release();

    expect(ids(run)).toContain('RG-H003');
    expect(run.code).toBe(1);
  });

  it('ignores a working-tree policy that disables a rule or a whole class', () => {
    makePackage(leaky());
    sb.write('llll.policy.json', JSON.stringify({ releaseRules: { hardBlock: false, disabledRules: ['RG-H003'] } }));

    expect(release().code).toBe(1);
  });

  it('ignores a working-tree whitelist that raises the size limit', () => {
    makePackage({ 'index.js': `${'x'.repeat(2000)}\n` });
    sb.publish({ 'llll.whitelist.json': JSON.stringify({ maxPackageSize: 100 }) });
    sb.write('llll.whitelist.json', JSON.stringify({ maxPackageSize: 99_999_999 }));

    expect(ids(release())).toContain('RG-S007');
  });

  it('applies a policy that the remote already has, and says what it hid', () => {
    makePackage(leaky());
    sb.publish({ 'llll.policy.json': JSON.stringify({ releaseRules: { disabledRules: ['RG-H003'] } }) });

    const run = release();

    expect(run.code).toBe(0);
    expect(run.stdout).toContain('RG-H003');
    expect(run.stdout).toContain('suppressedByPolicy');
  });

  it('falls back to the working tree outside a repository, and says so', () => {
    const plain = join(sb.root, 'plain');
    mkdirSync(plain);
    sb.write('package.json', JSON.stringify({ name: 'p', version: '1.0.0', files: ['*'] }), plain);
    sb.write('index.js', `const key = "${FAKE.awsKey}";\n`, plain);

    const run = release([], undefined, plain);

    expect(ids(run)).toContain('RG-H003');
    expect(run.notes.join(' ')).toMatch(/working tree/);
  });

  it('prints the policy it hid in plain output too', () => {
    makePackage(leaky());
    sb.publish({ 'llll.policy.json': JSON.stringify({ releaseRules: { disabledRules: ['RG-H003'] } }) });

    const res = sb.run(['release']);

    expect(res.stdout).toContain('Hidden by the policy: RG-H003 x1');
    expect(res.stdout).not.toMatch(/safe to proceed/i);
  });
});

describe('files the project marked as internal (RG-H007)', () => {
  it('blocks them, even when they are ignored by version control and never went through a push', () => {
    makePackage({ 'dist/plan.internal.md': 'roadmap\n', 'dist/app.js': 'x\n' });
    sb.publish({ 'llll.policy.json': JSON.stringify({ internalFilePatterns: ['*.internal.md'] }) });

    const run = release();

    expect(run.findings.filter(f => f.id === 'RG-H007').map(f => f.file)).toContain('dist/plan.internal.md');
    expect(run.code).toBe(1);
  });

  it('is off when the project lists nothing', () => {
    makePackage({ 'dist/plan.internal.md': 'roadmap\n' });

    expect(ids(release())).not.toContain('RG-H007');
  });
});

describe('npm pointed at another package than the one here', () => {
  function workspaceRoot(): void {
    sb.write('package.json', JSON.stringify({ name: 'root', version: '1.0.0', workspaces: ['packages/*'], files: ['index.js'] }));
    sb.write('index.js', 'clean\n');
    sb.write('packages/a/package.json', JSON.stringify({ name: 'a', version: '1.0.0', files: ['index.js'] }));
    sb.write('packages/a/index.js', `const key = "${FAKE.awsKey}";\n`);
  }

  it('stops when .npmrc selects a workspace, instead of scanning the wrong files', () => {
    workspaceRoot();
    sb.write('.npmrc', 'workspace=packages/a\n');

    const run = release();

    expect(run.code).toBe(2);
    expect(run.stderr).toMatch(/workspace/i);
  });

  it('stops when the environment selects every workspace', () => {
    workspaceRoot();

    const run = release([], { npm_config_workspaces: 'true' });

    expect(run.code).toBe(2);
    expect(run.stderr).toMatch(/workspace|packages/i);
  });

  it('scans the root package normally when nothing points elsewhere', () => {
    workspaceRoot();

    expect(release().code).toBe(0);
  });
});
