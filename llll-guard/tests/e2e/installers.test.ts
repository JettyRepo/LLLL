import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { REPO_ROOT, SKILL_DIR, Sandbox, bashMajorVersion } from '../helpers/repo.js';

// The three installers run against a sandbox HOME, so nothing of the developer's is touched.

const BASH = '/bin/bash';
const hasBash = bashMajorVersion(BASH) > 0;
const hasJq = existsSync('/usr/bin/jq') || existsSync('/opt/homebrew/bin/jq') || existsSync('/usr/local/bin/jq');
const suite = hasBash ? describe : describe.skip;

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

function install(script: string, args: string[] = []) {
  return sb.spawn(BASH, [join(REPO_ROOT, script), ...args], { env: { ...sb.env, XDG_DATA_HOME: join(sb.home, 'data') } });
}

const home = (...parts: string[]): string => join(sb.home, ...parts);

suite('install-claude-code.sh', () => {
  const dest = (): string => home('.claude/skills/llll');

  it('links the skill files only, not the whole clone', () => {
    const res = install('install-claude-code.sh');

    expect(res.code).toBe(0);
    const names = readdirSync(dest());
    expect(names).toContain('SKILL.md');
    expect(names).toContain('compliance-checklist-master.md');
    for (const f of ['mode-scan.md', 'mode-guard-review.md', 'menus.md', 'output-standards.md', 'observation-storage.md']) {
      expect(names).toContain(f);
    }
    expect(names).not.toContain('llll-guard');
    expect(names).not.toContain('tests');
    expect(names).not.toContain('install-codex.sh');
    expect(lstatSync(join(dest(), 'SKILL.md')).isSymbolicLink()).toBe(true);
    expect(readlinkSync(join(dest(), 'SKILL.md'))).toBe(join(SKILL_DIR, 'SKILL.md'));
  });

  it('can run again', () => {
    install('install-claude-code.sh');

    expect(install('install-claude-code.sh').code).toBe(0);
    expect(existsSync(join(dest(), 'SKILL.md'))).toBe(true);
  });

  it('replaces the whole-clone link an older installer made', () => {
    mkdirSync(home('.claude/skills'), { recursive: true });
    symlinkSync(REPO_ROOT, dest());

    const res = install('install-claude-code.sh');

    expect(res.code).toBe(0);
    expect(lstatSync(dest()).isSymbolicLink()).toBe(false);
    expect(readdirSync(dest())).not.toContain('llll-guard');
  });

  it('a symlinked config or AGENTS.md stays a symlink (dotfile managers)', () => {
    mkdirSync(home('.codex'), { recursive: true });
    writeFileSync(home('real-agents.md'), '# Mine\n');
    symlinkSync(home('real-agents.md'), home('.codex/AGENTS.md'));

    install('install-codex.sh');

    expect(lstatSync(home('.codex/AGENTS.md')).isSymbolicLink()).toBe(true);
    expect(readFileSync(home('real-agents.md'), 'utf-8')).toContain('BEGIN LLLL');
  });

  it('does not touch a directory it did not create', () => {
    mkdirSync(dest(), { recursive: true });
    writeFileSync(join(dest(), 'mine.txt'), 'keep');

    const res = install('install-claude-code.sh');

    expect(res.code).toBe(1);
    expect(readFileSync(join(dest(), 'mine.txt'), 'utf-8')).toBe('keep');
    expect(install('install-claude-code.sh', ['--uninstall']).code).toBe(1);
    expect(existsSync(join(dest(), 'mine.txt'))).toBe(true);
  });

  it('uninstalls', () => {
    install('install-claude-code.sh');

    expect(install('install-claude-code.sh', ['--uninstall']).code).toBe(0);
    expect(existsSync(dest())).toBe(false);
  });

  it('rejects an unknown option', () => {
    expect(install('install-claude-code.sh', ['--bogus']).code).toBe(2);
  });
});

