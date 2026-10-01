import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { Sandbox, parseJsonResult, type JsonFinding } from '../helpers/repo.js';

// Audit findings covered here: M-4 (RG-H001 only matched a root-level .env), TS-15 (the gate never
// looked inside the files), R1/R2 (an npm failure or an unreadable file ended in "nothing to scan"
// and exit 0). The gate must never pass because it could not look.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

/** An npm package. `files` is set unless told otherwise, so RG-S006 stays out of the way. */
function makePackage(files: Record<string, string>, pkg: Record<string, unknown> = { files: ['*'] }): void {
  sb.write('package.json', JSON.stringify({ name: 'pkg-under-test', version: '1.0.0', ...pkg }));
  for (const [rel, content] of Object.entries(files)) {
    sb.write(rel, content);
  }
}

interface ReleaseRun {
  code: number;
  verdict?: string;
  findings: JsonFinding[];
  notes: string[];
  stderr: string;
  stdout: string;
}

function release(args: string[] = [], env?: NodeJS.ProcessEnv, cwd?: string): ReleaseRun {
  const res = sb.run(['release', '--json', ...args], { env, cwd });
  const result = parseJsonResult(res.stdout) as (ReturnType<typeof parseJsonResult> & { notes?: string[] }) | null;
  return {
    code: res.code,
    verdict: result?.verdict,
    findings: result?.findings ?? [],
    notes: result?.notes ?? [],
    stderr: res.stderr,
    stdout: res.stdout,
  };
}

const ids = (run: ReleaseRun): string[] => run.findings.map(f => f.id);
const filesOf = (run: ReleaseRun, id: string): (string | undefined)[] =>
  run.findings.filter(f => f.id === id).map(f => f.file);

describe('files that must not be published', () => {
  it.each(['.env', 'config/.env', '.env.production', 'apps/web/.env.local', '.ENV'])('blocks %s', path => {
    makePackage({ 'index.js': 'module.exports = 1;\n', [path]: 'SECRET=1\n' });

    const run = release();

    expect(filesOf(run, 'RG-H001')).toContain(path);
    expect(run.code).toBe(1);
  });

  it('does not block an env template', () => {
    makePackage({ 'index.js': 'module.exports = 1;\n', '.env.example': 'SECRET=\n' });

    expect(ids(release())).not.toContain('RG-H001');
  });

  it.each(['server.pem', 'certs/tls.key', 'store.p12', 'cert.pfx', 'id_rsa', 'keys/id_ed25519', 'ID_RSA'])(
    'blocks the key file %s',
    path => {
      makePackage({ 'index.js': 'module.exports = 1;\n', [path]: 'x\n' });

      expect(filesOf(release(), 'RG-H002')).toContain(path);
    },
  );

  it('does not block a public ssh key', () => {
    makePackage({ 'index.js': 'module.exports = 1;\n', 'id_rsa.pub': 'ssh-rsa AAAA\n' });

    expect(ids(release())).not.toContain('RG-H002');
  });

  it('blocks a source map', () => {
    makePackage({ 'index.js': 'module.exports = 1;\n', 'index.js.map': '{"version":3}\n' });

    expect(ids(release())).toContain('RG-H004');
  });

  it('blocks a source map that carries the original source (RG-H005)', () => {
    makePackage({ 'index.js': 'x\n', 'index.js.map': '{"version":3,"sourcesContent":["const a = 1;"]}\n' });

    expect(ids(release())).toContain('RG-H005');
  });

  it.each([
    ['RG-S001', 'src/app.ts'],
    ['RG-S002', 'test/app.test.js'],
    ['RG-S002', '__tests__/a.js'],
    ['RG-S003', 'internal/notes.js'],
    ['RG-S004', 'prompts/system.txt'],
    ['RG-S005', 'scripts/deploy.sh'],
  ])('%s: warns about %s', (id, path) => {
    makePackage({ 'index.js': 'module.exports = 1;\n', [path]: 'x\n' });

    const run = release();

    expect(ids(run)).toContain(id);
    expect(run.verdict).toBe('SOFT_BLOCK');
  });

  it('passes a clean package that has a release whitelist', () => {
    makePackage({ 'index.js': 'module.exports = 1;\n' });

    const run = release();

    expect(run.verdict).toBe('PASS');
    expect(run.code).toBe(0);
  });
});

