import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Builds the CLI once per test run into a gitignored directory so the e2e
// tests exercise the real entry point (`node .test-dist/index.js`).
export default function setup(): void {
  const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const outDir = resolve(pkgRoot, '.test-dist');
  const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');

  rmSync(outDir, { recursive: true, force: true });
  execFileSync(
    process.execPath,
    [
      tsc,
      '-p', 'tsconfig.json',
      '--outDir', outDir,
      '--sourceMap', 'false',
      '--declaration', 'false',
      '--declarationMap', 'false',
    ],
    { cwd: pkgRoot, stdio: 'inherit' },
  );
}
