import { describe, it, expect } from 'vitest';
import { scanReleaseFiles, checkWhitelist, checkReleaseSize, scanSourceMapContent } from '../src/scanners/release-scanner.js';

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

describe('checkWhitelist', () => {
  it('flags missing whitelist', () => {
    const finding = checkWhitelist(['dist/index.js'], { allowedPatterns: [], maxPackageSize: 10_000_000 });
    expect(finding).not.toBeNull();
    expect(finding!.id).toBe('RG-S006');
  });

  it('passes with whitelist', () => {
    const finding = checkWhitelist(['dist/index.js'], { allowedPatterns: ['dist/**'], maxPackageSize: 10_000_000 });
    expect(finding).toBeNull();
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