describe('no release whitelist (RG-S006)', () => {
  it('flags a package with neither a "files" field nor an .npmignore', () => {
    makePackage({ 'index.js': 'module.exports = 1;\n' }, {});

    expect(ids(release())).toContain('RG-S006');
  });

  it('is satisfied by a "files" field', () => {
    makePackage({ 'index.js': 'module.exports = 1;\n' }, { files: ['index.js'] });

    expect(ids(release())).not.toContain('RG-S006');
  });

  it('is satisfied by an .npmignore', () => {
    makePackage({ 'index.js': 'module.exports = 1;\n', '.npmignore': 'test/\n' }, {});

    expect(ids(release())).not.toContain('RG-S006');
  });
});

describe('package size (RG-S007)', () => {
  it('flags a package larger than maxPackageSize in llll.whitelist.json', () => {
    makePackage({ 'index.js': `${'x'.repeat(2000)}\n` });
    sb.publish({ 'llll.whitelist.json': JSON.stringify({ maxPackageSize: 100 }) });

    expect(ids(release())).toContain('RG-S007');
  });

  it('applies to a directory scan as well', () => {
    makePackage({ 'out/a.js': `${'x'.repeat(2000)}\n` });
    sb.publish({ 'llll.whitelist.json': JSON.stringify({ maxPackageSize: 100 }) });

    expect(ids(release(['--dir', 'out']))).toContain('RG-S007');
  });
});

describe('secrets inside the published files (RG-H003)', () => {
  it('finds a provider key in a published file and says which rule it is', () => {
    makePackage({ 'index.js': `module.exports = "${FAKE.awsKey}";\n` });

    const run = release();
    const finding = run.findings.find(f => f.id === 'RG-H003');

    expect(finding?.file).toBe('index.js');
    expect(finding?.severity).toBe('HARD_BLOCK');
    expect(finding?.match).not.toContain(FAKE.awsKey);
    expect(run.code).toBe(1);
  });

  it('reports the line the secret is on', () => {
    makePackage({ 'index.js': `const a = 1;\nconst b = 2;\nconst key = "${FAKE.awsKey}";\n` });

    expect(release().findings.find(f => f.id === 'RG-H003')?.line).toBe(3);
  });

  it('finds a hardcoded credential assignment in code', () => {
    makePackage({ 'lib.js': 'const password = "hunter2hunter2";\n' });

    expect(ids(release())).toContain('RG-H003');
  });

  it('reports a client-exposed API key as a warning, not a block', () => {
    makePackage({ 'bundle.js': `const NEXT_PUBLIC_MAPS_API_KEY = "${FAKE.genericApiKeyValue}";\n` });

    const run = release();

    expect(run.findings.find(f => f.id === 'RG-H003')?.severity).toBe('WARN');
    expect(run.code).toBe(0);
  });

  it('finds a real provider key in a README that is published, but lets a placeholder through', () => {
    makePackage({ 'index.js': 'x\n', 'README.md': 'export OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx\n' });
    expect(ids(release())).not.toContain('RG-H003');

    makePackage({ 'index.js': 'x\n', 'README.md': `export OPENAI_API_KEY=${FAKE.openaiProjectKey}\n` });
    expect(ids(release())).toContain('RG-H003');
  });

  it('does not report personal-data look-alikes in published code', () => {
    makePackage({ 'index.js': 'const ssn = "123-45-6789"; const id = 5500000000000004;\n' });

    expect(ids(release())).not.toContain('RG-H003');
  });

  it('does not flag the providers\' documentation example', () => {
    makePackage({ 'index.js': 'const example = "AKIAIOSFODNN7EXAMPLE";\n' });

    expect(ids(release())).not.toContain('RG-H003');
  });

  it('scans a large file instead of skipping it', () => {
    makePackage({ 'big.js': `${'x'.repeat(6 * 1024 * 1024)}\nconst key = "${FAKE.awsKey}";\n` });

    const run = release();

    expect(ids(run)).toContain('RG-H003');
    expect(filesOf(run, 'RG-S008')).toEqual([]);
  });

  it('scans the files of a --dir scan too, named relative to that directory', () => {
    makePackage({ 'out/index.js': `const key = "${FAKE.awsKey}";\n` });

    expect(release(['--dir', 'out']).findings.find(f => f.id === 'RG-H003')?.file).toBe('index.js');
  });
});

