import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FINDING_REFERENCE, loadActiveOverrides, overrideLogPath } from '../src/overrides.js';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'llll-overrides-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const NOW = new Date('2026-10-01T12:00:00Z');
const FUTURE = '2026-10-10T12:00:00Z';
const PAST = '2026-09-01T12:00:00Z';
const TOKEN = '0123456789ab';

function writeLog(...lines: string[]): void {
  mkdirSync(join(root, '.llll', 'logs'), { recursive: true });
  writeFileSync(overrideLogPath(root), lines.join('\n') + '\n');
}

const WRITTEN = '2026-10-01T00:00:00Z';

const entry = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({
    action: 'override',
    findingIds: ['PG-S002'],
    findingToken: TOKEN,
    justification: 'reviewed',
    timestamp: WRITTEN,
    expiresAt: FUTURE,
    ...overrides,
  });

describe('FINDING_REFERENCE', () => {
  it('accepts a rule id with a 12 character token', () => {
    expect(FINDING_REFERENCE.exec('PG-S002@0123456789ab')?.slice(1)).toEqual(['PG-S002', '0123456789ab']);
  });

  it('accepts a bare rule id so that the command can explain what is missing', () => {
    expect(FINDING_REFERENCE.exec('PG-S002')?.slice(1)).toEqual(['PG-S002', undefined]);
  });

  it.each(['PG-S002@xyz', 'PG-S002@0123456789abc', 'PG-S02@0123456789ab', 'pg-s002@0123456789ab', 'PG-S002@', ' PG-S002'])(
    'rejects %j',
    value => {
      expect(FINDING_REFERENCE.test(value)).toBe(false);
    },
  );
});

describe('loadActiveOverrides', () => {
  it('returns nothing when there is no log', () => {
    expect(loadActiveOverrides(NOW, root).size).toBe(0);
  });

  it('returns an override that has not expired, by token', () => {
    writeLog(entry());

    const active = loadActiveOverrides(NOW, root);

    expect([...active.keys()]).toEqual([TOKEN]);
    expect(active.get(TOKEN)?.justification).toBe('reviewed');
  });

  it('drops an override that has expired, or that expires exactly now', () => {
    writeLog(entry({ expiresAt: PAST }), entry({ findingToken: 'aaaaaaaaaaaa', expiresAt: NOW.toISOString() }));

    expect(loadActiveOverrides(NOW, root).size).toBe(0);
  });

  it.each([
    ['text that is not JSON', 'not json'],
    ['an entry that is not an override', entry({ action: 'comment' })],
    ['an entry without a token', entry({ findingToken: undefined })],
    ['an entry with a token of the wrong shape', entry({ findingToken: 'ZZZ' })],
    ['an entry without an expiry', entry({ expiresAt: undefined })],
    ['an entry whose expiry is not a date', entry({ expiresAt: 'soon' })],
    ['an entry without a timestamp', entry({ timestamp: undefined })],
    ['an entry whose timestamp is not a date', entry({ timestamp: 'yesterday' })],
    ['an entry without finding ids', entry({ findingIds: undefined })],
    ['an entry whose finding ids are a string', entry({ findingIds: 'PG-S002' })],
    ['an entry whose finding ids are not strings', entry({ findingIds: [1] })],
    ['a line that is the JSON value null', 'null'],
    ['a line that is a number', '5'],
    ['a line that is an array', '[]'],
  ])('ignores %s, so a damaged log can only lead to a block', (_label, line) => {
    writeLog(line);

    expect(loadActiveOverrides(NOW, root).size).toBe(0);
  });

  it('keeps reading after a damaged line', () => {
    writeLog('not json', '', entry());

    expect(loadActiveOverrides(NOW, root).size).toBe(1);
  });

  it('lets a later entry for the same token replace an earlier one', () => {
    writeLog(entry({ justification: 'first' }), entry({ justification: 'second' }));

    expect(loadActiveOverrides(NOW, root).get(TOKEN)?.justification).toBe('second');
  });

  it('holds a hand-edited expiry to the longest an override may last, counted from when it was written', () => {
    // Written a year before NOW and "valid until 2999": it ran out after 90 days.
    writeLog(entry({ timestamp: '2025-10-01T00:00:00Z', expiresAt: '2999-01-01T00:00:00Z' }));

    expect(loadActiveOverrides(NOW, root).size).toBe(0);
  });

  it('keeps an override that is within the longest it may last', () => {
    writeLog(entry({ timestamp: '2026-09-20T00:00:00Z', expiresAt: '2999-01-01T00:00:00Z' }));

    const active = loadActiveOverrides(NOW, root);

    // Clamped to 90 days after 2026-09-20, which is still in the future.
    expect(Date.parse(active.get(TOKEN)?.expiresAt ?? '')).toBe(Date.parse('2026-09-20T00:00:00Z') + 90 * 86_400_000);
  });

  it('can end an override early by replacing it with one that has already expired', () => {
    writeLog(entry(), entry({ expiresAt: PAST }));

    expect(loadActiveOverrides(NOW, root).size).toBe(0);
  });
});
