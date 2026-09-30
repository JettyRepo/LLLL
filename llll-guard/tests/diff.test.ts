import { describe, expect, it } from 'vitest';
import { parseLog, unquoteGitPath, UNKNOWN_PATH, type LogEvent } from '../src/diff.js';

async function* linesOf(text: string): AsyncGenerator<string> {
  for (const line of text.split('\n')) yield line;
}

async function parse(text: string): Promise<LogEvent[]> {
  const events: LogEvent[] = [];
  for await (const event of parseLog(linesOf(text))) events.push(event);
  return events;
}

const C1 = 'a'.repeat(40);
const C2 = 'b'.repeat(40);
const commit = (sha: string): string => `\u0000COMMIT ${sha}`;

function files(events: LogEvent[]): Extract<LogEvent, { kind: 'file' }>[] {
  return events.filter((e): e is Extract<LogEvent, { kind: 'file' }> => e.kind === 'file');
}

describe('parseLog', () => {
  it('yields the added lines with their real line numbers', async () => {
    const events = await parse([
      commit(C1),
      '',
      'diff --git a/src/app.js b/src/app.js',
      'index 111..222 100644',
      '--- a/src/app.js',
      '+++ b/src/app.js',
      '@@ -4,0 +5,2 @@',
      '+first',
      '+second',
      '@@ -20 +22 @@',
      '-old',
      '+replacement',
    ].join('\n'));

    const [file] = files(events);
    expect(file.path).toBe('src/app.js');
    expect(file.commit).toBe(C1);
    expect(file.added).toEqual([
      { text: 'first', line: 5 },
      { text: 'second', line: 6 },
      { text: 'replacement', line: 22 },
    ]);
  });

  it('keeps added lines whose content starts with "++" or "+++"', async () => {
    const events = await parse([
      commit(C1),
      'diff --git a/a.js b/a.js',
      '--- a/a.js',
      '+++ b/a.js',
      '@@ -0,0 +1,2 @@',
      '+++counter',
      '++++ header-like',
    ].join('\n'));

    expect(files(events)[0].added.map(l => l.text)).toEqual(['++counter', '+++ header-like']);
  });

  it('takes the path from the +++ line and strips the tab git adds after names with spaces', async () => {
    const events = await parse([
      commit(C1),
      'diff --git a/my dir/a b.js b/my dir/a b.js',
      '--- a/my dir/a b.js\t',
      '+++ b/my dir/a b.js\t',
      '@@ -0,0 +1 @@',
      '+x',
    ].join('\n'));

    expect(files(events)[0].path).toBe('my dir/a b.js');
  });

  it('does not confuse a directory ending in "b" with the b/ prefix', async () => {
    const events = await parse([
      commit(C1),
      'diff --git a/lib/c.js b/lib/c.js',
      '--- a/lib/c.js',
      '+++ b/lib/c.js',
      '@@ -0,0 +1 @@',
      '+x',
    ].join('\n'));

    expect(files(events)[0].path).toBe('lib/c.js');
  });

  it('decodes a quoted path with octal escapes', async () => {
    const events = await parse([
      commit(C1),
      'diff --git "a/caf\\303\\251.js" "b/caf\\303\\251.js"',
      '--- "a/caf\\303\\251.js"',
      '+++ "b/caf\\303\\251.js"',
      '@@ -0,0 +1 @@',
      '+x',
    ].join('\n'));

    expect(files(events)[0].path).toBe('café.js');
  });

  it('skips a deleted file', async () => {
    const events = await parse([
      commit(C1),
      'diff --git a/.env b/.env',
      'deleted file mode 100644',
      'index 111..000',
      '--- a/.env',
      '+++ /dev/null',
      '@@ -1 +0,0 @@',
      '-SECRET=1',
    ].join('\n'));

    expect(files(events)).toHaveLength(0);
  });

  it('uses "rename to" for a rename without content changes', async () => {
    const events = await parse([
      commit(C1),
      'diff --git a/old.pem b/new.pem',
      'similarity index 100%',
      'rename from old.pem',
      'rename to new.pem',
    ].join('\n'));

    const [file] = files(events);
    expect(file.path).toBe('new.pem');
    expect(file.added).toEqual([]);
  });

  it('reports an empty new file, which has no +++ line, by the path in the header', async () => {
    const events = await parse([
      commit(C1),
      'diff --git a/.env b/.env',
      'new file mode 100644',
      'index 000..e69de29',
    ].join('\n'));

    expect(files(events)[0].path).toBe('.env');
  });

  it('reports a binary file by the path in the header', async () => {
    const events = await parse([
      commit(C1),
      'diff --git a/logo.png b/logo.png',
      'new file mode 100644',
      'index 000..abc',
      'Binary files /dev/null and b/logo.png differ',
    ].join('\n'));

    const [file] = files(events);
    expect(file.path).toBe('logo.png');
    expect(file.added).toEqual([]);
  });

  it('falls back to a placeholder instead of dropping a file whose header cannot be parsed', async () => {
    const events = await parse([
      commit(C1),
      'diff --git something odd',
      '@@ -0,0 +1 @@',
      '+content',
    ].join('\n'));

    const [file] = files(events);
    expect(file.path).toBe(UNKNOWN_PATH);
    expect(file.added).toHaveLength(1);
  });

  it('ignores the "No newline at end of file" marker', async () => {
    const events = await parse([
      commit(C1),
      'diff --git a/a.js b/a.js',
      '--- a/a.js',
      '+++ b/a.js',
      '@@ -0,0 +1 @@',
      '+last',
      '\\ No newline at end of file',
    ].join('\n'));

    expect(files(events)[0].added).toEqual([{ text: 'last', line: 1 }]);
  });

  it('keeps commits apart and emits a commit event for each', async () => {
    const events = await parse([
      commit(C1),
      'diff --git a/a.js b/a.js',
      '--- a/a.js',
      '+++ b/a.js',
      '@@ -0,0 +1 @@',
      '+one',
      commit(C2),
      'diff --git a/b.js b/b.js',
      '--- a/b.js',
      '+++ b/b.js',
      '@@ -0,0 +1 @@',
      '+two',
    ].join('\n'));

    expect(events.filter(e => e.kind === 'commit')).toHaveLength(2);
    expect(files(events).map(f => [f.commit, f.path])).toEqual([
      [C1, 'a.js'],
      [C2, 'b.js'],
    ]);
  });

  it('yields a commit event even when the commit changes no files', async () => {
    const events = await parse(commit(C1));

    expect(events).toEqual([{ kind: 'commit', commit: C1 }]);
  });

  describe('input it cannot understand', () => {
    it('fails on a hunk header it cannot read, instead of dropping the lines that follow', async () => {
      await expect(
        parse([commit(C1), 'diff --git a/a.js b/a.js', '+++ b/a.js', '@@ something unexpected @@', '+secret'].join('\n')),
      ).rejects.toThrow(/hunk header/);
    });

    it('fails on a line inside a hunk that carries no diff prefix', async () => {
      await expect(
        parse([commit(C1), 'diff --git a/a.js b/a.js', '+++ b/a.js', '@@ -0,0 +1 @@', 'aws = "AKIA"'].join('\n')),
      ).rejects.toThrow(/inside a diff hunk/);
    });

    it('does not mistake a lone carriage return inside an added line for a line break', async () => {
      // The reader splits on "\n" only, so this stays one added line.
      const events = await parse([
        commit(C1),
        'diff --git a/a.js b/a.js',
        '+++ b/a.js',
        '@@ -0,0 +1 @@',
        '+x = 1\raws = "AKIA"',
      ].join('\n'));

      expect(files(events)[0].added).toEqual([{ text: 'x = 1\raws = "AKIA"', line: 1 }]);
    });
  });

  describe('combined diff of a merge commit', () => {
    it('counts only lines added relative to every parent', async () => {
      const events = await parse([
        commit(C1),
        'diff --cc f.js',
        'index 26f343c,5055f02..759a784',
        '--- a/f.js',
        '+++ b/f.js',
        '@@@ -1,1 -1,1 +1,2 @@@',
        '- from main',
        ' -from side',
        '++resolved',
        ' +only from the second parent',
      ].join('\n'));

      const [file] = files(events);
      expect(file.path).toBe('f.js');
      expect(file.added).toEqual([{ text: 'resolved', line: 1 }]);
    });
  });
});

describe('unquoteGitPath', () => {
  it('returns unquoted input unchanged', () => {
    expect(unquoteGitPath('src/a.js')).toBe('src/a.js');
  });

  it('decodes escapes', () => {
    expect(unquoteGitPath('"a\\tb\\"c\\\\d\\ne"')).toBe('a\tb"c\\d\ne');
  });

  it('decodes multi-byte UTF-8 from octal escapes', () => {
    expect(unquoteGitPath('"\\346\\227\\245\\346\\234\\254.js"')).toBe('日本.js');
  });
});