describe('internal references (RG-H006)', () => {
  it.each([
    ['a JavaScript file', 'dist/index.js', '//# sourceMappingURL=s3://internal-bucket/index.js.map\n'],
    ['a stylesheet', 'dist/site.css', '/*# sourceMappingURL=gs://internal-bucket/site.css.map */\n'],
    ['a source map', 'dist/index.js.map', '{"version":3,"sourceMappingURL":"x"}\n//# sourceMappingURL=https://tools.internal/x.map\n'],
  ])('finds an internal sourceMappingURL in %s', (_label, path, content) => {
    makePackage({ [path]: content });

    expect(ids(release())).toContain('RG-H006');
  });

  it('does not flag an ordinary sourceMappingURL', () => {
    makePackage({ 'dist/index.js': '//# sourceMappingURL=index.js.map\n' });

    expect(ids(release())).not.toContain('RG-H006');
  });
});

describe('the gate never passes because it could not look', () => {
  it('exits 2 when npm cannot pack the package', () => {
    sb.write('package.json', '{ not json');

    const run = release();

    expect(run.code).toBe(2);
    expect(run.stderr).toMatch(/package\.json|npm pack/);
  });

  it('exits 2 when there is no package.json and no --dir to look at', () => {
    const run = release();

    expect(run.code).toBe(2);
    expect(run.stderr).toContain('--dir');
  });

  it('exits 2 for a --dir that does not exist', () => {
    expect(release(['--dir', 'no-such-dir']).code).toBe(2);
  });

  it('exits 2 when there is nothing in the artifact to scan', () => {
    mkdirSync(join(sb.work, 'out'));

    const run = release(['--dir', 'out']);

    expect(run.code).toBe(2);
    expect(run.stderr).toMatch(/nothing to scan|no release files/i);
  });

  it.skipIf(typeof process.getuid === 'function' && process.getuid() === 0)(
    'exits 2 when a published file cannot be read',
    () => {
      makePackage({ 'index.js': 'x\n', 'locked.js': `const key = "${FAKE.awsKey}";\n` });
      chmodSync(join(sb.work, 'locked.js'), 0o000);

      try {
        const run = release(['--dir', '.']);

        expect(run.code).toBe(2);
        expect(run.stderr).toContain('locked.js');
      } finally {
        chmodSync(join(sb.work, 'locked.js'), 0o644);
      }
    },
  );

  it('does not run the package\'s own scripts while listing what would be published', () => {
    makePackage(
      { 'index.js': 'x\n' },
      { files: ['index.js'], scripts: { prepack: 'node -e "require(\'fs\').writeFileSync(\'PREPACK_RAN\', \'x\')"' } },
    );

    const run = release();

    expect(sb.exists('PREPACK_RAN')).toBe(false);
    expect(run.verdict).toBe('PASS');
  });

  it('reads a malformed llll.whitelist.json as an error', () => {
    makePackage({ 'index.js': 'x\n' });
    sb.publish({ 'llll.whitelist.json': '{ nope' });

    expect(release().code).toBe(2);
  });

  it('says so, as a normal JSON result, when the policy disables the guard', () => {
    makePackage({ 'index.js': `const key = "${FAKE.awsKey}";\n` });
    sb.publish({ 'llll.policy.json': JSON.stringify({ enabled: false }) });

    const run = release();

    expect(run.code).toBe(0);
    expect(run.verdict).toBe('PASS');
    expect(run.notes.join(' ')).toMatch(/disabled/);
  });

  it('does not call a scan "safe" when the policy switched the guard off', () => {
    makePackage({ 'index.js': 'x\n' });
    sb.publish({ 'llll.policy.json': JSON.stringify({ enabled: false }) });

    const res = sb.run(['release']);

    expect(res.stdout).not.toMatch(/safe to proceed/i);
    expect(res.stdout).toMatch(/disabled/);
  });

  it('prints a machine-readable error for --json, so empty output is never read as success', () => {
    const res = sb.run(['release', '--json']);
    const body = JSON.parse(res.stdout.slice(res.stdout.indexOf('{'))) as { verdict: string; error: string };

    expect(res.code).toBe(2);
    expect(body.verdict).toBe('ERROR');
    expect(body.error).toContain('--dir');
  });
});

