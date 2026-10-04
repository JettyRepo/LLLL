import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { BASH_GUARD, CLI, Sandbox, ZERO_SHA, bashMajorVersion, prePushLine } from '../helpers/repo.js';

// Audit findings covered here: C-1, C-2, C-4, C-6, and the launcher's own contract. `guard` is a
// thin launcher over the TypeScript engine; these run it under the system bash (3.2 on stock macOS).

const SYSTEM_BASH = '/bin/bash';
const hasBash = bashMajorVersion(SYSTEM_BASH) > 0 && existsSync(BASH_GUARD);
const suite = hasBash ? describe : describe.skip;

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

const leak = (): string => `const key = "${FAKE.awsKey}";\n`;

/** Runs the launcher with the engine pointed at the test build. */
function guard(args: string[], env: NodeJS.ProcessEnv = {}, input = '') {
  return sb.spawn(SYSTEM_BASH, [BASH_GUARD, ...args], { env: { ...sb.env, LLLL_GUARD_BIN: CLI, ...env }, input });
}

/** A fake bin directory holding only the tools the launcher needs, and no node. */
function binWithoutNode(): string {
  const bin = join(sb.root, 'bin');
  mkdirSync(bin);
  return bin;
}

suite('bash guard (launcher)', () => {
  it('runs on the system bash without shell errors and blocks a leaked key (audit C-2)', () => {
    sb.commit({ 'src/config.js': leak() });

    const res = guard(['push']);

    expect(res.stderr).not.toMatch(/invalid option|syntax error/);
    expect(res.code).toBe(1);
    expect(res.stdout).toContain('PG-H001');
  });

  it('never passes silently when the scan could not run (audit C-2)', () => {
    sb.commit({ 'src/config.js': leak() });

    expect(guard(['push']).code).not.toBe(0);
  });

  it('never evaluates a file name as shell code (audit C-6)', () => {
    sb.commit({ 'HOME[$(touch PWNED)]': leak() });

    guard(['push']);

    expect(sb.exists('PWNED')).toBe(false);
  });

  it('blocks a private key pushed in a source file (audit C-1)', () => {
    sb.commit({ 'src/key.js': `${FAKE.pemRsa}\nMIIE...\n` });

    const res = guard(['push']);

    expect(res.code).toBe(1);
    expect(res.stdout).toContain('PG-H005');
  });

  it('the release gate sees the files npm would publish (audit C-4)', () => {
    sb.write('package.json', JSON.stringify({ name: 'pkg-under-test', version: '1.0.0' }));
    sb.write('index.js', 'module.exports = 1;\n');
    sb.write('.env', 'SECRET=1\n');

    expect(guard(['release']).stdout).toContain('RG-H001');
  });

  it('refuses to override a HARD rule id (audit H-1, DOC-11)', () => {
    expect(guard(['override', 'PG-H001', 'trust me']).code).not.toBe(0);
  });

  it('passes the engine exit code and arguments through', () => {
    expect(guard(['--version']).code).toBe(0);
    expect(guard(['no-such-command']).code).not.toBe(0);
  });

  it('follows a symlink to find its own directory', () => {
    const link = join(sb.root, 'guard-link');
    sb.spawn('ln', ['-s', BASH_GUARD, link]);

    const res = sb.spawn(SYSTEM_BASH, [link, 'doctor'], { env: { ...sb.env, LLLL_GUARD_BIN: CLI } });

    expect(res.stdout).toContain(`launcher: ${BASH_GUARD}`);
  });
});