(hasJq ? suite : describe.skip)('install-opencode.sh', () => {
  const config = (): string => home('.config/opencode/config.json');
  const data = (): string => home('data/llll/opencode');

  it('creates a valid config and keeps its data outside the clone', () => {
    const res = install('install-opencode.sh');

    expect(res.code).toBe(0);
    const parsed = JSON.parse(readFileSync(config(), 'utf-8'));
    expect(parsed.agent.llll.tools).toMatchObject({ write: false, edit: false });
    expect(parsed.command.llll.template).toContain(data());
    expect(existsSync(join(data(), 'SKILL.md'))).toBe(true);
    expect(existsSync(join(data(), 'mode-scan.md'))).toBe(true);
    expect(existsSync(join(data(), 'menus.md'))).toBe(true);
    expect(parsed.command.llll.template).toContain('mode-guard-review.md');
    expect(data().startsWith(REPO_ROOT)).toBe(false);
  });

  it('does not describe the agent as read-only while it can run shell commands', () => {
    install('install-opencode.sh');

    const parsed = JSON.parse(readFileSync(config(), 'utf-8'));
    expect(parsed.agent.llll.tools.bash).toBe(true);
    expect(parsed.agent.llll.description).not.toMatch(/read-only/);
  });

  it('with an existing config, changes nothing without --merge', () => {
    mkdirSync(home('.config/opencode'), { recursive: true });
    writeFileSync(config(), '{"theme":"dark"}');

    const res = install('install-opencode.sh');

    expect(res.stdout).toContain('already exists');
    expect(readFileSync(config(), 'utf-8')).toBe('{"theme":"dark"}');
  });

  it('--merge keeps the other settings and backs the config up', () => {
    mkdirSync(home('.config/opencode'), { recursive: true });
    writeFileSync(config(), '{"theme":"dark","agent":{"other":{"mode":"subagent"}}}');

    const res = install('install-opencode.sh', ['--merge']);

    expect(res.code).toBe(0);
    const parsed = JSON.parse(readFileSync(config(), 'utf-8'));
    expect(parsed.theme).toBe('dark');
    expect(parsed.agent.other.mode).toBe('subagent');
    expect(parsed.agent.llll).toBeDefined();
    expect(readdirSync(home('.config/opencode')).some(n => n.startsWith('config.json.bak.'))).toBe(true);
  });

  it('--merge into a config that is not valid JSON leaves it exactly as it was', () => {
    mkdirSync(home('.config/opencode'), { recursive: true });
    writeFileSync(config(), '{ "theme": "dark", // a comment\n}');

    const res = install('install-opencode.sh', ['--merge']);

    expect(res.code).toBe(1);
    expect(readFileSync(config(), 'utf-8')).toBe('{ "theme": "dark", // a comment\n}');
    expect(readdirSync(home('.config/opencode')).filter(n => n.startsWith('config.json.') && !n.includes('.bak.'))).toEqual([]);
  });

  it('--merge into an empty config fails and leaves it empty, instead of reporting success', () => {
    mkdirSync(home('.config/opencode'), { recursive: true });
    writeFileSync(config(), '');

    const res = install('install-opencode.sh', ['--merge']);

    expect(res.code).toBe(1);
    expect(res.stdout).not.toContain('Merged');
    expect(readFileSync(config(), 'utf-8')).toBe('');
  });

  it('with an existing config and no --merge it exits non-zero and says nothing is registered', () => {
    mkdirSync(home('.config/opencode'), { recursive: true });
    writeFileSync(config(), '{}');

    const res = install('install-opencode.sh');

    expect(res.code).toBe(3);
    expect(res.stdout).toContain('NOT registered');
  });

  it('--uninstall keeps the data when the config cannot be edited', () => {
    install('install-opencode.sh');
    writeFileSync(config(), 'not json');

    const res = install('install-opencode.sh', ['--uninstall']);

    expect(res.code).toBe(1);
    expect(existsSync(join(data(), 'SKILL.md'))).toBe(true);
  });

  it('--uninstall removes the entries and the data, and keeps the rest', () => {
    mkdirSync(home('.config/opencode'), { recursive: true });
    writeFileSync(config(), '{"theme":"dark"}');
    install('install-opencode.sh', ['--merge']);

    const res = install('install-opencode.sh', ['--uninstall']);

    expect(res.code).toBe(0);
    const parsed = JSON.parse(readFileSync(config(), 'utf-8'));
    expect(parsed.theme).toBe('dark');
    expect(parsed.agent?.llll).toBeUndefined();
    expect(parsed.command?.llll).toBeUndefined();
    expect(existsSync(data())).toBe(false);
  });
});

