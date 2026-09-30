import { describe, expect, it } from 'vitest';
import { scanFilePathForSecrets, scanForSecrets } from '../src/scanners/secret-scanner.js';
import { scanForPolicyIssues } from '../src/scanners/policy-scanner.js';
import { FAKE } from './helpers/fixtures.js';
import { knownBug } from './helpers/known-bug.js';

// Audit findings covered here: H-5 and H-6 (rule coverage and false positives),
// TS-8, TS-9 (redaction), M-4. Each `knownBug` states behaviour we want and the
// scanner does not deliver yet.

const ids = (content: string, file = 'src/app.js'): string[] =>
  scanForSecrets(content, file).map(f => f.id);

// Must be a secret finding. A digit run inside a token can also trip the card
// pattern (category "data"), which would otherwise hide a missing provider rule.
const detectsSecret = (content: string): boolean =>
  scanForSecrets(content, 'src/app.js').some(f => f.category === 'secret');

describe('provider key formats', () => {
  it('detects OpenAI project keys (sk-proj-)', () => {
    expect(ids(`const k = "${FAKE.openaiProjectKey}";`)).toContain('PG-H002');
  });

  it('detects Anthropic keys (sk-ant-)', () => {
    expect(ids(`const k = "${FAKE.anthropicKey}";`)).toContain('PG-H002');
  });

  knownBug('detects Stripe live keys (sk_live_) (audit H-6)', () => {
    expect(detectsSecret(`const k = "${FAKE.stripeLiveKey}";`)).toBe(true);
  });

  knownBug('detects GitHub fine-grained tokens (github_pat_) (audit H-6)', () => {
    expect(detectsSecret(`const t = "${FAKE.githubFineGrainedPat}";`)).toBe(true);
  });

  knownBug('detects Slack bot tokens (xoxb-) (audit H-6)', () => {
    expect(detectsSecret(`const t = "${FAKE.slackBotToken}";`)).toBe(true);
  });

  knownBug('detects Google API keys (AIza) (audit H-6)', () => {
    expect(detectsSecret(`const k = "${FAKE.googleApiKey}";`)).toBe(true);
  });
});

describe('private keys', () => {
  it('detects an RSA private key header', () => {
    expect(ids(`${FAKE.pemRsa}\nMIIE...`)).toContain('PG-H005');
  });

  knownBug('detects a PKCS#8 private key header (audit H-6)', () => {
    expect(ids(`${FAKE.pemPkcs8}\nMIIE...`)).toContain('PG-H005');
  });

  knownBug('detects an encrypted private key header (audit H-6)', () => {
    expect(ids(`${FAKE.pemEncrypted}\nMIIE...`)).toContain('PG-H005');
  });
});

describe('false positives', () => {
  knownBug('does not flag a comment that only mentions a bearer token (audit TS-8)', () => {
    expect(ids('// Bearer token must be set in the Authorization header')).not.toContain('PG-H009');
  });

  knownBug('does not flag a sixteen digit number that fails the Luhn check (audit TS-8)', () => {
    expect(ids(`const ts = ${FAKE.sixteenDigitsNotACard};`)).not.toContain('PG-H013');
  });

  it('flags a card number that passes the Luhn check', () => {
    expect(ids(`const card = "${FAKE.cardNumberLuhnValid}";`)).toContain('PG-H013');
  });

  knownBug('does not treat a public SSH key file as a private key (audit TS-8)', () => {
    expect(scanFilePathForSecrets('keys/id_rsa.pub')).toBeNull();
  });

  knownBug('does not flag "little" as a TTL keyword (audit TS-7)', () => {
    const findings = scanForPolicyIssues('let little = 1;', 'src/app.js');
    expect(findings.map(f => f.id)).not.toContain('PG-S010');
  });

  knownBug('does not flag a word that merely contains "minor" (audit TS-7)', () => {
    const findings = scanForPolicyIssues('const isMinority = false;', 'src/app.js');
    expect(findings.map(f => f.id)).not.toContain('PG-S003');
  });
});

describe('sensitive file paths', () => {
  it('flags a nested .env', () => {
    expect(scanFilePathForSecrets('config/.env')).not.toBeNull();
  });

  it('ignores .env.example', () => {
    expect(scanFilePathForSecrets('.env.example')).toBeNull();
  });

  knownBug('flags .env.local (audit H-2, DOC-10)', () => {
    expect(scanFilePathForSecrets('.env.local')).not.toBeNull();
  });

  knownBug('flags .env.production (audit H-2, DOC-10)', () => {
    expect(scanFilePathForSecrets('.env.production')).not.toBeNull();
  });
});

describe('redaction', () => {
  knownBug('shows at most 4 leading and 4 trailing characters (audit TS-9)', () => {
    const [finding] = scanForSecrets(`const k = "${FAKE.awsKey}";`, 'src/app.js');

    // Currently 8 leading + 4 trailing characters.
    expect(finding.match).toMatch(/^.{4}\.\.\..{4}$/);
  });

  knownBug('never echoes digits of a card number (audit TS-9)', () => {
    const finding = scanForSecrets(`const c = "${FAKE.cardNumberLuhnValid}";`, 'src/app.js')
      .find(f => f.id === 'PG-H013');

    // Currently prints 8 leading + 4 trailing digits, far more than PCI allows.
    expect(finding?.match ?? '').not.toMatch(/\d{4}/);
  });
});
