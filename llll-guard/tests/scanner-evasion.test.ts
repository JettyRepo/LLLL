import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import { isDocumentPath, scanFileChange } from '../src/scanners/file-scan.js';
import { publicByDesignReason } from '../src/scanners/public-by-design.js';
import { scanForPolicyIssues } from '../src/scanners/policy-scanner.js';
import {
  isPlaceholderValue,
  scanFilePathForSecrets,
  scanForSecrets,
} from '../src/scanners/secret-scanner.js';
import type { AddedLine } from '../src/diff.js';
import { FAKE } from './helpers/fixtures.js';

// Each block here is a way found in review to make a real credential or policy trigger
// invisible. They must stay closed.

const lines = (...texts: string[]): AddedLine[] => texts.map((text, i) => ({ text, line: i + 1 }));
const none = { isPublishedValue: () => false };
const idsIn = (content: string, file = 'src/app.js'): string[] => scanForSecrets(content, file).map(f => f.id);
const policyIds = (line: string): string[] => scanForPolicyIssues(line, 'src/app.js').map(f => f.id);

function scanFile(path: string, ...texts: string[]) {
  return scanFileChange({ path, added: lines(...texts) }, DEFAULT_CONFIG, none);
}

describe('provider keys with something attached (a word boundary hid these)', () => {
  const gh = 'a1B2'.repeat(9);

  it.each([
    ['a suffix after an underscore', `ghp_${gh}_old`],
    ['a trailing digit', `ghp_${gh}1`],
    ['a name prefix', `TOKEN_ghp_${gh}`],
    ['an AWS key with a suffix', `${FAKE.awsKey}_prod`],
    ['an AWS key followed by a digit', `${FAKE.awsKey}1`],
    ['an AWS key after a name', `KEY_${FAKE.awsKey}`],
    ['an sk- key after an underscore', `my_sk-${'a1B2c3D4'.repeat(3)}`],
  ])('still flags %s', (_label, text) => {
    expect(idsIn(`x = "${text}"`).length).toBeGreaterThan(0);
  });

  it('still does not match inside an ordinary word', () => {
    expect(idsIn('const t = "task-manager-service-queue-name";')).toEqual([]);
    expect(idsIn(`const t = "xghp_${gh}";`)).toEqual([]);
  });
});

describe('placeholders are judged on the whole value, not on a substring', () => {
  it.each([
    ['sk-AbCd1234EfGh5678IjKlMnOp_example'],
    ['ghp_AbCd1234EfGh5678IjKlMnOpQrSt9876xxxx'],
    ['sk-live-AbCd1234EfGh5678IjKlMnOp-test'],
    ['S3cr3tpw'],
  ])('%s is not a placeholder', value => {
    expect(isPlaceholderValue(value)).toBe(false);
  });

  it.each([
    ['sk-xxxxxxxxxxxxxxxxxxxxxxxx'],
    ['your-api-key-here'],
    ['YOUR_API_KEY'],
    ['changemechangeme1234'],
    ['<api-key>'],
    ['sk-proj-example-example-example'],
    ['replace-me'],
    ['test-key-1234'],
  ])('%s is a placeholder', value => {
    expect(isPlaceholderValue(value)).toBe(true);
  });

  it('is not slow on a long value built from placeholder words', () => {
    const started = Date.now();
    isPlaceholderValue('changeme'.repeat(8) + '!');
    isPlaceholderValue('x'.repeat(200) + '!');

    expect(Date.now() - started).toBeLessThan(500);
  });

  it('flags a real key in a README even if it ends in "_example"', () => {
    const [finding] = scanFile('README.md', 'export OPENAI_API_KEY=sk-AbCd1234EfGh5678IjKlMnOp_example');

    expect(finding?.severity).toBe('HARD_BLOCK');
  });

  it('flags a real-looking database URL in an env template even when the host is example.com', () => {
    const findings = scanFile('.env.example', 'DATABASE_URL="postgres://admin:S3cr3tpw9@db.example.com:5432/app"');

    expect(findings.some(f => f.id === 'PG-H008' && f.severity === 'HARD_BLOCK')).toBe(true);
  });
});

