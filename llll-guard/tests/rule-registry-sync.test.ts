import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PKG_ROOT, REPO_ROOT } from './helpers/repo.js';
import { knownBug } from './helpers/known-bug.js';

// Audit findings covered here: H-2, DOC-4. The rule catalogue in guard-patterns.md
// and the rules the engine actually implements have drifted apart. Until a rule
// registry exists (P3), both sides are read straight from disk.

const RULE_ID = /\b(?:PG-[HSW]|RG-[HS])\d{3}\b/g;

function idsIn(text: string): Set<string> {
  return new Set(text.match(RULE_ID) ?? []);
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

function implementedIds(): Set<string> {
  const all = new Set<string>();
  for (const file of sourceFiles(join(PKG_ROOT, 'src'))) {
    for (const id of idsIn(readFileSync(file, 'utf-8'))) all.add(id);
  }
  return all;
}

const documented = idsIn(readFileSync(join(REPO_ROOT, 'guard-patterns.md'), 'utf-8'));
const implemented = implementedIds();

describe('rule catalogue', () => {
  it('reads both sides', () => {
    expect(documented.size).toBeGreaterThan(30);
    expect(implemented.size).toBeGreaterThan(30);
  });

  knownBug('implements every rule documented in guard-patterns.md (audit DOC-4)', () => {
    const missing = [...documented].filter(id => !implemented.has(id)).sort();

    // Today: RG-H003 (release gate content scan, P5). PG-H014 and PG-W003 arrived in P3.
    expect(missing).toEqual([]);
  });

  it('documents every rule the engine implements', () => {
    const undocumented = [...implemented].filter(id => !documented.has(id)).sort();

    expect(undocumented).toEqual([]);
  });
});
