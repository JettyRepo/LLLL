import { describe, expect, it } from 'vitest';
import {
  isEnvTemplatePath,
  isPlaceholderValue,
  luhnValid,
  redactValue,
  scanFilePathForSecrets,
  scanForSecretHits,
  scanForSecrets,
} from '../src/scanners/secret-scanner.js';
import { FAKE } from './helpers/fixtures.js';

const ids = (content: string, options = {}): string[] =>
  scanForSecrets(content, 'src/app.js', options).map(f => f.id);

describe('provider formats', () => {
  it('detects AWS temporary credentials (ASIA) as well as long-term keys', () => {
    expect(ids(`const k = "ASIA${'Z'.repeat(16)}";`)).toContain('PG-H001');
  });

  it('detects live Stripe keys, secret and restricted', () => {
    expect(ids(`k = "${FAKE.stripeLiveKey}"`)).toContain('PG-H002');
    expect(ids(`k = "rk_live_${'a1B2'.repeat(5)}"`)).toContain('PG-H002');
  });

  it('does not flag Stripe test keys, which are not sensitive', () => {
    expect(ids(`k = "sk_test_${'a1B2'.repeat(6)}"`)).toEqual([]);
  });

  it('does not match "sk-" inside a longer word such as "task-"', () => {
    expect(ids('const queue = "task-manager-service-queue-name";')).toEqual([]);
  });

  it('reports every secret on a line, not only the first', () => {
    const line = `a = "${FAKE.awsKey}"; b = "${FAKE.githubPat}";`;

    expect(ids(line).sort()).toEqual(['PG-H001', 'PG-H003']);
  });

  it('skips the values the providers publish as documentation examples', () => {
    expect(ids('AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE')).toEqual([]);
  });

  it('detects every PEM private key header variant, including PKCS#8 and PGP', () => {
    for (const header of [FAKE.pemRsa, FAKE.pemPkcs8, FAKE.pemEncrypted, `-----BEGIN PGP PRIVATE KEY BLOCK-----`]) {
      expect(ids(header)).toContain('PG-H005');
    }
  });

  it('does not flag a public key or a certificate header', () => {
    expect(ids('-----BEGIN PUBLIC KEY-----')).toEqual([]);
    expect(ids('-----BEGIN CERTIFICATE-----')).toEqual([]);
  });
});

describe('placeholders in documentation and templates', () => {
  it('flags a placeholder-looking provider key in code', () => {
    expect(ids(`k = "${FAKE.awsKey}"`)).toContain('PG-H001');
  });

  it('skips a placeholder-looking provider key when placeholders are allowed', () => {
    expect(ids('OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx', { allowPlaceholders: true })).toEqual([]);
  });

  it('still flags a realistic provider key when placeholders are allowed', () => {
    expect(ids(`k = "${FAKE.openaiProjectKey}"`, { allowPlaceholders: true })).toContain('PG-H002');
  });

  it('runs only provider rules when asked to, so prose is not matched by assignment rules', () => {
    expect(ids('password = "hunter2hunter2"', { providerOnly: true })).toEqual([]);
    expect(ids('password = "hunter2hunter2"')).toContain('PG-H007');
  });

  it.each([
    ['', true],
    ['<your-api-key>', true],
    ['${API_KEY}', true],
    ['changeme', true],
    ['your-api-key-here', true],
    ['sk-xxxxxxxxxxxxxxxxxxxx', true],
    ['aaaaaaaaaaaa', true],
    ['AKIAIOSFODNN7EXAMPLE', false], // handled by the published-example list instead
    ['AbCdEf0123456789XyZqWe', false],
    [FAKE.awsKey, false],
  ])('isPlaceholderValue(%j) is %s', (value, expected) => {
    expect(isPlaceholderValue(value)).toBe(expected);
  });
});

