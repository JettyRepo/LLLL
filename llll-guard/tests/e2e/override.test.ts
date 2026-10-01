import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Sandbox, parseJsonResult, type JsonFinding } from '../helpers/repo.js';

// Audit finding covered here: H-1. `override` used to write a log entry that no gate read, so a
// SOFT_BLOCK could never be cleared. An override now covers one finding (rule + file + content),
// expires, needs a confirmation, and is read by the push gate.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

const PAY = "import Stripe from 'stripe';\n";
const ID = 'PG-S002';

interface SoftFinding extends JsonFinding {
  overrideToken?: string;
  overridden?: boolean;
  overrideJustification?: string;
}

function push(): { code: number; verdict?: string; findings: SoftFinding[]; overrides: unknown[] } {
  const res = sb.run(['push', '--json']);
  const result = parseJsonResult(res.stdout) as (ReturnType<typeof parseJsonResult> & { overrides?: unknown[] }) | null;
  return {
    code: res.code,
    verdict: result?.verdict,
    findings: (result?.findings ?? []) as SoftFinding[],
    overrides: result?.overrides ?? [],
  };
}

function tokenOf(file: string): string {
  const finding = push().findings.find(f => f.id === ID && f.file === file);
  if (!finding?.overrideToken) throw new Error(`no override token for ${ID} in ${file}`);
  return finding.overrideToken;
}

function override(reference: string, why = 'payments reviewed by legal', extra: string[] = ['--yes']) {
  return sb.run(['override', reference, why, ...extra]);
}

describe('the blocked push tells the user how to override', () => {
  it('gives every SOFT_BLOCK finding a token and no other finding one', () => {
    sb.commit({ 'pay.js': PAY, 'ok.js': 'const a = 1;\n', '.env.production': 'A=1\n' });

    const { findings } = push();

    expect(findings.find(f => f.id === ID)?.overrideToken).toMatch(/^[0-9a-f]{12}$/);
    expect(findings.filter(f => f.severity !== 'SOFT_BLOCK').every(f => f.overrideToken === undefined)).toBe(true);
  });

  it('prints a command that can be pasted', () => {
    sb.commit({ 'pay.js': PAY });

    const res = sb.run(['push']);
    const token = tokenOf('pay.js');

    expect(res.stdout).toContain(`llll-guard override ${ID}@${token} "<justification>" --file pay.js`);
  });

  it('gives the same token every run, and a new finding in the same file its own token', () => {
    sb.commit({ 'pay.js': PAY });
    const first = tokenOf('pay.js');
    expect(tokenOf('pay.js')).toBe(first);

    // More payment code in a later commit is a new finding on a new version of the file.
    sb.commit({ 'pay.js': PAY + "import { loadStripe } from '@stripe/stripe-js';\n" }, 'more payment code');

    const tokens = push().findings.filter(f => f.id === ID && f.file === 'pay.js').map(f => f.overrideToken);
    expect(tokens).toHaveLength(2);
    expect(new Set(tokens).size).toBe(2);
    expect(tokens).toContain(first);
  });
});

