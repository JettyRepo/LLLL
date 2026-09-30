import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { knownBug } from '../helpers/known-bug.js';
import { Sandbox, parseJsonResult } from '../helpers/repo.js';

// Audit findings covered here: H-5 (path parsing), M-2 (line numbers), M-3 (hunk parsing),
// C-6 (file names must never reach a shell).

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

const leak = (): string => `const key = "${FAKE.awsKey}";\n`;

function findingsFor(res: { stdout: string }): { id: string; file?: string; line?: number }[] {
  return parseJsonResult(res.stdout)?.findings ?? [];
}

describe('push diff parsing', () => {
  knownBug('reports the real path when a directory name ends in "b" (audit H-5)', () => {
    sb.commit({ 'lib/c.js': leak() });

    const files = findingsFor(sb.run(['push', '--json'])).map(f => f.file);

    // The unanchored /b\/(.+)$/ currently yields "c.js b/lib/c.js".
    expect(files).toContain('lib/c.js');
  });

  knownBug('reports the real path for another directory that ends in "b" (audit H-5)', () => {
    sb.commit({ 'web/x.js': leak() });

    const files = findingsFor(sb.run(['push', '--json'])).map(f => f.file);

    expect(files).toContain('web/x.js');
  });

  knownBug('scans added lines whose content starts with "++" (audit M-3)', () => {
    sb.commit({ 'src/loop.js': `++counter; const key = "${FAKE.awsKey}";\n` });

    const ids = findingsFor(sb.run(['push', '--json'])).map(f => f.id);

    // The added line arrives as "+++counter..." and is mistaken for a file header.
    expect(ids).toContain('PG-H001');
  });

  knownBug('reports the line number in the file, not the index among added lines (audit M-2)', () => {
    const base = Array.from({ length: 10 }, (_, i) => `const v${i} = ${i};`).join('\n') + '\n';
    sb.commit({ 'src/app.js': base }, 'base');
    sb.git(['push', 'origin', 'main']);
    sb.commit({ 'src/app.js': base + leak() }, 'add key at line 11');

    const finding = findingsFor(sb.run(['push', '--json'])).find(f => f.id === 'PG-H001');

    expect(finding?.line).toBe(11);
  });

  knownBug('reports the real path for a file name that git quotes (audit M-3)', () => {
    sb.commit({ 'src/café.js': leak() });

    const files = findingsFor(sb.run(['push', '--json'])).map(f => f.file);

    expect(files).toContain('src/café.js');
  });

  it('does not run commands embedded in a file name (guard for audit C-6)', () => {
    sb.commit({ 'HOME[$(touch PWNED)]': leak() });

    const res = sb.run(['push', '--json']);

    expect(sb.exists('PWNED')).toBe(false);
    expect(res.code).toBe(1);
  });
});
