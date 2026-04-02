import type { Finding } from '../types.js';

export function scanForSourceMapReferences(
  content: string,
  filePath: string,
): Finding[] {
  const findings: Finding[] = [];

  // Check for sourceMappingURL pointing to internal locations
  const internalRefRegex = /sourceMappingURL\s*=\s*(s3:\/\/|gs:\/\/|file:\/\/|https?:\/\/internal|https?:\/\/[^/]*\.internal)/i;
  const match = content.match(internalRefRegex);
  if (match) {
    findings.push({
      id: 'RG-H006',
      severity: 'HARD_BLOCK',
      title: 'Internal Reference in Source Map',
      file: filePath,
      category: 'leakage',
      description: `Source map references internal infrastructure: ${match[1]}...`,
      action: 'Remove internal references from source maps',
    });
  }

  return findings;
}