describe('a file the gate cannot read is a finding, never a pass (RG-S008)', () => {
  it('flags a file above the size limit instead of passing it with a note', () => {
    makePackage({ 'big.js': `${'x'.repeat(5000)}\nconst key = "${FAKE.awsKey}";\n`, 'small.js': 'x\n' });

    const run = release([], { LLLL_GUARD_MAX_FILE_BYTES: '1000' });

    expect(filesOf(run, 'RG-S008')).toContain('big.js');
    expect(run.verdict).toBe('SOFT_BLOCK');
    expect(run.code).toBe(1);
  });

  it('flags every file when the limit is absurdly small, so it cannot be used to switch the gate off', () => {
    makePackage({ 'a.js': 'x\n', 'b.js': 'y\n' });

    const run = release([], { LLLL_GUARD_MAX_FILE_BYTES: '1' });

    expect(filesOf(run, 'RG-S008').sort()).toEqual(expect.arrayContaining(['a.js', 'b.js']));
    expect(run.code).toBe(1);
  });

  it('still applies the path rules to a file above the limit', () => {
    makePackage({ '.env': `${'x'.repeat(5000)}\n` });

    expect(ids(release([], { LLLL_GUARD_MAX_FILE_BYTES: '1000' }))).toEqual(expect.arrayContaining(['RG-H001', 'RG-S008']));
  });

  it('counts only the files whose content was read', () => {
    makePackage({ 'out/big.js': `${'x'.repeat(5000)}\n`, 'out/small.js': 'x\n' });

    const res = sb.run(['release', '--json', '--dir', 'out'], { env: { LLLL_GUARD_MAX_FILE_BYTES: '1000' } });

    // small.js was read; big.js was not
    expect((JSON.parse(res.stdout.slice(res.stdout.indexOf('{'))) as { scannedFiles: number }).scannedFiles).toBe(1);
  });
});

describe('text that is not plain UTF-8 is still read', () => {
  const token = `const k = "${FAKE.githubPat}";`;

  it('reads UTF-16LE with a byte order mark', () => {
    sb.write('package.json', JSON.stringify({ name: 'p', version: '1.0.0', files: ['*'] }));
    sb.writeBytes('u16.js', Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(token, 'utf16le')]));

    expect(ids(release())).toContain('RG-H003');
  });

  it('reads UTF-16BE', () => {
    sb.write('package.json', JSON.stringify({ name: 'p', version: '1.0.0', files: ['*'] }));
    const le = Buffer.from(token, 'utf16le');
    sb.writeBytes('u16be.js', Buffer.concat([Buffer.from([0xfe, 0xff]), le.swap16()]));

    expect(ids(release())).toContain('RG-H003');
  });

  it('reads UTF-16 without a byte order mark', () => {
    sb.write('package.json', JSON.stringify({ name: 'p', version: '1.0.0', files: ['*'] }));
    sb.writeBytes('nobom.js', Buffer.from(token, 'utf16le'));

    expect(ids(release())).toContain('RG-H003');
  });

  it('is not fooled by NUL bytes inserted around a secret to look like a binary file', () => {
    sb.write('package.json', JSON.stringify({ name: 'p', version: '1.0.0', files: ['*'] }));
    sb.writeBytes('nul.js', Buffer.concat([Buffer.from([0, 0, 0, 0]), Buffer.from(token), Buffer.from([0])]));

    expect(ids(release())).toContain('RG-H003');
  });

  it('reads Latin-1 text next to a secret', () => {
    sb.write('package.json', JSON.stringify({ name: 'p', version: '1.0.0', files: ['*'] }));
    sb.writeBytes('latin.js', Buffer.concat([Buffer.from('// caf\xe9 \xff\n', 'latin1'), Buffer.from(token)]));

    expect(ids(release())).toContain('RG-H003');
  });
});

