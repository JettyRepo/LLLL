import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FAKE } from '../helpers/fixtures.js';
import { Sandbox, ZERO_SHA, parseJsonResult, prePushLine } from '../helpers/repo.js';

// Ways `git log -p` can hand the scanner nothing, or a different shape than expected.
// Each one would let a secret through as a pass, so each must be blocked.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

const leakLine = `const key = "${FAKE.awsKey}";`;

describe('content the diff would hide', () => {
  it('scans text after a lone carriage return (classic Mac line endings)', () => {
    // git sees one line; a reader that also splits on \r would hide everything after it.
    sb.commit({ 'src/mac.js': `x = 1\r${leakLine}\n` });

    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(1);
    expect(parseJsonResult(res.stdout)?.findings.some(f => f.id === 'PG-H001')).toBe(true);
  });

  it('scans a file that .gitattributes marks as -diff', () => {
    sb.commit({
      '.gitattributes': 'src/hidden.js -diff\n',
      'src/hidden.js': `${leakLine}\n`,
    });

    const res = sb.run(['push', '--json']);

    // git would otherwise print "Binary files differ" and no added lines.
    expect(res.code).toBe(1);
  });

  it('scans a file that .gitattributes marks as binary', () => {
    sb.commit({
      '.gitattributes': '*.json binary\n',
      'config.json': `{"key": "${FAKE.awsKey}"}\n`,
    });

    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(1);
  });

  it('scans a file that git detects as binary because it contains a NUL byte', () => {
    sb.commit({ 'src/blob.js': `\u0000${leakLine}\n` });

    const res = sb.run(['push', '--json']);

    expect(res.code).toBe(1);
  });
});

describe('git configuration that would change what the diff shows', () => {
  it('scans the root commit even when log.showRoot is false', () => {
    const solo = join(sb.root, 'solo');
    mkdirSync(solo);
    sb.git(['init', '-b', 'main'], solo);
    sb.git(['config', 'log.showRoot', 'false'], solo);
    const sha = sb.commit({ 'src/config.js': `${leakLine}\n` }, 'root commit', solo);

    const res = sb.runPrePushHook([prePushLine('refs/heads/main', sha, 'refs/heads/main', ZERO_SHA)], {
      cwd: solo,
      remoteName: 'origin',
      remoteUrl: join(sb.root, 'empty.git'),
    });

    expect(res.code).toBe(1);
  });

  it('scans changes outside the current directory when diff.relative is true', () => {
    sb.git(['config', 'diff.relative', 'true']);
    mkdirSync(join(sb.work, 'docs'));
    sb.commit({ 'docs/readme.js': 'const a = 1;\n' }, 'docs');
    sb.git(['push', 'origin', 'main']);
    sb.commit({ 'src/config.js': `${leakLine}\n` }, 'add config');

    const res = sb.run(['push', '--json'], { cwd: join(sb.work, 'docs') });

    expect(res.code).toBe(1);
  });
});
