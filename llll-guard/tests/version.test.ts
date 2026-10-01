import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PKG_ROOT, Sandbox } from './helpers/repo.js';

describe('--version', () => {
  it('is the version in package.json, not a second copy', () => {
    const sb = Sandbox.create();
    try {
      const pkg = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf-8')) as { version: string };

      expect(sb.run(['--version']).stdout.trim()).toBe(pkg.version);
    } finally {
      sb.cleanup();
    }
  });
});
