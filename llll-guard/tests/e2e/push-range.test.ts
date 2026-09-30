import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { knownBug } from '../helpers/known-bug.js';
import { Sandbox, parseJsonResult } from '../helpers/repo.js';

// Audit findings covered here: C-5 (range resolution), H-5 (large diffs).
//
// `knownBug` marks a known defect: the test states the behaviour we want and
// is expected to fail until the fix lands. The fixing phase flips it to `it`.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

const leak = (): string => `const key = "${FAKE.awsKey}";\n`;

describe('push range: what gets scanned', () => {
  it('blocks a secret in commits that are ahead of the tracked branch', () => {
    sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(1);
    expect(parseJsonResult(res.stdout)?.verdict).toBe('HARD_BLOCK');
  });

  knownBug('never passes a secret on the first push of a new branch (audit C-5)', () => {
    sb.switchNew('feature/new');
    sb.commit({ 'src/config.js': leak() }, 'add config');

    const res = sb.run(['push', '--json']);

    // Either a block (1) or a tool error (2) is acceptable. Exit 0 is not.
    expect(res.code).not.toBe(0);
  });

  knownBug('blocks a secret that one commit adds and the next commit removes (audit C-5)', () => {
    sb.commit({ 'src/config.js': leak() }, 'add key');
    sb.commit({ 'src/config.js': 'const key = process.env.KEY;\n' }, 'remove key');

    const res = sb.run(['push', '--json']);

    // Both commits are pushed, so the key is in history even though the net diff is clean.
    expect(res.code).toBe(1);
  });

  knownBug('still scans the outgoing commits when the diff is larger than 1 MiB (audit H-5)', () => {
    const filler = `${'x'.repeat(79)}\n`.repeat(20_000);
    sb.commit({ 'vendor/blob.js': filler + leak() }, 'vendor blob');

    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(1);
  });

  // The scenarios below need the `hook pre-push` subcommand and pre-push stdin
  // parsing, which arrive in P2. They are listed so the spec is not lost.
  it.todo('hook pre-push: new ref (remote sha all zeros) scans only merge-base..local, not the whole history');
  it.todo('hook pre-push: push to a URL or to a remote that was never fetched does not scan the whole history');
  it.todo('hook pre-push: first push to an empty remote scans merge-base..local');
  it.todo('hook pre-push: force-push whose remote sha is missing locally does not error with "bad object"');
  it.todo('hook pre-push: merge commit that introduces a secret while resolving a conflict is caught');
  it.todo('hook pre-push: 1000+ commit initial import finishes within the time limit');
  it.todo('manual push without an upstream exits 2 and never passes');
  it.todo('manual push does not hang when stdin is not a TTY but stays open');
  it.todo('blocked push explains that history must be rewritten and the key rotated');
});