describe('personal data', () => {
  it('flags a valid-looking SSN but not impossible ones', () => {
    expect(ids('ssn = "123-45-6789"')).toContain('PG-H012');
    expect(ids('id = "000-12-3456"')).toEqual([]);
    expect(ids('id = "666-12-3456"')).toEqual([]);
    expect(ids('id = "923-45-6789"')).toEqual([]);
    expect(ids('id = "123-00-6789"')).toEqual([]);
    expect(ids('id = "123-45-0000"')).toEqual([]);
  });

  it('does not match an SSN-shaped fragment inside a longer number', () => {
    expect(ids('ref = "9123-45-67890"')).toEqual([]);
  });

  it('requires a Luhn-valid number from a known issuer for a card', () => {
    expect(ids(`c = "${FAKE.cardNumberLuhnValid}"`)).toContain('PG-H013');
    expect(ids('c = "5500 0000 0000 0004"')).toContain('PG-H013');
    expect(ids('c = "5500-0000-0000-0004"')).toContain('PG-H013');
    expect(ids(`c = ${FAKE.sixteenDigitsNotACard}`)).toEqual([]);
    // Luhn-valid, but not an issuer prefix: a plain id that happens to pass the check.
    expect(ids('id = 7000000000000000')).toEqual([]);
  });

  it('finds a card number that is followed by a CVV or an expiry date', () => {
    expect(ids('card = "5500 0000 0000 0004 123"')).toContain('PG-H013');
    expect(ids('5500000000000004 12 25')).toContain('PG-H013');
    expect(ids('5500 0000 0000 0004 12/25')).toContain('PG-H013');
  });

  it('does not cut pieces out of an unseparated number to find a card in it', () => {
    // Any 13 to 19 digit slice of a long id can pass the Luhn check by chance.
    expect(ids(`id = ${'1234567890'.repeat(2)}`)).toEqual([]);
    expect(ids(`ts = ${FAKE.sixteenDigitsNotACard}`)).toEqual([]);
  });

  it('lets a published test card through, even with more digits after it', () => {
    expect(ids('4242 4242 4242 4242')).toEqual([]);
    expect(ids('4242424242424242 12 25')).toEqual([]);
    expect(ids('4111 1111 1111 1111 123')).toEqual([]);
  });

  it('never carries any part of the value in the finding', () => {
    const [ssn] = scanForSecrets('ssn = "123-45-6789"', 'a.js');

    expect(ssn.match).toBeUndefined();
    expect(ssn.category).toBe('data');
  });

  it('luhnValid agrees with known numbers', () => {
    expect(luhnValid('4111111111111111')).toBe(true);
    expect(luhnValid('4111111111111112')).toBe(false);
  });
});

describe('credentials inside a connection string', () => {
  it('flags a password in a URL, in code or in prose', () => {
    const url = 'postgres://admin:S3cr3tpw9@db.internal:5432/app';

    expect(ids(`const u = "${url}";`)).toContain('PG-H008');
    expect(ids(`DATABASE_URL=${url}`)).toContain('PG-H008');
    expect(ids(`mongodb+srv://app:Zq8kR2mN4pL7@cluster0.mongodb.net/db`)).toContain('PG-H008');
  });

  it('reports a quoted DATABASE_URL once, as the match that is never downgraded', () => {
    const hits = scanForSecretHits('DATABASE_URL = "postgres://admin:S3cr3tpw9@db.internal/app"', 'a.js');

    expect(hits.map(h => [h.finding.id, h.tier])).toEqual([['PG-H008', 'provider']]);
  });

  it.each([
    ['dummy credentials', 'postgres://user:password@localhost:5432/app'],
    ['a placeholder', 'mongodb://<user>:<password>@host/db'],
    ['the default admin login', 'redis://admin:admin@localhost'],
    ['no password', 'https://example.com/a/b@c'],
    ['a username only', 'ssh://git@github.com/org/repo.git'],
  ])('does not flag %s', (_label, url) => {
    expect(ids(url)).toEqual([]);
  });
});

describe('matching stays fast on hostile input', () => {
  it('checks a deeply dotted path in linear time', () => {
    const started = Date.now();
    isEnvTemplatePath(`.env${'.a'.repeat(60)}/x`);
    scanFilePathForSecrets(`.env${'.a'.repeat(60)}/x`);

    expect(Date.now() - started).toBeLessThan(200);
  });

  it('scans a very long line quickly', () => {
    const started = Date.now();
    scanForSecrets(`${'1 '.repeat(100_000)}`, 'a.js');
    scanForSecrets(`${'a'.repeat(200_000)}`, 'a.js');

    expect(Date.now() - started).toBeLessThan(2_000);
  });
});

