import type { Finding } from '../types.js';

interface PolicyPattern {
  id: string;
  /** Matched against the normalized line (see `normalize`), so it is written in lowercase words. */
  keywords: RegExp;
  title: string;
  description: string;
  action: string;
  mapsToDomain: string;
}

/**
 * Turns identifiers into plain lowercase words: `requireParentalConsent`, `PARENTAL_CONSENT`
 * and `parental-consent` all become "parental consent". Keywords can then be anchored to word
 * boundaries without missing camelCase or snake_case names, and without matching inside
 * unrelated words (`little` is not `ttl`, `isMinority` is not a minor).
 */
export function normalize(line: string): string {
  return line
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_\-./]+/g, ' ')
    .toLowerCase();
}

const SOFT_BLOCK_PATTERNS: PolicyPattern[] = [
  {
    id: 'PG-S001',
    keywords: /\b(?:multer|formidable|busboy|multipart|dropzone)\b|\bfile upload\b/,
    title: 'Upload Capability Added',
    description: 'File upload feature detected without policy review',
    action: 'Review content ownership terms and moderation requirements',
    mapsToDomain: 'G',
  },
  {
    id: 'PG-S002',
    keywords: /\b(?:stripe|pay ?pal|braintree|billing)\b|\bpayment intent\b|\bprice id\b|\bcheckout session\b|(?<!\bgit )\bcheckout\b/,
    title: 'Payment Feature Added',
    description: 'Payment/billing code detected without compliance review',
    action: 'Review pricing terms, refund policy, and PCI scope',
    mapsToDomain: 'F',
  },
  {
    id: 'PG-S003',
    keywords:
      /\b(?:coppa|age gate|parental consent|child safety|under 1[36])\b|\bminors?\b(?! (?:version|release|update|bump|change|issue|patch|axis|tick|fix))/,
    title: 'Minors-Related Feature',
    description: 'Age/minor-related code detected',
    action: 'Review COPPA, children privacy requirements, and age verification',
    mapsToDomain: 'M',
  },
  {
    id: 'PG-S004',
    keywords:
      /\b(?:open ?ai|anthropic|lang ?chain|llama ?index|ollama|llama)\b|\b(?:model inference|ai response|generate text|chat completions?)\b/,
    title: 'AI Feature Added',
    description: 'AI/ML model integration detected without transparency review',
    action: 'Add AI disclosure, review output handling and guardrails',
    mapsToDomain: 'I,J,K',
  },
  {
    id: 'PG-S005',
    keywords: /\b(?:mixpanel|amplitude|ga4|gtag|analytics track|tracking pixel)\b|\bsegment (?:io|com|analytics)\b/,
    title: 'User Tracking Added',
    description: 'Analytics/tracking code detected without privacy review',
    action: 'Review privacy notice, consent mechanism, and cookie policy',
    mapsToDomain: 'D',
  },
  {
    id: 'PG-S006',
    keywords: /\b(?:navigator geolocation|get current position|watch position|location permission)\b/,
    title: 'Location Access Added',
    description: 'Geolocation access detected without privacy review',
    action: 'Review location data handling and consent requirements',
    mapsToDomain: 'D',
  },
  {
    id: 'PG-S007',
    keywords: /\b(?:face ?api|fingerprint ?js|biometric\w*|facial recognition|face detect\w*)\b/,
    title: 'Biometric Feature Added',
    description: 'Biometric processing detected without policy review',
    action: 'Review biometric data regulations (BIPA, GDPR Art. 9)',
    mapsToDomain: 'M',
  },
  {
    id: 'PG-S008',
    keywords: /\b(?:credit score|risk assessment|eligibility (?:score|check)|profiling|scoring algorithm)\b/,
    title: 'Automated Decision Feature',
    description: 'Profiling/scoring algorithm detected without review',
    action: 'Review automated decision-making requirements and human review process',
    mapsToDomain: 'J',
  },
  {
    id: 'PG-S010',
    keywords: /\b(?:ttl|retention|delete after|purge|data lifecycle)\b/,
    title: 'Data Retention Change',
    description: 'Data lifecycle changes detected without privacy review',
    action: 'Review data retention policy and privacy notice',
    mapsToDomain: 'D',
  },
];

// WARN rules look at the raw line: they match code syntax, not identifiers.
const WARN_PATTERNS: { id: string; keywords: RegExp; title: string; description: string; action: string }[] = [
  {
    id: 'PG-W001',
    keywords: /\b(TODO|FIXME|HACK|XXX|TEMP)\b/,
    title: 'Unresolved Marker',
    description: 'Unresolved TODO/FIXME marker in outgoing code',
    action: 'Resolve or remove before pushing',
  },
  {
    id: 'PG-W002',
    keywords: /\bconsole\.(?:log|debug)\b|\bdebugger;|\bprint\(/,
    title: 'Debug Output',
    description: 'Debug output detected in outgoing code',
    action: 'Remove debug statements before pushing',
  },
];

export function scanForPolicyIssues(
  content: string,
  filePath: string,
): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');

  // Skip test files for WARN patterns
  const isTestFile = /\.(test|spec)\.[jt]sx?$|__tests__|\/tests?\//i.test(filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const words = normalize(line);

    for (const pattern of SOFT_BLOCK_PATTERNS) {
      if (pattern.keywords.test(words)) {
        // Avoid duplicate findings for the same pattern in the same file
        if (!findings.some(f => f.id === pattern.id && f.file === filePath)) {
          findings.push({
            id: pattern.id,
            severity: 'SOFT_BLOCK',
            title: pattern.title,
            file: filePath,
            line: i + 1,
            category: 'feature',
            description: pattern.description,
            action: pattern.action,
            mapsToDomain: pattern.mapsToDomain,
          });
        }
      }
    }

    if (!isTestFile) {
      for (const pattern of WARN_PATTERNS) {
        if (pattern.keywords.test(line)) {
          findings.push({
            id: pattern.id,
            severity: 'WARN',
            title: pattern.title,
            file: filePath,
            line: i + 1,
            category: 'hygiene',
            description: pattern.description,
            action: pattern.action,
          });
        }
      }
    }
  }

  return findings;
}

const MANIFEST = /(?:^|\/)(?:package\.json|requirements\.txt|Cargo\.toml|go\.mod)$/;

/** PG-W003: a dependency manifest changed, so new dependencies may need a license and security look. */
export function scanManifestPath(filePath: string): Finding | null {
  if (!MANIFEST.test(filePath)) return null;
  return {
    id: 'PG-W003',
    severity: 'WARN',
    title: 'Dependency Manifest Changed',
    file: filePath,
    category: 'dependency',
    description: 'A dependency manifest changed in the outgoing commits',
    action: 'Review new dependencies for license and security',
  };
}

export function scanForCopyleftDeps(
  content: string,
  filePath: string,
): Finding[] {
  const findings: Finding[] = [];

  if (!/package\.json$|requirements\.txt$|Cargo\.toml$|go\.mod$/i.test(filePath)) {
    return findings;
  }

  const copyleftIndicators = /GPL-2|GPL-3|AGPL|SSPL/i;
  if (copyleftIndicators.test(content)) {
    findings.push({
      id: 'PG-S009',
      severity: 'SOFT_BLOCK',
      title: 'Copyleft License Risk',
      file: filePath,
      category: 'license',
      description: 'Copyleft-licensed dependency detected',
      action: 'Review license compatibility with your project license',
      mapsToDomain: 'O',
    });
  }

  return findings;
}
