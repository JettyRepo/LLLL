import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PKG_ROOT } from './helpers/repo.js';

// The published package must be what it claims to be, and must pass its own release gate.

const NPM_ENV = { ...process.env, npm_config_update_notifier: 'false', npm_config_fund: 'false', npm_config_audit: 'false' };

function npm(args: string[]): string {
  return execFileSync('npm', args, { cwd: PKG_ROOT, encoding: 'utf-8', env: NPM_ENV, stdio: ['ignore', 'pipe', 'pipe'] });
}

describe('the published package', () => {
  // One build for the whole file: it is the slow part.
  let packed: { files: { path: string }[] };

  it('builds without source maps or declarations, and clears out what an older build left', () => {
    // Left by an earlier build with other settings, or for a source file that no longer exists.
    mkdirSync(join(PKG_ROOT, 'dist', 'removed'), { recursive: true });
    writeFileSync(join(PKG_ROOT, 'dist', 'stale.js.map'), '{"version":3}');
    writeFileSync(join(PKG_ROOT, 'dist', 'removed', 'old.js'), 'module.exports = 1;');

    npm(['run', 'build']);

    expect(existsSync(join(PKG_ROOT, 'dist', 'stale.js.map'))).toBe(false);
    expect(existsSync(join(PKG_ROOT, 'dist', 'removed'))).toBe(false);
    expect(existsSync(join(PKG_ROOT, 'dist', 'index.js'))).toBe(true);
    expect(existsSync(join(PKG_ROOT, 'dist', 'index.js.map'))).toBe(false);
    expect(existsSync(join(PKG_ROOT, 'dist', 'index.d.ts'))).toBe(false);
  }, 120_000);

  it('would publish package.json and dist, and nothing else', () => {
    const [pack] = JSON.parse(npm(['pack', '--dry-run', '--json', '--ignore-scripts'])) as [typeof packed];
    packed = pack;
    const paths = pack.files.map(f => f.path);

    expect(paths).toContain('package.json');
    expect(paths).toContain('dist/index.js');
    expect(paths.filter(p => p !== 'package.json' && !p.startsWith('dist/'))).toEqual([]);
    expect(paths.filter(p => /\.map$/.test(p))).toEqual([]);
  }, 60_000);

  it('has a bin that exists, with a shebang', () => {
    const pkg = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf-8')) as { bin: Record<string, string> };

    expect(packed.files.map(f => f.path)).toContain(pkg.bin['llll-guard']);
    expect(readFileSync(join(PKG_ROOT, pkg.bin['llll-guard']), 'utf-8').startsWith('#!/usr/bin/env node')).toBe(true);
  });

  it('runs from the built output', () => {
    const result = spawnSync(process.execPath, [join(PKG_ROOT, 'dist', 'index.js'), '--version'], { encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('passes its own release gate', () => {
    const result = spawnSync(process.execPath, [join(PKG_ROOT, 'dist', 'index.js'), 'release', '--json'], {
      cwd: PKG_ROOT,
      encoding: 'utf-8',
      env: NPM_ENV,
    });
    const report = JSON.parse(result.stdout.slice(result.stdout.indexOf('{'))) as {
      verdict: string;
      findings: { id: string; file?: string }[];
    };

    // Without a file name in the message a failure here would be hard to act on.
    expect(report.findings.map(f => `${f.id} ${f.file ?? ''}`)).toEqual([]);
    expect(report.verdict).toBe('PASS');
    expect(result.status).toBe(0);
  }, 60_000);

  it('requires a node version the code was written for', () => {
    const pkg = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf-8')) as { engines: { node: string } };

    expect(pkg.engines.node).toBe('>=20.0.0');
  });
});
