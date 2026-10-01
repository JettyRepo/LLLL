import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { knownBug } from '../helpers/known-bug.js';
import { Sandbox, parseJsonResult } from '../helpers/repo.js';

// Audit finding covered here: H-1. `override` writes a log entry that no gate
// ever reads, so a SOFT_BLOCK can never be cleared.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

describe('override', () => {
  it('refuses to override a HARD rule', () => {
    const res = sb.run(['override', 'PG-H001', 'trust me']);

    expect(res.code).toBe(1);
    expect(res.stderr).toContain('cannot be overridden');
  });

  it('records an override for a SOFT rule', () => {
    const res = sb.run(['override', 'PG-S002', 'payments reviewed by legal']);

    expect(res.code).toBe(0);
    expect(sb.exists('.llll/logs/guard-log.jsonl')).toBe(true);
  });

  it('blocks a payment feature until it is overridden (baseline for H-1)', () => {
    sb.commit({ 'pay.js': "import Stripe from 'stripe';\n" });

    const res = sb.run(['push', '--json']);

    expect(parseJsonResult(res.stdout)?.verdict).toBe('SOFT_BLOCK');
    expect(res.code).toBe(1);
  });

  knownBug('lets the push through after the finding is overridden (audit H-1)', () => {
    sb.commit({ 'pay.js': "import Stripe from 'stripe';\n" });
    expect(sb.run(['push', '--json']).code).toBe(1);

    sb.run(['override', 'PG-S002', 'payments reviewed by legal']);
    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(0);
  });

  it.todo('an override is scoped to rule id + file + content hash and expires');
  it.todo('override asks for confirmation on a TTY and refuses to run non-interactively');
});