describe('source maps embedded in the file (RG-H004, RG-H005, RG-H006)', () => {
  const map = JSON.stringify({ version: 3, sources: ['../src/a.ts'], sourcesContent: ['const secret = 1;'] });
  const bareMap = JSON.stringify({ version: 3, sources: ['../src/a.ts'] });

  it('blocks an inline base64 source map, and says when it carries the source', () => {
    makePackage({
      'dist/a.js': `x();\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(map).toString('base64')}\n`,
    });

    const run = release();

    expect(ids(run)).toEqual(expect.arrayContaining(['RG-H004', 'RG-H005']));
    expect(run.code).toBe(1);
  });

  it('blocks an inline source map without sourcesContent too, since it still lists the source files', () => {
    makePackage({
      'dist/a.js': `x();\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${Buffer.from(bareMap).toString('base64')}\n`,
    });

    const run = release();

    expect(ids(run)).toContain('RG-H004');
    expect(ids(run)).not.toContain('RG-H005');
  });

  it('blocks an inline source map that is not base64', () => {
    makePackage({ 'dist/a.css': `a{}\n/*# sourceMappingURL=data:application/json,${encodeURIComponent(map)} */\n` });

    expect(ids(release())).toEqual(expect.arrayContaining(['RG-H004', 'RG-H005']));
  });

  it.each([
    ['localhost', '//# sourceMappingURL=http://localhost:3000/a.js.map'],
    ['a loopback address', '//# sourceMappingURL=http://127.0.0.1/a.js.map'],
    ['a 10.x address', '//# sourceMappingURL=https://10.1.2.3/a.js.map'],
    ['a 192.168.x address', '//# sourceMappingURL=http://192.168.0.5/a.js.map'],
    ['a 172.16-31 address', '//# sourceMappingURL=http://172.20.1.1/a.js.map'],
    ['a .local host', '//# sourceMappingURL=http://build.local/a.js.map'],
  ])('flags a sourceMappingURL on %s', (_label, line) => {
    makePackage({ 'dist/a.js': `${line}\n` });

    expect(ids(release())).toContain('RG-H006');
  });

  it('does not flag a public host', () => {
    makePackage({ 'dist/a.js': '//# sourceMappingURL=https://cdn.example.com/a.js.map\n' });

    expect(ids(release())).not.toContain('RG-H006');
  });
});

describe('a directory scan looks at the directory the way npm would not hide anything from it', () => {
  it('judges the SOFT rules by paths inside the directory', () => {
    makePackage({ 'pkg/src/a.ts': 'x\n', 'pkg/tests/a.test.ts': 'x\n', 'pkg/scripts/run.sh': 'x\n' });

    const run = release(['--dir', 'pkg']);

    expect(ids(run)).toEqual(expect.arrayContaining(['RG-S001', 'RG-S002', 'RG-S005']));
  });

  it('asks for a whitelist only when the directory is a package, and looks inside the directory for it', () => {
    makePackage({ 'plain/a.js': 'x\n', 'pkg/package.json': '{"name":"p","version":"1.0.0"}\n', 'pkg/a.js': 'x\n' });

    // The working directory has a "files" field; that must not vouch for the directory scanned.
    expect(ids(release(['--dir', 'plain']))).not.toContain('RG-S006');
    expect(ids(release(['--dir', 'pkg']))).toContain('RG-S006');
  });

  it('does not skip node_modules or .git, which a tarball of the directory would carry', () => {
    makePackage({
      'pkg/index.js': 'x\n',
      'pkg/node_modules/dep/i.js': `const k = "${FAKE.awsKey}";\n`,
      'pkg/.git/config': `[remote "origin"]\n\turl = https://user:Zq8kR2mN4pL7@github.com/org/repo.git\n`,
    });

    const run = release(['--dir', 'pkg']);

    expect(filesOf(run, 'RG-H003')).toEqual(expect.arrayContaining(['node_modules/dep/i.js', '.git/config']));
  });

  it('flags a symbolic link and a named pipe instead of treating them as empty files', () => {
    makePackage({ 'pkg/index.js': 'x\n', 'outside/leak.txt': `${FAKE.awsKey}\n` });
    symlinkSync(join(sb.work, 'outside'), join(sb.work, 'pkg', 'linked'));
    const fifo = spawnSync('mkfifo', [join(sb.work, 'pkg', 'pipe.js')]);

    const run = release(['--dir', 'pkg']);

    expect(filesOf(run, 'RG-S008')).toContain('linked');
    if (fifo.status === 0) expect(filesOf(run, 'RG-S008')).toContain('pipe.js');
    expect(run.code).toBe(1);
  });
});

describe('credential files by name', () => {
  it.each(['.netrc', '.git-credentials', '.htpasswd', 'release.keystore', 'android/app.jks', 'ssh/.netrc'])(
    'blocks %s',
    path => {
      makePackage({ 'index.js': 'x\n', [path]: 'machine example.com login a password b\n' });

      expect(filesOf(release(), 'RG-H002')).toContain(path);
    },
  );
});

describe('the policy classes that are turned off', () => {
  it('hides WARN findings when releaseRules.warn is false, and says so', () => {
    makePackage({ 'bundle.js': `const NEXT_PUBLIC_MAPS_API_KEY = "${FAKE.genericApiKeyValue}";\n` });
    sb.publish({ 'llll.policy.json': JSON.stringify({ releaseRules: { warn: false } }) });

    const run = release();

    expect(ids(run)).not.toContain('RG-H003');
    expect(run.notes.join(' ')).toMatch(/WARN/);
  });
});
