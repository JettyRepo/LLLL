import { describe, it, expect } from 'vitest';
import { scanForSecrets, scanFilePathForSecrets } from '../src/scanners/secret-scanner.js';

describe('scanForSecrets', () => {
  it('detects AWS access key', () => {
    const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';
    const findings = scanForSecrets(content, 'config.ts');
    expect(findings).toHaveLength(1);
    expect(findings[0].id).toBe('PG-H001');
    expect(findings[0].severity).toBe('HARD_BLOCK');
  });

  it('detects OpenAI/Stripe secret key', () => {
    const content = 'const apiKey = "sk-abcdefghijklmnopqrstuvwxyz1234567890";';
    const findings = scanForSecrets(content, 'api.ts');
    expect(findings.some(f => f.id === 'PG-H002')).toBe(true);
  });

  it('detects GitHub PAT', () => {
    const content = 'const token = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij";';
    const findings = scanForSecrets(content, 'auth.ts');
    expect(findings.some(f => f.id === 'PG-H003')).toBe(true);
  });

  it('detects private key', () => {
    const content = '-----BEGIN RSA PRIVATE KEY-----\nMIIE...';
    const findings = scanForSecrets(content, 'cert.pem');
    expect(findings.some(f => f.id === 'PG-H005')).toBe(true);
  });

  it('detects hardcoded password', () => {
    const content = 'const password = "mySuperSecretPassword123";';
    const findings = scanForSecrets(content, 'config.ts');
    expect(findings.some(f => f.id === 'PG-H007')).toBe(true);
  });

  it('detects database URL', () => {
    const content = 'const database_url = "postgres://user:pass@localhost/db";';
    const findings = scanForSecrets(content, 'config.ts');
    expect(findings.some(f => f.id === 'PG-H008')).toBe(true);
  });

  it('does not flag clean code', () => {
    const content = 'const name = "hello world";\nconst count = 42;';
    const findings = scanForSecrets(content, 'app.ts');
    expect(findings).toHaveLength(0);
  });

  it('redacts matched secrets in findings', () => {
    const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';
    const findings = scanForSecrets(content, 'config.ts');
    expect(findings[0].match).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(findings[0].match).toContain('...');
  });
});

describe('scanFilePathForSecrets', () => {
  it('flags .env files', () => {
    const finding = scanFilePathForSecrets('.env');
    expect(finding).not.toBeNull();
    expect(finding!.id).toBe('PG-H010');
  });

  it('ignores .env.example', () => {
    const finding = scanFilePathForSecrets('.env.example');
    expect(finding).toBeNull();
  });

  it('ignores .env.template', () => {
    const finding = scanFilePathForSecrets('.env.template');
    expect(finding).toBeNull();
  });

  it('flags .pem files', () => {
    const finding = scanFilePathForSecrets('certs/server.pem');
    expect(finding).not.toBeNull();
    expect(finding!.id).toBe('PG-H011');
  });

  it('flags id_rsa files', () => {
    const finding = scanFilePathForSecrets('keys/id_rsa');
    expect(finding).not.toBeNull();
  });

  it('ignores normal files', () => {
    const finding = scanFilePathForSecrets('src/app.ts');
    expect(finding).toBeNull();
  });
});
