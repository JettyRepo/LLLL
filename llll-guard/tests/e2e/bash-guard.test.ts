import { existsSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { knownBug } from '../helpers/known-bug.js';
import { BASH_GUARD, Sandbox, bashMajorVersion } from '../helpers/repo.js';

// Audit findings covered here: C-1, C-2, C-4, C-6. These drive the bash `guard`
// script. In P6 that script becomes a thin shim over the TypeScript engine; the
// same tests must then pass unchanged, including on macOS's bash 3.2.

const SYSTEM_BASH = '/bin/bash';
const systemBashMajor = bashMajorVersion(SYSTEM_BASH);
const hasBash = systemBashMajor > 0 && existsSync(BASH_GUARD);
const isBash3 = systemBashMajor > 0 && systemBashMajor < 4;

// `declare -A` only breaks on bash 3.x (stock macOS); elsewhere these are plain regression tests.
const onSystemBash = !hasBash ? it.skip : isBash3 ? knownBug : it;
const knownBugIfBash = !hasBash ? it.skip : knownBug;

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

const leak = (): string => `const key = "${FAKE.awsKey}";\n`;

function guard(args: string[]): ReturnType<Sandbox['spawn']> {
  return sb.spawn(SYSTEM_BASH, [BASH_GUARD, ...args]);
}

describe('bash guard', () => {
  onSystemBash('runs on the system bash without shell errors and blocks a leaked key (audit C-2)', () => {
    sb.commit({ 'src/config.js': leak() });

    const res = guard(['push']);

    // bash 3.2: "declare: -A: invalid option" followed by an arithmetic syntax error.
    expect(res.stderr).not.toMatch(/invalid option|syntax error/);
    expect(res.code).toBe(1);
    expect(res.stdout).toContain('PG-H001');
  });

  onSystemBash('never passes silently when the scan could not run (audit C-2)', () => {
    sb.commit({ 'src/config.js': leak() });

    const res = guard(['push']);

    // bash 3.2 today: "line 294: src: unbound variable", stdout empty, exit code 0.
    // The push goes through with the key in it: the gate fails open.
    expect(res.code).not.toBe(0);
  });

  onSystemBash('never evaluates a file name as shell code (audit C-6)', () => {
    // Bash 3.2 evaluates the array key as arithmetic, which expands `name[...]`.
    // The name must start with a variable that is already set (HOME, PATH, ...): under
    // `set -u` an unset one aborts first. Nothing may follow the closing bracket.
    sb.commit({ 'HOME[$(touch PWNED)]': leak() });

    guard(['push']);

    expect(sb.exists('PWNED')).toBe(false);
  });

  knownBugIfBash('blocks a private key pushed in a source file (audit C-1)', () => {
    sb.commit({ 'src/key.js': `${FAKE.pemRsa}\nMIIE...\n` });

    const res = guard(['push']);

    // The pattern starts with "-----", so grep reads it as an option, fails, and the error is hidden.
    expect(res.code).toBe(1);
    expect(res.stdout).toContain('PG-H005');
  });

  knownBugIfBash('the release gate sees the files npm would publish (audit C-4)', () => {
    sb.write('package.json', JSON.stringify({ name: 'pkg-under-test', version: '1.0.0' }));
    sb.write('index.js', 'module.exports = 1;\n');
    sb.write('.env', 'SECRET=1\n');

    const res = guard(['release']);

    // `npm pack --dry-run` prints its file list to stderr, which the script discards.
    // (Exit 1 alone is not enough: RG-S006 fires for a missing `files` field regardless.)
    expect(res.stdout).toContain('RG-H001');
  });

  knownBugIfBash('refuses to override a HARD rule id (audit H-1, DOC-11)', () => {
    const res = guard(['override', 'PG-H001', 'trust me']);

    // The TypeScript engine rejects this; the bash script currently records it.
    expect(res.code).not.toBe(0);
  });
});
