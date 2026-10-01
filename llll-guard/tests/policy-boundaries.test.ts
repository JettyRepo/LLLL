import { describe, expect, it } from 'vitest';
import { scanForPolicyIssues, scanManifestPath } from '../src/scanners/policy-scanner.js';

const ids = (line: string, file = 'src/app.js'): string[] => scanForPolicyIssues(line, file).map(f => f.id);

describe('SOFT_BLOCK rules fire on what they are meant for', () => {
  it.each([
    ['PG-S001', "const upload = multer({ dest: 'uploads/' });"],
    ['PG-S001', 'app.use(formidable());'],
    ['PG-S001', 'const fileUpload = true;'],
    ['PG-S002', "import Stripe from 'stripe';"],
    ['PG-S002', 'const intent = await createPaymentIntent();'],
    ['PG-S002', 'const priceId = req.body.price_id;'],
    ['PG-S002', 'stripe.checkout_session.create({})'],
    ['PG-S003', 'if (age < 13) requireParentalConsent();'],
    ['PG-S003', 'const COPPA_ENABLED = true;'],
    ['PG-S004', "import OpenAI from 'openai';"],
    ['PG-S004', 'const chain = new LangChain();'],
    ['PG-S004', 'const out = await chat_completions(req);'],
    ['PG-S005', "mixpanel.track('signup');"],
    ['PG-S005', "analytics.load('segment.io');"],
    ['PG-S006', 'navigator.geolocation.getCurrentPosition(cb);'],
    ['PG-S007', "import * as faceapi from 'faceapi';"],
    ['PG-S007', 'await biometricPrompt.authenticate();'],
    ['PG-S008', 'const creditScore = compute(user);'],
    ['PG-S008', 'runRiskAssessment(applicant);'],
    ['PG-S010', 'const cacheTtl = 3600;'],
    ['PG-S010', 'const TTL = 60;'],
    ['PG-S010', 'delete_after: 30'],
  ])('%s: %s', (id, line) => {
    expect(ids(line)).toContain(id);
  });
});

describe('SOFT_BLOCK rules no longer fire on look-alike words', () => {
  it.each([
    ['little', 'let little = 1;'],
    ['settle', 'await settle(promises);'],
    ['git checkout', '// run git checkout main first'],
    ['subscription', 'const subscription = observable.subscribe();'],
    ['line segment', 'const segment = line.segment(start, end);'],
    ['css pixel', '.dot { width: 1px; background: url(pixel.png); }'],
    ['isMinority', 'const isMinority = false;'],
    ['minor version', 'const minorVersion = 3;'],
    ['eligibility word', 'const eligibility = true;'],
    ['expiry', 'const tokenExpiry = Date.now();'],
  ])('%s', (_label, line) => {
    expect(ids(line)).toEqual([]);
  });
});

describe('WARN rules', () => {
  it('flags unresolved markers and debug output in production code', () => {
    expect(ids('// TODO fix this')).toContain('PG-W001');
    expect(ids('console.log(x);')).toContain('PG-W002');
    expect(ids('debugger;')).toContain('PG-W002');
    expect(ids('print("x")', 'tool.py')).toContain('PG-W002');
  });

  it('does not flag XXXX placeholders or a word that merely ends in "print("', () => {
    expect(ids('const mask = "XXXX-XXXX";')).toEqual([]);
    expect(ids('sprint(3)')).toEqual([]);
  });

  it('ignores WARN rules in test files', () => {
    expect(ids('console.log(x); // TODO', 'src/app.test.ts')).toEqual([]);
  });
});

describe('scanManifestPath', () => {
  it.each(['package.json', 'apps/web/package.json', 'requirements.txt', 'Cargo.toml', 'go.mod'])('flags %s', path => {
    expect(scanManifestPath(path)?.id).toBe('PG-W003');
    expect(scanManifestPath(path)?.severity).toBe('WARN');
  });

  it.each(['src/package.json.ts', 'my-requirements.txt', 'go.sum', 'README.md'])('ignores %s', path => {
    expect(scanManifestPath(path)).toBeNull();
  });
});