suite('install-codex.sh', () => {
  const agents = (): string => home('.codex/AGENTS.md');
  const count = (text: string, needle: string): number => text.split(needle).length - 1;
  const BEGIN = 'BEGIN LLLL';
  const writeAgents = (text: string): void => {
    mkdirSync(home('.codex'), { recursive: true });
    writeFileSync(agents(), text);
  };

  it('creates AGENTS.md with the current version and the half-visibility rule', () => {
    const res = install('install-codex.sh');

    expect(res.code).toBe(0);
    const text = readFileSync(agents(), 'utf-8');
    const version = /Embedded Compliance Layer v([0-9.]+)/.exec(readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf-8'))?.[1];
    expect(text).toContain(`v${version}**`);
    expect(text).toContain('round(N/2)');
    expect(text).not.toContain('fold Medium/Low');
    expect(text).toContain('mode-scan.md');
  });

  it('keeps what was in the file and adds one section', () => {
    writeAgents('# My rules\nbe nice\n');

    install('install-codex.sh');

    const text = readFileSync(agents(), 'utf-8');
    expect(text.startsWith('# My rules\nbe nice\n')).toBe(true);
    expect(count(text, BEGIN)).toBe(1);
  });

  it('running again replaces the section in place: one section, the rest untouched', () => {
    writeAgents('# My rules\nbe nice\n');
    install('install-codex.sh');
    const first = readFileSync(agents(), 'utf-8');

    install('install-codex.sh');

    expect(readFileSync(agents(), 'utf-8')).toBe(first);
  });

  it('upgrades a section whose text is out of date', () => {
    install('install-codex.sh');
    const stale = readFileSync(agents(), 'utf-8').replace('round(N/2)', 'OLDRULE');
    writeFileSync(agents(), stale);

    install('install-codex.sh');

    const text = readFileSync(agents(), 'utf-8');
    expect(text).not.toContain('OLDRULE');
    expect(count(text, BEGIN)).toBe(1);
  });

  it('replaces the unmarked section an older installer appended', () => {
    writeAgents(
      '# My rules\n\n---\n\n# LLLL — Embedded Compliance Layer\n\nYou have v5.0 here.\n\n4. LLLL never writes files — read-only analysis only.\n',
    );

    const res = install('install-codex.sh');

    expect(res.code).toBe(0);
    const text = readFileSync(agents(), 'utf-8');
    expect(text).toContain('# My rules');
    expect(text).not.toContain('You have v5.0 here.');
    expect(count(text, '# LLLL — Embedded Compliance Layer')).toBe(1);
  });

  it('refuses to cut a section whose end it cannot find, and changes nothing', () => {
    const broken = '# Mine\n<!-- BEGIN LLLL (managed by install-codex.sh; do not edit between the markers) -->\nhalf a section\n';
    writeAgents(broken);

    const res = install('install-codex.sh');

    expect(res.code).toBe(1);
    expect(readFileSync(agents(), 'utf-8')).toBe(broken);
  });

  it('--uninstall removes the section and leaves the rest', () => {
    writeAgents('# My rules\nbe nice\n');
    install('install-codex.sh');

    const res = install('install-codex.sh', ['--uninstall']);

    expect(res.code).toBe(0);
    const text = readFileSync(agents(), 'utf-8');
    expect(text).toContain('# My rules\nbe nice');
    expect(text).not.toContain('LLLL');
  });

  it('backs the file up before changing it', () => {
    writeAgents('# My rules\n');

    install('install-codex.sh');

    const backup = readdirSync(home('.codex')).find(n => n.startsWith('AGENTS.md.bak.'));
    expect(backup).toBeDefined();
    expect(readFileSync(join(home('.codex'), backup ?? ''), 'utf-8')).toBe('# My rules\n');
  });
});