describe('documentation is not a hiding place', () => {
  it('flags a database URL with credentials in a text file named like an env dump', () => {
    const findings = scanFile('prod-env.txt', 'DATABASE_URL=postgres://admin:S3cr3tpw9@db.internal:5432/app');

    expect(findings.some(f => f.id === 'PG-H008' && f.severity === 'HARD_BLOCK')).toBe(true);
  });

  it('does not flag a connection string whose credentials are placeholders', () => {
    expect(scanFile('README.md', 'DATABASE_URL=postgres://user:password@localhost:5432/app')).toEqual([]);
    expect(scanFile('README.md', 'mongodb://<user>:<password>@host/db')).toEqual([]);
  });

  it('reports a credential-looking assignment in prose as a warning instead of ignoring it', () => {
    const findings = scanFile('notes.txt', 'password = "hunter2hunter2"');

    expect(findings.map(f => [f.id, f.severity])).toEqual([['PG-H007', 'WARN']]);
  });

  it('flags real personal data in prose', () => {
    const findings = scanFile('customers.txt', 'jane 123-45-6789 card 5500 0000 0000 0004');

    expect(findings.map(f => f.id).sort()).toEqual(['PG-H012', 'PG-H013']);
    expect(findings.every(f => f.severity === 'HARD_BLOCK')).toBe(true);
  });

  it('lets the well-known public test card numbers through', () => {
    expect(scanFile('docs/payments.md', 'Use 4242 4242 4242 4242 or 4111111111111111 in test mode.')).toEqual([]);
    expect(idsIn('const card = "4242424242424242";')).toEqual([]);
  });

  it('does not treat a dependency list as documentation', () => {
    expect(isDocumentPath('requirements.txt')).toBe(false);
    expect(isDocumentPath('services/api/requirements-dev.txt')).toBe(false);
    expect(isDocumentPath('CMakeLists.txt')).toBe(false);
    expect(scanFile('requirements.txt', 'somepkg  # license: GPL-3.0').map(f => f.id)).toContain('PG-S009');
  });
});

describe('a client-exposed prefix must belong to the value (same-line trick)', () => {
  const value = 'AbCd1234EfGh5678IjKl';
  const reason = (lineText: string) =>
    publicByDesignReason(
      { tier: 'generic', ruleId: 'PG-H006', value, valueStart: lineText.indexOf(value), lineText, file: 'a.js' },
      none,
    );

  it.each([
    [`const NEXT_PUBLIC_A = 1; const api_key = "${value}";`],
    [`NEXT_PUBLIC_A=1 api_key="${value}"`],
    [`NEXT_PUBLIC_A: 1, api_key: "${value}"`],
    [`VITE_MODE = "x"; const apiKey = "${value}"`],
  ])('does not downgrade %s', lineText => {
    expect(reason(lineText)).toBeNull();
  });

  it.each([
    [`const NEXT_PUBLIC_MAPS_API_KEY = "${value}";`],
    [`NEXT_PUBLIC_MAPS_API_KEY="${value}"`],
    [`  NEXT_PUBLIC_MAPS_API_KEY: '${value}',`],
    [`export const VITE_ANALYTICS_API_KEY = \`${value}\``],
  ])('still downgrades %s', lineText => {
    expect(reason(lineText)).not.toBeNull();
  });
});

describe('path rules are not case sensitive', () => {
  it.each(['.ENV', 'config/.Env.Production', 'KEY.PEM', 'server.Key', 'ID_RSA', 'Id_Ed25519'])('flags %s', path => {
    expect(scanFilePathForSecrets(path)).not.toBeNull();
  });

  it.each(['.ENV.EXAMPLE', '.Env.Sample'])('treats %s as a template', path => {
    expect(scanFilePathForSecrets(path)).toBeNull();
  });

  it('checks internal file patterns before the template shortcut', () => {
    const hit = scanFilePathForSecrets('AGENT_PROMPT_1.env.example', { internalFilePatterns: ['AGENT_PROMPT_*'] });

    expect(hit?.id).toBe('PG-H014');
  });
});

describe('policy keywords survive normalization', () => {
  it.each([
    ['PG-S004', 'const client = new OpenAI({ apiKey });'],
    ['PG-S004', 'const model = new ChatOpenAI();'],
    ['PG-S004', 'import { OpenAIApi } from "openai";'],
    ['PG-S002', 'const client = new PayPalClient();'],
    ['PG-S002', 'return <CheckoutButton />;'],
    ['PG-S002', 'billing.subscribe(plan);'],
    ['PG-S007', 'const result = FaceAPI.detect(img);'],
    ['PG-S003', 'if (user.isMinor) block();'],
    ['PG-S010', 'const retentionDays = 30;'],
    ['PG-S010', 'retention: 30'],
    ['PG-S010', 'purgeAfterDays = 7'],
  ])('%s: %s', (id, line) => {
    expect(policyIds(line)).toContain(id);
  });

  it.each([
    ['git checkout', '# run git checkout main'],
    ['minor version', 'const minorVersion = 3;'],
    ['minority', 'const isMinority = false;'],
    ['subscribe', 'const sub = observable.subscribe();'],
    ['little', 'let little = 1;'],
  ])('does not fire on %s', (_label, line) => {
    expect(policyIds(line)).toEqual([]);
  });
});
