import type { Finding } from '../types.js';

export function scanForSourceMapReferences(
  content: string,
  filePath: string,
): Finding[] {
  const findings: Finding[] = [];

  // Check for sourceMappingURL pointing to internal locations
  // Cloud buckets, local files, and hosts that only exist inside a network: localhost, private
  // IPv4 ranges, and the usual internal suffixes.
  const internalRefRegex =
    /(?:\/\/|\/\*)[#@]\s*sourceMappingURL\s*=\s*(s3:\/\/|gs:\/\/|file:\/\/|https?:\/\/(?:internal|localhost|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|0\.0\.0\.0|\[::1\])|https?:\/\/[^/\s]*\.(?:internal|local|corp|lan|intranet)(?:[:/]|$))/i;
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
