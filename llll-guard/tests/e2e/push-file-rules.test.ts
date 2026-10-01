import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { Sandbox, parseJsonResult } from '../helpers/repo.js';

// Audit findings covered here: C-3 (public-by-design port), H-2 / M-4 (docs and templates),
// L-8 (internal file patterns), PG-W003. Each test pushes through the real engine.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

const generic = FAKE.genericApiKeyValue;

function verdictAndFindings() {
  const res = sb.run(['push', '--json']);
  const result = parseJsonResult(res.stdout);
  return { code: res.code, verdict: result?.verdict, findings: result?.findings ?? [] };
}

describe('values already published in a template or README on a remote', () => {
  it('downgrades a generic value that a published .env.example already contains', () => {
    // Published before the guard existed: pushed without a hook.
    sb.commit({ '.env.example': `API_KEY="${generic}"\n` }, 'template');
    sb.git(['push', 'origin', 'main']);
    sb.commit({ 'config.js': `const API_KEY = "${generic}";\n` }, 'use the demo key');

    const { code, verdict, findings } = verdictAndFindings();

    expect(verdict).toBe('WARN');
    expect(code).toBe(0);
    expect(findings.find(f => f.file === 'config.js')?.severity).toBe('WARN');
  });

  it('does not let a template added in the same push vouch for the value', () => {
    sb.commit({ '.env.example': `API_KEY="${generic}"\n`, 'config.js': `const API_KEY = "${generic}";\n` }, 'both');

    const { code, verdict } = verdictAndFindings();

    expect(verdict).toBe('HARD_BLOCK');
    expect(code).toBe(1);
  });

  it('does not treat a published variable NAME as the value being published', () => {
    sb.commit({ '.env.example': 'API_KEY=\n' }, 'template');
    sb.git(['push', 'origin', 'main']);
    sb.commit({ 'config.js': `const API_KEY = "${generic}";\n` }, 'hardcode a key');

    const { code, verdict } = verdictAndFindings();

    expect(verdict).toBe('HARD_BLOCK');
    expect(code).toBe(1);
  });
});

describe('env templates', () => {
  it('downgrades a placeholder value to a warning', () => {
    sb.commit({ '.env.example': 'API_KEY="changemechangeme1234"\n' });

    const { code, verdict } = verdictAndFindings();

    expect(verdict).toBe('WARN');
    expect(code).toBe(0);
  });

  it('blocks a realistic value pasted into a template, the classic copy of a real .env', () => {
    sb.commit({ '.env.example': `API_KEY="${generic}"\n` });

    const { code, verdict } = verdictAndFindings();

    expect(verdict).toBe('HARD_BLOCK');
    expect(code).toBe(1);
  });

  it('lets a placeholder provider key in a template through', () => {
    sb.commit({ '.env.example': 'OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx\n' });

    expect(verdictAndFindings().code).toBe(0);
  });

  it('blocks .env.local and .env.production, nested or not', () => {
    sb.commit({ '.env.local': 'A=1\n', 'apps/web/.env.production': 'B=2\n' });

    const { code, findings } = verdictAndFindings();

    expect(code).toBe(1);
    expect(findings.filter(f => f.id === 'PG-H010').map(f => f.file).sort()).toEqual([
      '.env.local',
      'apps/web/.env.production',
    ]);
  });
});

describe('documentation files', () => {
  it('blocks a real provider key in a README', () => {
    sb.commit({ 'README.md': `Run with OPENAI_API_KEY=${FAKE.openaiProjectKey}\n` });

    expect(verdictAndFindings().code).toBe(1);
  });

  it('blocks a provider key in a plain notes file, which used to be skipped', () => {
    sb.commit({ 'notes.txt': `my key: ${FAKE.awsKey}\n` });

    expect(verdictAndFindings().code).toBe(1);
  });

  it('blocks a provider key in a nested docs folder', () => {
    sb.commit({ 'docs/setup/guide.md': `export AWS_ACCESS_KEY_ID=${FAKE.awsKey}\n` });

    expect(verdictAndFindings().code).toBe(1);
  });

  it('lets placeholders and the providers\' own example values through', () => {
    sb.commit({
      'README.md': [
        'export OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx',
        'export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
        '',
      ].join('\n'),
    });

    expect(verdictAndFindings().code).toBe(0);
  });

  it('reports an assignment in prose as a warning and ignores policy keywords', () => {
    sb.commit({ 'docs/guide.md': 'Set password = "hunter2hunter2" and use stripe and openai.\nTODO: more\n' });

    const { code, verdict, findings } = verdictAndFindings();

    expect(code).toBe(0);
    expect(verdict).toBe('WARN');
    expect(findings.map(f => f.id)).toEqual(['PG-H007']);
  });

  it('still reads code in a file whose name only starts with README', () => {
    sb.commit({ 'src/readme-parser.js': 'const password = "hunter2hunter2";\n' });

    expect(verdictAndFindings().code).toBe(1);
  });
});

describe('generated files', () => {
  it('skips lock files, nested or not', () => {
    sb.commit({
      'package-lock.json': `{"x": "${FAKE.awsKey}"}\n`,
      'app/package-lock.json': `{"x": "${FAKE.awsKey}"}\n`,
      'Cargo.lock': `${FAKE.awsKey}\n`,
    });

    expect(verdictAndFindings().code).toBe(0);
  });
});

describe('default exclusions are exact lock file names', () => {
  it.each(['src/deploy/secrets.sum', 'creds.lock', '.env.lock', 'keys/server.lock', 'my-package-lock.json'])(
    'does not skip %s just because of its extension',
    path => {
      sb.commit({ [path]: `${FAKE.awsKey}\n` });

      expect(verdictAndFindings().code).toBe(1);
    },
  );

  it('still skips go.sum and yarn.lock at any depth', () => {
    sb.commit({ 'go.sum': `${FAKE.awsKey}\n`, 'svc/yarn.lock': `${FAKE.awsKey}\n` });

    expect(verdictAndFindings().code).toBe(0);
  });
});

describe('configured internal files (PG-H014)', () => {
  it('is off by default', () => {
    sb.commit({ 'LLLL_Competitive_Analysis_v2.md': 'internal notes\n' });

    expect(verdictAndFindings().code).toBe(0);
  });

  it('blocks the patterns a project lists, even for markdown', () => {
    sb.publish({ 'llll.policy.json': JSON.stringify({ internalFilePatterns: ['*Competitive_Analysis*', 'AGENT_PROMPT_*'] }) });
    sb.commit({ 'notes/LLLL_Competitive_Analysis_v2.md': 'internal notes\n' });

    const { code, findings } = verdictAndFindings();

    expect(code).toBe(1);
    expect(findings.map(f => f.id)).toContain('PG-H014');
  });

  it('rejects an internalFilePatterns value that is not an array of strings', () => {
    sb.publish({ 'llll.policy.json': JSON.stringify({ internalFilePatterns: '*.md' }) });
    sb.commit({ 'a.js': 'const a = 1;\n' });

    const res = sb.run(['push']);

    expect(res.code).toBe(2);
    expect(res.stderr).toContain('internalFilePatterns');
  });
});

describe('dependency manifests (PG-W003)', () => {
  it('warns but does not block when a manifest changes', () => {
    sb.commit({ 'package.json': '{"dependencies": {"left-pad": "^1.3.0"}}\n' });

    const { code, verdict, findings } = verdictAndFindings();

    expect(findings.map(f => f.id)).toContain('PG-W003');
    expect(verdict).toBe('WARN');
    expect(code).toBe(0);
  });
});
