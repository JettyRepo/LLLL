import { describe, expect, it } from 'vitest';
import { scanInlineSourceMap } from '../src/scanners/release-scanner.js';
import { scanForSourceMapReferences } from '../src/scanners/source-map-scanner.js';

const withContent = Buffer.from(JSON.stringify({ version: 3, sourcesContent: ['x'] })).toString('base64');
const withoutContent = Buffer.from(JSON.stringify({ version: 3, sources: ['a.ts'] })).toString('base64');

describe('scanInlineSourceMap', () => {
  it('reports an inline map in a script comment, and the source when it carries it', () => {
    const findings = scanInlineSourceMap(`x();\n//# sourceMappingURL=data:application/json;base64,${withContent}\n`, 'a.js');

    expect(findings.map(f => f.id)).toEqual(['RG-H004', 'RG-H005']);
  });

  it('reports an inline map in a stylesheet comment', () => {
    const findings = scanInlineSourceMap(`a{}\n/*# sourceMappingURL=data:application/json;base64,${withoutContent} */\n`, 'a.css');

    expect(findings.map(f => f.id)).toEqual(['RG-H004']);
  });

  it('accepts the older `//@` marker', () => {
    expect(scanInlineSourceMap(`//@ sourceMappingURL=data:application/json;base64,${withoutContent}`, 'a.js')).toHaveLength(1);
  });

  it.each([
    ['prose that mentions it', 'An inline map is `sourceMappingURL=data:application/json;base64,AAAA` in a comment.'],
    ['a regex that matches it', 'const re = /sourceMappingURL\\s*=\\s*data:[^,]*,(.+)/;'],
    ['an ordinary reference', '//# sourceMappingURL=a.js.map'],
    ['a data URI that is not a source map comment', 'const u = "sourceMappingURL=data:text/plain,hello";'],
  ])('does not match %s', (_label, content) => {
    expect(scanInlineSourceMap(content, 'a.js')).toEqual([]);
  });
});

describe('scanForSourceMapReferences', () => {
  it('flags an internal reference that is a real source map comment', () => {
    expect(scanForSourceMapReferences('//# sourceMappingURL=s3://bucket/a.js.map', 'a.js')).toHaveLength(1);
    expect(scanForSourceMapReferences('/*# sourceMappingURL=http://localhost:3000/a.css.map */', 'a.css')).toHaveLength(1);
  });

  it('does not flag prose or a pattern that only mentions the words', () => {
    expect(scanForSourceMapReferences('Do not publish sourceMappingURL=s3://bucket/a.map', 'README.md')).toEqual([]);
    expect(scanForSourceMapReferences('const re = /sourceMappingURL\\s*=\\s*(s3:\\/\\/)/;', 'a.js')).toEqual([]);
  });

  it.each(['http://example.com/a.map', 'https://cdn.example.com/a.map', 'a.js.map', '../maps/a.map'])(
    'does not flag %s',
    url => {
      expect(scanForSourceMapReferences(`//# sourceMappingURL=${url}`, 'a.js')).toEqual([]);
    },
  );
});
