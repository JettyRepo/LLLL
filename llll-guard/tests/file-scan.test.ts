import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/config/defaults.js';
import { isDocumentPath, scanFileChange } from '../src/scanners/file-scan.js';
import type { AddedLine } from '../src/diff.js';
import type { PublicByDesignDeps } from '../src/scanners/public-by-design.js';
import type { GuardConfig } from '../src/types.js';
import { FAKE } from './helpers/fixtures.js';

const added = (...texts: string[]): AddedLine[] => texts.map((text, i) => ({ text, line: i + 1 }));
const none: PublicByDesignDeps = { isPublishedValue: () => false };
const config = (overrides: Partial<GuardConfig> = {}): GuardConfig => ({ ...DEFAULT_CONFIG, ...overrides });

function scan(path: string, lines: string[], cfg = config(), deps: PublicByDesignDeps = none) {
  return scanFileChange({ path, added: added(...lines) }, cfg, deps);
}

const idsOf = (findings: { id: string }[]): string[] => findings.map(f => f.id);

describe('isDocumentPath', () => {
  it.each(['README.md', 'docs/guide.md', 'notes.txt', 'CHANGELOG', 'LICENSE', 'docs/CONTRIBUTING.rst', 'a/b/NOTICE.txt'])(
    '%s is documentation',
    path => expect(isDocumentPath(path)).toBe(true),
  );

  it.each(['src/app.js', 'config.json', 'Makefile', 'src/readme-parser.ts'])('%s is not', path =>
    expect(isDocumentPath(path)).toBe(false),
  );
});

describe('documentation files', () => {
  it('catches a real provider key pasted into a README', () => {
    expect(idsOf(scan('README.md', [`export OPENAI_API_KEY=${FAKE.openaiProjectKey}`]))).toContain('PG-H002');
  });

  it('catches a provider key in a plain notes file, which used to be excluded entirely', () => {
    expect(idsOf(scan('notes.txt', [`aws key: ${FAKE.awsKey}`]))).toContain('PG-H001');
  });

  it('lets an obvious placeholder through', () => {
    expect(scan('README.md', ['export OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx'])).toEqual([]);
  });

  it('lets the providers\' own example value through', () => {
    expect(scan('docs/aws.md', ['AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE'])).toEqual([]);
  });

  it('does not apply policy keywords to prose', () => {
    const prose = ['We use stripe for payments and openai for drafts.', 'TODO: write more'];

    expect(scan('docs/guide.md', prose)).toEqual([]);
  });

  it('reports a credential-looking assignment in prose as a warning only', () => {
    const findings = scan('docs/guide.md', ['password = "hunter2hunter2"']);

    expect(findings.map(f => [f.id, f.severity])).toEqual([['PG-H007', 'WARN']]);
  });

  it('still applies the path rules, so an internal analysis file is caught even as markdown', () => {
    const cfg = config({ internalFilePatterns: ['*Competitive_Analysis*'] });

    expect(idsOf(scan('LLLL_Competitive_Analysis_v2.md', ['text'], cfg))).toEqual(['PG-H014']);
  });
});

describe('env templates', () => {
  it('do not raise policy findings for the names of the variables they document', () => {
    expect(scan('.env.example', ['OPENAI_API_KEY=', 'STRIPE_SECRET_KEY=', '# TODO: fill in'])).toEqual([]);
  });

  it('are still scanned for credentials', () => {
    expect(idsOf(scan('.env.example', [`AWS_ACCESS_KEY_ID=${FAKE.awsKey}`]))).toContain('PG-H001');
  });
});

describe('code files', () => {
  it('applies every rule', () => {
    const findings = scan('src/pay.js', [`const k = "${FAKE.awsKey}";`, "import Stripe from 'stripe';", '// TODO: fix']);

    expect(idsOf(findings).sort()).toEqual(['PG-H001', 'PG-S002', 'PG-W001']);
  });

  it('keeps a provider key blocked even when its placeholder-looking body would pass in a README', () => {
    expect(idsOf(scan('src/config.js', [`const k = "${FAKE.awsKey}";`]))).toEqual(['PG-H001']);
  });

  it('turns off the secret rules when hardBlock is disabled but keeps the path rules', () => {
    const cfg = config({ pushRules: { ...DEFAULT_CONFIG.pushRules, hardBlock: false } });

    expect(scan('src/config.js', [`const k = "${FAKE.awsKey}";`], cfg)).toEqual([]);
    expect(idsOf(scan('.env.production', ['A=1'], cfg))).toEqual(['PG-H010']);
  });

  it('warns when a dependency manifest changes', () => {
    expect(idsOf(scan('package.json', ['"left-pad": "^1.3.0"']))).toContain('PG-W003');
    expect(idsOf(scan('services/api/requirements.txt', ['requests==2.31.0']))).toContain('PG-W003');
    expect(idsOf(scan('src/app.js', ['const a = 1;']))).not.toContain('PG-W003');
  });

  it('flags a copyleft dependency in a manifest', () => {
    expect(idsOf(scan('package.json', ['"license": "AGPL-3.0"']))).toContain('PG-S009');
  });
});

describe('public by design', () => {
  const generic = FAKE.genericApiKeyValue;

  it('downgrades a client-exposed API key to a warning and says why', () => {
    const [finding] = scan('app.js', [`const NEXT_PUBLIC_MAPS_API_KEY = "${generic}";`]);

    expect(finding.severity).toBe('WARN');
    expect(finding.id).toBe('PG-H006');
    expect(finding.title).toContain('public by design');
    expect(finding.description).toContain('NEXT_PUBLIC_MAPS_API_KEY');
  });

  it('never exposes the raw value in the downgraded finding', () => {
    const [finding] = scan('app.js', [`const NEXT_PUBLIC_MAPS_API_KEY = "${generic}";`]);

    expect(JSON.stringify(finding)).not.toContain(generic);
  });

  it('keeps a provider key blocked behind a client-exposed variable', () => {
    const [finding] = scan('app.js', [`const NEXT_PUBLIC_KEY = "${FAKE.awsKey}";`]);

    expect(finding.severity).toBe('HARD_BLOCK');
  });

  it('downgrades a generic value that is already published, using the injected check', () => {
    const [finding] = scan('config.js', [`const API_KEY = "${generic}";`], config(), {
      isPublishedValue: value => value === generic,
    });

    expect(finding.severity).toBe('WARN');
  });
});