describe('bearer tokens', () => {
  it('flags a token that has digits', () => {
    expect(ids('Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.abc123def456ghi"')).toContain('PG-H009');
  });

  it('does not flag prose that follows the word Bearer', () => {
    expect(ids('// Bearer authenticationheaderisrequired')).toEqual([]);
    expect(ids('// Bearer token must be set')).toEqual([]);
  });
});

describe('redaction', () => {
  it('redacts the value of an assignment, not the whole match', () => {
    const [finding] = scanForSecrets(`const api_key = "${FAKE.genericApiKeyValue}";`, 'a.js');

    expect(finding.id).toBe('PG-H006');
    expect(finding.match).toBe(redactValue(FAKE.genericApiKeyValue, 'generic'));
    expect(finding.match).not.toContain('api_key');
  });

  it('reveals less of a generic value than of a provider key', () => {
    const twentyChars = 'AbCdEf0123456789XyZq';
    const long = 'AbCd'.repeat(10);

    expect(redactValue(twentyChars, 'provider')).toBe('AbCd...XyZq');
    expect(redactValue(twentyChars, 'generic')).toBe('Ab...Zq');
    expect(redactValue(long, 'generic')).toBe('AbCd...AbCd');
  });

  it('replaces short values entirely', () => {
    expect(redactValue('abcdefghijklmno', 'provider')).toBe('****');
    expect(redactValue('abcdefghijklmnop', 'provider')).toBe('abcd...mnop');
    expect(redactValue('Tr0ub4dor&3xy', 'generic')).toBe('****');
  });

  it('does not echo any part of a private key header', () => {
    const [finding] = scanForSecrets(FAKE.pemRsa, 'k.pem');

    expect(finding.match).toBe('[private key]');
  });

  it('exposes the raw value only through the detailed API', () => {
    const [hit] = scanForSecretHits(`k = "${FAKE.awsKey}"`, 'a.js');

    expect(hit.value).toBe(FAKE.awsKey);
    expect(hit.finding.match).not.toContain(FAKE.awsKey);
    expect(hit.tier).toBe('provider');
  });
});

describe('sensitive file paths', () => {
  it.each([
    '.env',
    '.env.local',
    '.env.production',
    '.env.development.local',
    'config/.env',
    'apps/web/.env.staging',
  ])('flags %s', path => {
    expect(scanFilePathForSecrets(path)?.id).toBe('PG-H010');
  });

  it.each([
    '.env.example',
    '.env.sample',
    '.env.template',
    '.env.defaults',
    '.env.local.example',
    'apps/web/.env.production.sample',
  ])('ignores the template %s', path => {
    expect(isEnvTemplatePath(path)).toBe(true);
    expect(scanFilePathForSecrets(path)).toBeNull();
  });

  it.each(['certs/server.pem', 'k.key', 'store.p12', 'cert.pfx', 'keys/id_rsa', '.ssh/id_ed25519', 'id_ecdsa', 'id_rsa_backup'])(
    'flags the key file %s',
    path => {
      expect(scanFilePathForSecrets(path)?.id).toBe('PG-H011');
    },
  );

  it.each(['keys/id_rsa.pub', 'id_ed25519.pub'])('does not flag the public key %s', path => {
    expect(scanFilePathForSecrets(path)).toBeNull();
  });

  it('ignores ordinary files', () => {
    expect(scanFilePathForSecrets('src/envelope.ts')).toBeNull();
    expect(scanFilePathForSecrets('docs/environment.md')).toBeNull();
  });

  it('applies internal file patterns only when they are configured', () => {
    const patterns = ['*Competitive_Analysis*', 'AGENT_PROMPT_*'];

    expect(scanFilePathForSecrets('notes/LLLL_Competitive_Analysis_v2.md')).toBeNull();
    expect(scanFilePathForSecrets('notes/LLLL_Competitive_Analysis_v2.md', { internalFilePatterns: patterns })?.id).toBe(
      'PG-H014',
    );
    expect(scanFilePathForSecrets('AGENT_PROMPT_1.md', { internalFilePatterns: patterns })?.id).toBe('PG-H014');
    expect(scanFilePathForSecrets('src/app.ts', { internalFilePatterns: patterns })).toBeNull();
  });
});
