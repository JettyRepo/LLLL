import { describe, expect, it } from 'vitest';
import { parsePrePushInput } from '../src/range.js';
import { GuardError } from '../src/errors.js';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const ZERO = '0'.repeat(40);

describe('parsePrePushInput', () => {
  it('parses the lines git sends to a pre-push hook', () => {
    const refs = parsePrePushInput(
      `refs/heads/main ${A} refs/heads/main ${B}\nrefs/heads/new ${A} refs/heads/new ${ZERO}\n`,
    );

    expect(refs).toEqual([
      { localRef: 'refs/heads/main', localSha: A, remoteRef: 'refs/heads/main', remoteSha: B },
      { localRef: 'refs/heads/new', localSha: A, remoteRef: 'refs/heads/new', remoteSha: ZERO },
    ]);
  });

  it('returns nothing for empty input', () => {
    expect(parsePrePushInput('')).toEqual([]);
    expect(parsePrePushInput('\n\n')).toEqual([]);
  });

  it('accepts a deletion, where the local sha is all zeros', () => {
    const [ref] = parsePrePushInput(`(delete) ${ZERO} refs/heads/old ${B}`);

    expect(ref.localSha).toBe(ZERO);
  });

  it('accepts SHA-256 object ids', () => {
    const long = 'c'.repeat(64);

    expect(parsePrePushInput(`refs/heads/x ${long} refs/heads/x ${'0'.repeat(64)}`)).toHaveLength(1);
  });

  it.each([
    ['too few fields', `refs/heads/x ${A} refs/heads/x`],
    ['too many fields', `refs/heads/x ${A} refs/heads/x ${B} extra`],
    ['a sha that is not hex', `refs/heads/x ${'z'.repeat(40)} refs/heads/x ${B}`],
    ['a sha of the wrong length', `refs/heads/x ${'a'.repeat(12)} refs/heads/x ${B}`],
    ['an option-looking value in place of a sha', `refs/heads/x --output=x refs/heads/x ${B}`],
  ])('rejects %s instead of guessing', (_label, line) => {
    expect(() => parsePrePushInput(line)).toThrow(GuardError);
  });
});
