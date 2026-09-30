import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { knownBug } from '../helpers/known-bug.js';
import { Sandbox, parseJsonResult } from '../helpers/repo.js';

// Audit findings covered here: M-4 (RG-H001 only matches a root-level .env),
// TS-15 (release never scans file contents for secrets).
// C-4 (the bash gate ignoring `npm pack` output) is covered in bash-guard.test.ts.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

/** An npm package without a `files` field, so everything in the directory is published. */
function makePackage(files: Record<string, string>): void {
  sb.write('package.json', JSON.stringify({ name: 'pkg-under-test', version: '1.0.0' }));
  for (const [rel, content] of Object.entries(files)) {
    sb.write(rel, content);
  }
}

function releaseFindings(): { id: string; file?: string }[] {
  const res = sb.run(['release', '--json']);
  return parseJsonResult(res.stdout)?.findings ?? [];
}

describe('release gate', () => {
  it('blocks a root-level .env that would be published', () => {
    makePackage({ 'index.js': 'module.exports = 1;\n', '.env': 'SECRET=1\n' });

    const res = sb.run(['release', '--json']);

    expect(res.code).toBe(1);
    expect(releaseFindings().some(f => f.id === 'RG-H001')).toBe(true);
  });

  it('blocks a source map that would be published', () => {
    makePackage({ 'index.js': 'module.exports = 1;\n', 'index.js.map': '{"version":3}\n' });

    expect(releaseFindings().some(f => f.id === 'RG-H004')).toBe(true);
  });

  knownBug('blocks a nested config/.env (audit M-4)', () => {
    makePackage({ 'index.js': 'module.exports = 1;\n', 'config/.env': 'SECRET=1\n' });

    const hit = releaseFindings().find(f => f.id === 'RG-H001');

    expect(hit?.file).toBe('config/.env');
  });

  knownBug('blocks .env.production (audit M-4)', () => {
    makePackage({ 'index.js': 'module.exports = 1;\n', '.env.production': 'SECRET=1\n' });

    const hit = releaseFindings().find(f => f.id === 'RG-H001');

    expect(hit?.file).toBe('.env.production');
  });

  knownBug('scans published file contents for secrets (audit TS-15)', () => {
    makePackage({ 'index.js': `module.exports = "${FAKE.awsKey}";\n` });

    expect(releaseFindings().some(f => f.id === 'PG-H001')).toBe(true);
  });

  it.todo('RG-H003 is implemented (documented in guard-patterns.md, missing in the TypeScript engine)');
});