suite('bash guard: Node or engine missing', () => {
  it('a hook run warns, leaves a marker and lets the push through by default (0.2.x)', () => {
    const res = guard(['hook', 'pre-push', 'origin', sb.remote], { LLLL_GUARD_BIN: join(sb.root, 'absent.js'), LLLL_NODE: '' });

    expect(res.code).toBe(0);
    expect(res.stderr).toContain('NOT checked');
    expect(sb.exists('.llll/logs/guard-not-run.log')).toBe(true);
  });

  it('LLLL_GUARD_STRICT=1 stops the push (exit 2)', () => {
    const res = guard(['hook', 'pre-push', 'origin', sb.remote], {
      LLLL_GUARD_BIN: join(sb.root, 'absent.js'),
      LLLL_GUARD_STRICT: '1',
    });

    expect(res.code).toBe(2);
  });

  it.each(['push', 'release', 'install-hook'])('%s exits 2 and never 0 when the engine is missing', command => {
    const res = guard([command], { LLLL_GUARD_BIN: join(sb.root, 'absent.js') });

    expect(res.code).toBe(2);
  });

  it('an LLLL_NODE that is not a usable node is not silently replaced', () => {
    const res = guard(['push'], { LLLL_NODE: join(sb.root, 'no-node') });

    expect(res.code).toBe(2);
    expect(res.stderr).toContain('Node.js 22.12');
  });

  it('a node older than 22.12 is refused', () => {
    const bin = binWithoutNode();
    const old = join(bin, 'node');
    sb.write('node', '#!/bin/sh\nexit 1\n', bin);
    chmodSync(old, 0o755);

    const res = guard(['push'], { LLLL_NODE: old });

    expect(res.code).toBe(2);
  });

  it('doctor reports what is missing and exits 2', () => {
    const res = guard(['doctor'], { LLLL_GUARD_BIN: join(sb.root, 'absent.js') });

    expect(res.code).toBe(2);
    expect(res.stdout).toContain('NOT FOUND');
  });

  it('doctor exits 0 and names node and the engine when both are found', () => {
    const res = guard(['doctor']);

    expect(res.code).toBe(0);
    expect(res.stdout).toContain('node:');
    expect(res.stdout).toContain(`engine:   ${CLI}`);
  });
});

suite('bash guard: hook written by an earlier version', () => {
  const gitEnv = { GIT_EXEC_PATH: '/usr/libexec/git-core', GIT_PREFIX: '' };

  it('`guard push` run by a script named pre-push, with refs on stdin, scans them and says to reinstall', () => {
    const head = sb.commit({ 'src/config.js': leak() });
    const input = `${prePushLine('refs/heads/main', head, 'refs/heads/main', ZERO_SHA)}\n`;
    sb.write('pre-push', `#!/bin/bash\n"${BASH_GUARD}" push\n`, sb.root);
    chmodSync(join(sb.root, 'pre-push'), 0o755);

    const res = sb.spawn(join(sb.root, 'pre-push'), [], { env: { ...sb.env, LLLL_GUARD_BIN: CLI, ...gitEnv }, input });

    expect(res.code).toBe(1);
    expect(res.stderr).toContain('older version');
  });

  it('a git alias or another hook that runs `guard push` with empty stdin is NOT taken for a pre-push hook', () => {
    sb.commit({ 'src/config.js': leak() });

    // GIT_EXEC_PATH and GIT_PREFIX are set for aliases and every hook. Reading no refs would pass.
    const res = guard(['push'], gitEnv, '');

    expect(res.code).toBe(1);
    expect(res.stdout).toContain('PG-H001');
    expect(res.stderr).not.toContain('older version');
  });

  it('a missing engine in such a call is exit 2, not the warn-first pass', () => {
    const res = guard(['push'], { ...gitEnv, LLLL_GUARD_BIN: join(sb.root, 'absent.js') }, '');

    expect(res.code).toBe(2);
  });

  it('an engine on PATH that is not a JavaScript file is run as a program, not through node', () => {
    const bin = binWithoutNode();
    sb.write('llll-guard', '#!/bin/sh\necho "wrapper $*"\nexit 0\n', bin);
    chmodSync(join(bin, 'llll-guard'), 0o755);
    const lone = join(sb.root, 'lone');
    mkdirSync(lone);
    sb.spawn('cp', [BASH_GUARD, join(lone, 'guard')]);

    const res = sb.spawn(SYSTEM_BASH, [join(lone, 'guard'), '--version'], {
      env: { ...sb.env, PATH: `${bin}:${sb.env.PATH ?? ''}` },
    });

    expect(res.stdout).toContain('wrapper --version');
    expect(res.code).toBe(0);
  });
});
