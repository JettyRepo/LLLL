import type { Finding } from '../types.js';
import type { WhitelistConfig } from '../types.js';
import { scanForSecrets } from './secret-scanner.js';

const RELEASE_HARD_BLOCK_PATTERNS: Array<{
  id: string;
  regex: RegExp;
  title: string;
  description: string;
  action: string;
  category: 'secret' | 'leakage';
}> = [
  {
    id: 'RG-H001',
    regex: /^\.env$/,
    title: 'Environment File in Release',
    description: '.env file included in release package',
    action: 'Add .env to .npmignore or exclude from "files" in package.json',
    category: 'secret',
  },
  {
    id: 'RG-H002',
    regex: /\.(pem|key|p12|pfx)$|id_rsa|id_ed25519/,
    title: 'Private Key in Release',
    description: 'Private key file included in release package',
    action: 'Add to .npmignore, never include keys in published packages',
    category: 'secret',
  },
  {
    id: 'RG-H004',
    regex: /\.map$/,
    title: 'Source Map in Release',
    description: 'Source map file exposes original source code',
    action: 'Add *.map to .npmignore or remove from build output',
    category: 'leakage',
  },
];

const RELEASE_SOFT_BLOCK_PATTERNS: Array<{
  id: string;
  regex: RegExp;
  title: string;
  description: string;
  action: string;
}> = [
  {
    id: 'RG-S001',
    regex: /^src\//,
    title: 'Source Directory in Release',
    description: 'src/ directory included in release — source code exposure',
    action: 'Add src/ to .npmignore, only publish dist/ or lib/',
  },
  {
    id: 'RG-S002',
    regex: /^(tests?|__tests__|spec)\//,
    title: 'Test Files in Release',
    description: 'Test directory included in release package',
    action: 'Add test directories to .npmignore',
  },
  {
    id: 'RG-S003',
    regex: /^(internal|private)\//,
    title: 'Internal Assets in Release',
    description: 'Internal/private directory included in release',
    action: 'Add internal directories to .npmignore',
  },
  {
    id: 'RG-S004',
    regex: /^prompts\/|\.prompt$|SKILL\.md$|system-prompt/,
    title: 'Prompt Files in Release',
    description: 'Prompt or skill definition files in release package',
    action: 'Add prompt files to .npmignore',
  },
  {
    id: 'RG-S005',
    regex: /^(tools|scripts)\/|Makefile$|Taskfile/,
    title: 'Dev Tools in Release',
    description: 'Development tooling included in release package',
    action: 'Add development directories to .npmignore',
  },
];

export function scanReleaseFiles(fileList: string[]): Finding[] {
  const findings: Finding[] = [];

  for (const file of fileList) {
    for (const pattern of RELEASE_HARD_BLOCK_PATTERNS) {
      if (pattern.regex.test(file)) {
        findings.push({
          id: pattern.id,
          severity: 'HARD_BLOCK',
          title: pattern.title,
          file,
          category: pattern.category,
          description: pattern.description,
          action: pattern.action,
        });
      }
    }

    for (const pattern of RELEASE_SOFT_BLOCK_PATTERNS) {
      if (pattern.regex.test(file)) {
        if (!findings.some(f => f.id === pattern.id)) {
          findings.push({
            id: pattern.id,
            severity: 'SOFT_BLOCK',
            title: pattern.title,
            file,
            category: 'leakage',
            description: pattern.description,
            action: pattern.action,
          });
        }
      }
    }
  }

  return findings;
}

export function checkWhitelist(
  fileList: string[],
  whitelist: WhitelistConfig,
): Finding | null {
  if (whitelist.allowedPatterns.length === 0) {
    return {
      id: 'RG-S006',
      severity: 'SOFT_BLOCK',
      title: 'No Release Whitelist Policy',
      category: 'policy',
      description: 'No .npmignore or "files" field found — everything is included by default',
      action: 'Add "files" field to package.json or create .npmignore',
    };
  }
  return null;
}

export function checkReleaseSize(
  totalBytes: number,
  maxBytes: number = 10 * 1024 * 1024,
): Finding | null {
  if (totalBytes > maxBytes) {
    const sizeMB = (totalBytes / (1024 * 1024)).toFixed(1);
    return {
      id: 'RG-S007',
      severity: 'SOFT_BLOCK',
      title: 'Unusually Large Package',
      category: 'policy',
      description: `Release artifact is ${sizeMB}MB — may include unintended files`,
      action: 'Review included files, add exclusions to .npmignore',
    };
  }
  return null;
}

export function scanSourceMapContent(content: string, filePath: string): Finding | null {
  if (/\.map$/.test(filePath) && content.includes('"sourcesContent"')) {
    return {
      id: 'RG-H005',
      severity: 'HARD_BLOCK',
      title: 'Source Code in Source Map',
      file: filePath,
      category: 'leakage',
      description: 'Source map contains sourcesContent — full source code embedded',
      action: 'Rebuild without sourcesContent or remove source maps from release',
    };
  }
  return null;
}
