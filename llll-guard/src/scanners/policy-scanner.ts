import type { Finding } from '../types.js';

interface PolicyPattern {
  id: string;
  keywords: RegExp;
  title: string;
  description: string;
  action: string;
  mapsToDomain: string;
}

const SOFT_BLOCK_PATTERNS: PolicyPattern[] = [
  {
    id: 'PG-S001',
    keywords: /multer|formidable|busboy|multipart|file[_-]?upload|dropzone/i,
    title: 'Upload Capability Added',
    description: 'File upload feature detected without policy review',
    action: 'Review content ownership terms and moderation requirements',
    mapsToDomain: 'G',
  },
  {
    id: 'PG-S002',
    keywords: /stripe|paypal|braintree|checkout|billing|subscription|payment[_-]?intent|price[_-]?id/i,
    title: 'Payment Feature Added',
    description: 'Payment/billing code detected without compliance review',
    action: 'Review pricing terms, refund policy, and PCI scope',
    mapsToDomain: 'F',
  },
  {
    id: 'PG-S003',
    keywords: /coppa|age[_-]?gate|parental[_-]?consent|minor|child[_-]?safety|under[_-]?13|under[_-]?16/i,
    title: 'Minors-Related Feature',
    description: 'Age/minor-related code detected',
    action: 'Review COPPA, children privacy requirements, and age verification',
    mapsToDomain: 'M',
  },
  {
    id: 'PG-S004',
    keywords: /openai|anthropic|langchain|llama|model[_-]?inference|ai[_-]?response|generate[_-]?text|chat[_-]?completion/i,
    title: 'AI Feature Added',
    description: 'AI/ML model integration detected without transparency review',
    action: 'Add AI disclosure, review output handling and guardrails',
    mapsToDomain: 'I,J,K',
  },
  {
    id: 'PG-S005',
    keywords: /mixpanel|segment|amplitude|ga4|gtag|analytics[_-]?track|pixel|beacon/i,
    title: 'User Tracking Added',
    description: 'Analytics/tracking code detected without privacy review',
    action: 'Review privacy notice, consent mechanism, and cookie policy',
    mapsToDomain: 'D',
  },
  {
    id: 'PG-S006',
    keywords: /navigator\.geolocation|getCurrentPosition|watchPosition|location[_-]?permission/i,
    title: 'Location Access Added',
    description: 'Geolocation access detected without privacy review',
    action: 'Review location data handling and consent requirements',
    mapsToDomain: 'D',
  },
  {
    id: 'PG-S007',
    keywords: /faceapi|fingerprint[_-]?js|biometric|facial[_-]?recognition|face[_-]?detect/i,
    title: 'Biometric Feature Added',
    description: 'Biometric processing detected without policy review',
    action: 'Review biometric data regulations (BIPA, GDPR Art. 9)',
    mapsToDomain: 'M',
  },
  {
    id: 'PG-S008',
    keywords: /credit[_-]?score|risk[_-]?assessment|eligibility|profiling|scoring[_-]?algorithm/i,
    title: 'Automated Decision Feature',
    description: 'Profiling/scoring algorithm detected without review',
    action: 'Review automated decision-making requirements and human review process',
    mapsToDomain: 'J',
  },
  {
    id: 'PG-S010',
    keywords: /ttl|expiry|retention|purge|delete[_-]?after|data[_-]?lifecycle/i,
    title: 'Data Retention Change',
    description: 'Data lifecycle changes detected without privacy review',
    action: 'Review data retention policy and privacy notice',
    mapsToDomain: 'D',
  },
];

const WARN_PATTERNS: PolicyPattern[] = [
  {
    id: 'PG-W001',
    keywords: /\b(TODO|FIXME|HACK|XXX|TEMP)\b/,
    title: 'Unresolved Marker',
    description: 'Unresolved TODO/FIXME marker in outgoing code',
    action: 'Resolve or remove before pushing',
    mapsToDomain: '',
  },
  {
    id: 'PG-W002',
    keywords: /console\.log|console\.debug|debugger;|print\(/,
    title: 'Debug Output',
    description: 'Debug output detected in outgoing code',
    action: 'Remove debug statements before pushing',
    mapsToDomain: '',
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

    for (const pattern of SOFT_BLOCK_PATTERNS) {
      if (pattern.keywords.test(line)) {
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