describe('override', () => {
  it('lets the push through once the finding is overridden (audit H-1)', () => {
    sb.commit({ 'pay.js': PAY });
    expect(push().code).toBe(1);

    const res = override(`${ID}@${tokenOf('pay.js')}`);
    const after = push();

    expect(res.code).toBe(0);
    expect(after.code).toBe(0);
    expect(after.verdict).toBe('PASS');
    const finding = after.findings.find(f => f.id === ID);
    expect(finding?.overridden).toBe(true);
    expect(finding?.overrideJustification).toBe('payments reviewed by legal');
    expect(after.overrides).toHaveLength(1);
  });

  it('covers only the finding it names', () => {
    sb.commit({ 'pay.js': PAY, 'tracking.js': "mixpanel.track('signup');\n" });
    override(`${ID}@${tokenOf('pay.js')}`);

    const after = push();

    expect(after.code).toBe(1);
    expect(after.findings.find(f => f.id === 'PG-S005')?.overridden).toBeUndefined();
  });

  it('does not cover new payment code added to the same file later', () => {
    sb.commit({ 'pay.js': PAY });
    override(`${ID}@${tokenOf('pay.js')}`);
    expect(push().code).toBe(0);

    sb.commit({ 'pay.js': PAY + "import { loadStripe } from '@stripe/stripe-js';\n" }, 'more payment code');

    // The first finding is still covered; the new one is not.
    expect(push().code).toBe(1);
  });

  it('keeps covering the original finding when later commits add nothing that triggers the rule', () => {
    sb.commit({ 'pay.js': PAY });
    override(`${ID}@${tokenOf('pay.js')}`);

    sb.commit({ 'pay.js': PAY + 'const price = 10;\n' }, 'unrelated change');

    expect(push().code).toBe(0);
  });

  it('does not cover the same rule in another file, even with identical content', () => {
    sb.commit({ 'pay.js': PAY, 'refund.js': PAY });
    override(`${ID}@${tokenOf('pay.js')}`);

    expect(push().code).toBe(1);

    override(`${ID}@${tokenOf('refund.js')}`);
    expect(push().code).toBe(0);
  });

  it('expires', () => {
    sb.commit({ 'pay.js': PAY });
    const token = tokenOf('pay.js');
    mkdirSync(join(sb.work, '.llll', 'logs'), { recursive: true });
    appendFileSync(
      join(sb.work, '.llll', 'logs', 'guard-log.jsonl'),
      JSON.stringify({
        action: 'override',
        findingIds: [ID],
        findingToken: token,
        justification: 'old decision',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }) + '\n',
    );

    expect(push().code).toBe(1);
  });

  it('ignores damaged lines in the log instead of failing open', () => {
    sb.commit({ 'pay.js': PAY });
    mkdirSync(join(sb.work, '.llll', 'logs'), { recursive: true });
    appendFileSync(join(sb.work, '.llll', 'logs', 'guard-log.jsonl'), 'not json\n{"action":"override"}\n\n');

    expect(push().code).toBe(1);
  });

  it('records who, why, how it was confirmed and when it expires', () => {
    sb.commit({ 'pay.js': PAY });
    override(`${ID}@${tokenOf('pay.js')}`, 'payments reviewed by legal', ['--yes', '--file', 'pay.js', '--days', '7']);

    const line = readFileSync(join(sb.work, '.llll', 'logs', 'guard-log.jsonl'), 'utf-8').trim();
    const entry = JSON.parse(line) as Record<string, unknown>;

    expect(entry).toMatchObject({
      action: 'override',
      findingIds: [ID],
      justification: 'payments reviewed by legal',
      filesAffected: ['pay.js'],
      confirmation: 'flag',
      actor: 'author@example.com',
    });
    const days = (Date.parse(String(entry.expiresAt)) - Date.parse(String(entry.timestamp))) / 86_400_000;
    expect(Math.round(days)).toBe(7);
  });

  it('writes the log at the repository root, wherever the command runs', () => {
    sb.commit({ 'pay.js': PAY, 'sub/keep.txt': 'x\n' });
    const token = tokenOf('pay.js');

    const res = sb.run(['override', `${ID}@${token}`, 'reviewed by legal', '--yes'], { cwd: join(sb.work, 'sub') });

    expect(res.code).toBe(0);
    expect(sb.exists('.llll/logs/guard-log.jsonl')).toBe(true);
    expect(sb.exists('sub/.llll/logs/guard-log.jsonl')).toBe(false);
    expect(push().code).toBe(0);
  });
});

describe('what override refuses', () => {
  it('refuses a HARD rule', () => {
    const res = sb.run(['override', 'PG-H001@0123456789ab', 'trust me', '--yes']);

    expect(res.code).toBe(1);
    expect(res.stderr).toContain('cannot be overridden');
  });

  it('refuses a reference without a token, which would cover a whole rule', () => {
    const res = override(ID);

    expect(res.code).toBe(2);
    expect(res.stderr).toContain('token');
  });

  it('refuses a malformed reference', () => {
    expect(override('PG-S002@xyz').code).toBe(2);
    expect(override('not-a-rule').code).toBe(2);
  });

  it('refuses an empty justification', () => {
    expect(override(`${ID}@0123456789ab`, '  ').code).toBe(2);
  });

  it('refuses to run without a person unless --yes is given', () => {
    const res = override(`${ID}@0123456789ab`, 'payments reviewed by legal', []);

    expect(res.code).toBe(2);
    expect(res.stderr).toContain('--yes');
    expect(sb.exists('.llll/logs/guard-log.jsonl')).toBe(false);
  });

  it.each(['0', '91', '1.5', 'many'])('refuses --days %s', days => {
    expect(override(`${ID}@0123456789ab`, 'payments reviewed by legal', ['--yes', '--days', days]).code).toBe(2);
  });
});
