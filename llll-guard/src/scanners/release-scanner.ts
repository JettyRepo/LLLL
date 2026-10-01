import type { Finding } from '../types.js';
import { isDocumentPath } from './file-scan.js';
import { publicByDesignReason } from './public-by-design.js';
import { isEnvTemplatePath, scanFilePathForSecrets, scanForSecretHits } from './secret-scanner.js';

const RELEASE_HARD_BLOCK_PATTERNS: Array<{
  id: string;
  regex: RegExp;
  title: string;
  description: string;
  action: string;
  category: 'secret' | 'leakage';
}> = [
  {
    id: 'RG-H004',
    regex: /\.map$/i,
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

export interface ReleaseFileOptions {
  /** `internalFilePatterns` from the policy: files that must never be published (RG-H007). */
  internalFilePatterns?: string[];
}

/** Files that hold credentials by what they are called, apart from the key files the shared rules know. */
const CREDENTIAL_FILE = /(?:^|\/)(?:\.netrc|\.git-credentials|\.htpasswd)$|\.(?:keystore|jks)$/i;

export function scanReleaseFiles(fileList: string[], options: ReleaseFileOptions = {}): Finding[] {
  const findings: Finding[] = [];

  for (const file of fileList) {
    // Environment files and private keys use the same rules as the push gate (nested, `.env.*`,
    // any case, a public `.pub` key is fine); only the rule ids differ.
    const sensitive = scanFilePathForSecrets(file, { internalFilePatterns: options.internalFilePatterns });
    if (sensitive && sensitive.id === 'PG-H014') {
      findings.push({
        ...sensitive,
        id: 'RG-H007',
        title: 'Internal File in Release',
        description: 'A file the project marked as internal is included in the release package',
        action: 'Add it to .npmignore or exclude it from "files" in package.json',
      });
    } else if (sensitive) {
      const isEnv = sensitive.id === 'PG-H010';
      findings.push({
        ...sensitive,
        id: isEnv ? 'RG-H001' : 'RG-H002',
        title: isEnv ? 'Environment File in Release' : 'Private Key in Release',
        description: isEnv ? '.env file included in release package' : 'Private key file included in release package',
        action: isEnv
          ? 'Add .env to .npmignore or exclude from "files" in package.json'
          : 'Add to .npmignore, never include keys in published packages',
      });
    }

    if (!sensitive && CREDENTIAL_FILE.test(file)) {
      findings.push({
        id: 'RG-H002',
        severity: 'HARD_BLOCK',
        title: 'Credential File in Release',
        file,
        category: 'secret',
        description: 'A file that holds credentials is included in the release package',
        action: 'Add to .npmignore, never include credential files in published packages',
      });
    }

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

/** RG-S006: nothing says what belongs in the package, so everything in the directory is published. */
export function checkReleaseWhitelist(hasFilesField: boolean, hasNpmignore: boolean): Finding | null {
  if (hasFilesField || hasNpmignore) return null;
  return {
    id: 'RG-S006',
    severity: 'SOFT_BLOCK',
    title: 'No Release Whitelist Policy',
    category: 'policy',
    description: 'No .npmignore or "files" field found — everything is included by default',
    action: 'Add "files" field to package.json or create .npmignore',
  };
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
  if (/\.map$/i.test(filePath) && content.includes('"sourcesContent"')) {
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

/**
 * RG-H003: a credential inside a file that would be published.
 *
 * The same rules as the push gate, without the personal-data patterns (a bundle is full of
 * numbers) and without the policy keywords. A generic assignment that is a client-exposed key is
 * a warning, as it is on push; in documentation and env templates only provider-format keys count
 * and obvious placeholders pass.
 */
export function scanReleaseContent(content: string, filePath: string): Finding[] {
  const document = isDocumentPath(filePath);
  const hits = scanForSecretHits(content, filePath, {
    providerOnly: document,
    allowPlaceholders: document || isEnvTemplatePath(filePath),
  });

  const findings: Finding[] = [];
  for (const hit of hits) {
    if (hit.tier === 'pii') continue;

    const reason = publicByDesignReason(
      {
        tier: hit.tier,
        ruleId: hit.finding.id,
        value: hit.value,
        valueStart: hit.valueStart,
        lineText: hit.lineText,
        file: filePath,
      },
      { isPublishedValue: () => false },
    );

    findings.push({
      ...hit.finding,
      id: 'RG-H003',
      severity: reason ? 'WARN' : 'HARD_BLOCK',
      title: `${hit.finding.title} in Release (${hit.finding.id})${reason ? ', public by design' : ''}`,
      description: reason
        ? `${hit.finding.description}, in a file that would be published. Treated as deliberately public: ${reason}.`
        : `${hit.finding.description}, in a file that would be published`,
      action: reason
        ? 'Confirm that exposing this value is intended.'
        : 'Remove the secret from the artifact and rotate it',
    });
  }
  return findings;
}

/** RG-S008: the gate could not read this file, so what is in it is unknown. A finding, never a pass. */
export function unscannedFile(file: string, reason: string): Finding {
  return {
    id: 'RG-S008',
    severity: 'SOFT_BLOCK',
    title: 'File Not Scanned',
    file,
    category: 'policy',
    description: `The release gate did not read this file: ${reason}`,
    action: 'Look at it yourself, or raise LLLL_GUARD_MAX_FILE_BYTES if it is only large',
  };
}

// Only the comment that a source map reference really is (`//# sourceMappingURL=` or
// `/*# sourceMappingURL=`). Prose or a regex that merely mentions the words must not match, or
// this package could not pass its own gate.
const INLINE_SOURCE_MAP = /(?:\/\/|\/\*)[#@]\s*sourceMappingURL\s*=\s*data:[^,;\s]*(?:;[^,\s]*)*,([^\s"'*)]+)/i;

/**
 * An inline source map (`sourceMappingURL=data:application/json;base64,...`) is a source map that
 * does not end in `.map`, so the file-name rules never see it. It always lists the original source
 * files, and with `sourcesContent` it is the whole source.
 */
export function scanInlineSourceMap(content: string, filePath: string): Finding[] {
  const match = INLINE_SOURCE_MAP.exec(content);
  if (!match) return [];

  const findings: Finding[] = [
    {
      id: 'RG-H004',
      severity: 'HARD_BLOCK',
      title: 'Inline Source Map in Release',
      file: filePath,
      category: 'leakage',
      description: 'A source map is embedded in this file (sourceMappingURL=data:...)',
      action: 'Build without inline source maps',
    },
  ];

  let decoded = '';
  const isBase64 = /;base64,/i.test(match[0]);
  try {
    decoded = isBase64 ? Buffer.from(match[1], 'base64').toString('utf-8') : decodeURIComponent(match[1]);
  } catch {
    // Undecodable: it is still blocked above.
  }
  if (decoded.includes('"sourcesContent"')) {
    findings.push({
      id: 'RG-H005',
      severity: 'HARD_BLOCK',
      title: 'Source Code in Inline Source Map',
      file: filePath,
      category: 'leakage',
      description: 'The embedded source map contains sourcesContent: the full source code',
      action: 'Build without inline source maps',
    });
  }
  return findings;
}
