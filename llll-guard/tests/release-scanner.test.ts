import { describe, it, expect } from 'vitest';
import {
  checkReleaseSize,
  checkReleaseWhitelist,
  scanReleaseContent,
  scanReleaseFiles,
  scanSourceMapContent,
} from '../src/scanners/release-scanner.js';
import { FAKE } from './helpers/fixtures.js';

describe('scanReleaseFiles', () => {
  it('blocks .env in release', () => {
    const findings = scanReleaseFiles(['.env', 'dist/index.js']);
    expect(findings.some(f => f.id === 'RG-H001')).toBe(true);
    expect(findings.find(f => f.id === 'RG-H001')!.severity).toBe('HARD_BLOCK');
  });

  it('blocks .pem in release', () => {
    const findings = scanReleaseFiles(['dist/index.js', 'certs/server.pem']);
    expect(findings.some(f => f.id === 'RG-H002')).toBe(true);
  });

  it('blocks source maps', () => {
    const findings = scanReleaseFiles(['dist/index.js', 'dist/index.js.map']);
    expect(findings.some(f => f.id === 'RG-H004')).toBe(true);
  });

  it('soft-blocks src/ directory', () => {
    const findings = scanReleaseFiles(['src/index.ts', 'dist/index.js']);
    expect(findings.some(f => f.id === 'RG-S001')).toBe(true);
    expect(findings.find(f => f.id === 'RG-S001')!.severity).toBe('SOFT_BLOCK');
  });

  it('soft-blocks test files', () => {
    const findings = scanReleaseFiles(['tests/app.test.ts', 'dist/index.js']);
    expect(findings.some(f => f.id === 'RG-S002')).toBe(true);
  });

  it('soft-blocks prompt files', () => {
    const findings = scanReleaseFiles(['prompts/system.md', 'dist/index.js']);
    expect(findings.some(f => f.id === 'RG-S004')).toBe(true);
  });

  it('passes clean release', () => {
    const findings = scanReleaseFiles(['package.json', 'dist/index.js', 'README.md']);
    expect(findings).toHaveLength(0);
  });
});

describe('checkReleaseWhitelist', () => {
  it('flags a package with neither a files field nor an .npmignore', () => {
    const finding = checkReleaseWhitelist(false, false);

    expect(finding?.id).toBe('RG-S006');
    expect(finding?.severity).toBe('SOFT_BLOCK');
  });

  it.each([
    ['a files field', true, false],
    ['an .npmignore', false, true],
    ['both', true, true],
  ])('passes with %s', (_label, hasFiles, hasNpmignore) => {
    expect(checkReleaseWhitelist(hasFiles, hasNpmignore)).toBeNull();
  });
});

describe('scanReleaseFiles: environment and key files use the shared path rules', () => {
  it.each(['.env', 'config/.env', '.env.production', '.ENV'])('RG-H001 for %s', path => {
    expect(scanReleaseFiles([path]).map(f => f.id)).toContain('RG-H001');
  });

  it('does not flag a template', () => {
    expect(scanReleaseFiles(['.env.example']).map(f => f.id)).not.toContain('RG-H001');
  });

  it('RG-H002 for a private key, not for a public one', () => {
    expect(scanReleaseFiles(['id_rsa']).map(f => f.id)).toContain('RG-H002');
    expect(scanReleaseFiles(['id_rsa.pub']).map(f => f.id)).not.toContain('RG-H002');
  });
});

describe('scanReleaseContent', () => {
  it('reports a provider key as RG-H003 and names the underlying rule', () => {
    const [finding] = scanReleaseContent(`const k = "${FAKE.awsKey}";`, 'dist/index.js');

    expect(finding.id).toBe('RG-H003');
    expect(finding.title).toContain('PG-H001');
    expect(finding.severity).toBe('HARD_BLOCK');
    expect(finding.line).toBe(1);
  });

  it('downgrades a client-exposed API key and says so', () => {
    const [finding] = scanReleaseContent(`const NEXT_PUBLIC_MAPS_API_KEY = "${FAKE.genericApiKeyValue}";`, 'dist/app.js');

    expect(finding.severity).toBe('WARN');
    expect(finding.title).toContain('public by design');
  });

  it('skips personal-data patterns', () => {
    expect(scanReleaseContent('const ssn = "123-45-6789"; const c = 5500000000000004;', 'dist/index.js')).toEqual([]);
  });

  it('applies provider rules only to documentation, and lets placeholders through', () => {
    expect(scanReleaseContent('password = "hunter2hunter2"', 'README.md')).toEqual([]);
    expect(scanReleaseContent('OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx', 'README.md')).toEqual([]);
    expect(scanReleaseContent(`OPENAI_API_KEY=${FAKE.openaiProjectKey}`, 'README.md')).toHaveLength(1);
  });
});

describe('checkReleaseSize', () => {
  it('flags large packages', () => {
    const finding = checkReleaseSize(15 * 1024 * 1024);
    expect(finding).not.toBeNull();
    expect(finding!.id).toBe('RG-S007');
  });

  it('passes normal packages', () => {
    const finding = checkReleaseSize(1 * 1024 * 1024);
    expect(finding).toBeNull();
  });
});

describe('scanSourceMapContent', () => {
  it('detects sourcesContent', () => {
    const content = '{"version":3,"sourcesContent":["const x = 1;"]}';
    const finding = scanSourceMapContent(content, 'dist/app.js.map');
    expect(finding).not.toBeNull();
    expect(finding!.id).toBe('RG-H005');
  });

  it('passes clean source map', () => {
    const content = '{"version":3,"sources":["../src/app.ts"]}';
    const finding = scanSourceMapContent(content, 'dist/app.js.map');
    expect(finding).toBeNull();
  });
});
