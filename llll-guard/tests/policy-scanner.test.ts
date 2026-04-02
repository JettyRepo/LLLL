import { describe, it, expect } from 'vitest';
import { scanForPolicyIssues, scanForCopyleftDeps } from '../src/scanners/policy-scanner.js';

describe('scanForPolicyIssues', () => {
  it('detects Stripe integration', () => {
    const content = 'import Stripe from "stripe";\nconst stripe = new Stripe(key);';
    const findings = scanForPolicyIssues(content, 'billing.ts');
    expect(findings.some(f => f.id === 'PG-S002')).toBe(true);
    expect(findings.find(f => f.id === 'PG-S002')!.severity).toBe('SOFT_BLOCK');
  });

  it('detects OpenAI integration', () => {
    const content = 'import { openai } from "./client";\nconst response = await openai.chat.completions.create({});';
    const findings = scanForPolicyIssues(content, 'ai.ts');
    expect(findings.some(f => f.id === 'PG-S004')).toBe(true);
  });

  it('detects file upload', () => {
    const content = 'import multer from "multer";\nconst upload = multer({ dest: "uploads/" });';
    const findings = scanForPolicyIssues(content, 'upload.ts');
    expect(findings.some(f => f.id === 'PG-S001')).toBe(true);
  });

  it('detects analytics tracking', () => {
    const content = 'mixpanel.track("PageView", { page: "/home" });';
    const findings = scanForPolicyIssues(content, 'analytics.ts');
    expect(findings.some(f => f.id === 'PG-S005')).toBe(true);
  });

  it('detects geolocation', () => {
    const content = 'navigator.geolocation.getCurrentPosition(callback);';
    const findings = scanForPolicyIssues(content, 'location.ts');
    expect(findings.some(f => f.id === 'PG-S006')).toBe(true);
  });

  it('warns on TODO markers', () => {
    const content = '// TODO: fix this later\nconst x = 1;';
    const findings = scanForPolicyIssues(content, 'app.ts');
    expect(findings.some(f => f.id === 'PG-W001')).toBe(true);
  });

  it('warns on console.log in production code', () => {
    const content = 'console.log("debug info");';
    const findings = scanForPolicyIssues(content, 'handler.ts');
    expect(findings.some(f => f.id === 'PG-W002')).toBe(true);
  });

  it('skips WARN patterns in test files', () => {
    const content = 'console.log("test output");';
    const findings = scanForPolicyIssues(content, 'handler.test.ts');
    expect(findings.some(f => f.id === 'PG-W002')).toBe(false);
  });

  it('does not flag clean code', () => {
    const content = 'function add(a: number, b: number): number { return a + b; }';
    const findings = scanForPolicyIssues(content, 'utils.ts');
    expect(findings).toHaveLength(0);
  });

  it('avoids duplicate findings for same pattern in same file', () => {
    const content = 'stripe.charges.create({});\nstripe.customers.create({});';
    const findings = scanForPolicyIssues(content, 'billing.ts');
    const stripeFindings = findings.filter(f => f.id === 'PG-S002');
    expect(stripeFindings).toHaveLength(1);
  });
});

describe('scanForCopyleftDeps', () => {
  it('detects GPL in package.json', () => {
    const content = '{ "license": "GPL-3.0" }';
    const findings = scanForCopyleftDeps(content, 'package.json');
    expect(findings.some(f => f.id === 'PG-S009')).toBe(true);
  });

  it('ignores non-manifest files', () => {
    const content = '// This code is GPL licensed';
    const findings = scanForCopyleftDeps(content, 'readme.md');
    expect(findings).toHaveLength(0);
  });
});
