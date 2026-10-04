import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PKG_ROOT, REPO_ROOT, SKILL_DIR } from './helpers/repo.js';

// The rule catalogue (guard-patterns.md) and the engine must name the same rules. Before this
// test they drifted: rules were documented that nothing implemented, and the reverse.

// The skill is SKILL.md plus the reference files it sends the model to; rule tables live in the latter.
const SKILL_FILES = ['SKILL.md', 'mode-scan.md', 'mode-guard-review.md', 'menus.md', 'output-standards.md', 'observation-storage.md'];

function read(file: string): string {
  if (file === 'SKILL') return SKILL_FILES.map(f => readFileSync(join(SKILL_DIR, f), 'utf-8')).join('\n');
  // README.md is the repository's own; every other document here is part of the skill.
  return readFileSync(join(file === 'README.md' ? REPO_ROOT : SKILL_DIR, file), 'utf-8');
}

const RULE_ID = /\b(?:PG|RG)-[HSW]\d{3}\b/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : path.endsWith('.ts') ? [path] : [];
  });
}

function ids(text: string): Set<string> {
  return new Set(text.match(RULE_ID) ?? []);
}

function catalogue(): Set<string> {
  // Only rows that define a rule: "| PG-H001 | ...". Prose may mention a rule id in passing.
  const rows = readFileSync(join(SKILL_DIR, 'guard-patterns.md'), 'utf-8')
    .split('\n')
    .filter(line => /^\|\s*(?:PG|RG)-[HSW]\d{3}\s*\|/.test(line));
  return ids(rows.join('\n'));
}

function engine(): Set<string> {
  return ids(sourceFiles(join(PKG_ROOT, 'src')).map(file => readFileSync(file, 'utf-8')).join('\n'));
}

describe('rule ids: guard-patterns.md and the engine', () => {
  it('every rule the engine can report is in the catalogue', () => {
    const missing = [...engine()].filter(id => !catalogue().has(id)).sort();

    expect(missing).toEqual([]);
  });

  it('every rule in the catalogue exists in the engine', () => {
    const phantom = [...catalogue()].filter(id => !engine().has(id)).sort();

    expect(phantom).toEqual([]);
  });

  it('the catalogue is not empty (the row format it is read by has not changed)', () => {
    expect(catalogue().size).toBeGreaterThan(30);
  });
});

describe('rule ids: other documents', () => {
  it.each(['llll-check-taxonomy.md', 'SKILL'])('%s lists every rule in the catalogue', file => {
    const listed = ids(read(file));
    const missing = [...catalogue()].filter(id => !listed.has(id)).sort();

    expect(missing).toEqual([]);
  });

  it('no document shows the engine command `override` with a bare rule id (the engine refuses it)', () => {
    // `/llll override PG-S002 "..."` is the skill's own syntax and is fine; the engine needs <id>@<token>.
    for (const file of ['SKILL', 'examples.md', 'README.md']) {
      const text = read(file);
      expect(text, file).not.toMatch(/guard\s+override\s+(?:PG|RG)-[HSW]\d{3}\s+["']/);
    }
  });

  it.each(['SKILL', 'llll-check-taxonomy.md'])('%s only names rules that exist', file => {
    const known = new Set([...engine(), ...catalogue()]);
    const unknown = [...ids(read(file))].filter(id => !known.has(id)).sort();

    expect(unknown).toEqual([]);
  });
});

describe('skill files', () => {
  it('SKILL.md names every reference file, so none is never read', () => {
    const core = readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf-8');
    const unnamed = SKILL_FILES.slice(1).filter(file => !core.includes(`\`${file}\``));

    expect(unnamed).toEqual([]);
  });

  it('SKILL.md stays a core file (under 1000 lines)', () => {
    expect(readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf-8').split('\n').length).toBeLessThan(1000);
  });
});
