import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { Sandbox, parseJsonResult } from '../helpers/repo.js';

// Audit finding covered here: C-3. The bash guard downgrades "public by design"
// credentials to WARN, but it matches the whole line and every token on it, so
// real secrets slip through. The TypeScript engine now has the downgrade, with
// stricter rules (src/scanners/public-by-design.ts). More cases: push-file-rules.test.ts.
//
// Behaviour:
//   - only the matched secret value is compared, never the variable name or the line;
//   - a client prefix counts only when it is on the variable being assigned;
//   - provider-format keys (AKIA, sk-, ghp_, PEM) are never downgraded;
//   - in env templates only placeholder values are downgraded.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

describe('public-by-design downgrade', () => {
  it('keeps blocking a real key when its variable name is listed in .env.example', () => {
    sb.commit({
      '.env.example': 'STRIPE_SECRET_KEY=\n',
      'server.js': `const STRIPE_SECRET_KEY = "${FAKE.awsKey}";\n`,
    });

    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(1);
    expect(parseJsonResult(res.stdout)?.verdict).toBe('HARD_BLOCK');
  });

  it('keeps blocking a provider key when a client prefix only appears in a comment', () => {
    sb.commit({ 'app.js': `const k = "${FAKE.awsKey}"; // VITE_ see docs\n` });

    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(1);
    expect(parseJsonResult(res.stdout)?.verdict).toBe('HARD_BLOCK');
  });

  it('keeps blocking a provider key assigned to a client-prefixed variable', () => {
    sb.commit({ 'app.js': `const NEXT_PUBLIC_TOKEN = "${FAKE.awsKey}";\n` });

    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(1);
  });

  it('keeps blocking a real provider key that was pasted into .env.example', () => {
    sb.commit({ '.env.example': `AWS_ACCESS_KEY_ID=${FAKE.awsKey}\n` });

    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(1);
  });

  it('keeps blocking a later real key even when an earlier line is client-exposed', () => {
    sb.commit({
      'config.js': [
        `const NEXT_PUBLIC_MAPS_API_KEY = "${FAKE.genericApiKeyValue}";`,
        `const API_KEY = "${FAKE.genericApiKeyValue}X";`,
        '',
      ].join('\n'),
    });

    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(1);
    expect(parseJsonResult(res.stdout)?.verdict).toBe('HARD_BLOCK');
  });

  it('downgrades a non-provider key in a client-prefixed variable to WARN (audit C-3)', () => {
    sb.commit({
      'app.js': `const NEXT_PUBLIC_MAPS_API_KEY = "${FAKE.genericApiKeyValue}";\n`,
    });

    const res = sb.run(['push', '--json']);

    // Deliberately public credential: reported, but it must not block the push.
    expect(parseJsonResult(res.stdout)?.verdict).toBe('WARN');
    expect(res.code).toBe(0);
  });

});
