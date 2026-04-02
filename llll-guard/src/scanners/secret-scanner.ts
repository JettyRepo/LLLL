import type { Finding } from '../types.js';

interface SecretPattern {
  id: string;
  regex: RegExp;
  title: string;
  description: string;
  action: string;
}

const SECRET_PATTERNS: SecretPattern[] = [
  {
    id: 'PG-H001',
    regex: /AKIA[0-9A-Z]{16}/,
    title: 'AWS Access Key ID',
    description: 'AWS access key detected in outgoing code',
    action: 'Remove the key, use AWS_ACCESS_KEY_ID environment variable',
  },
  {
    id: 'PG-H002',
    regex: /sk-[a-zA-Z0-9\-_]{20,}/,
    title: 'OpenAI / Stripe Secret Key',
    description: 'API secret key detected in outgoing code',
    action: 'Remove the key, use environment variable',
  },
  {
    id: 'PG-H003',
    regex: /ghp_[a-zA-Z0-9]{36}/,
    title: 'GitHub Personal Access Token',
    description: 'GitHub PAT detected in outgoing code',
    action: 'Revoke the token immediately and use environment variable',
  },
  {
    id: 'PG-H004',
    regex: /gho_[a-zA-Z0-9]{36}/,
    title: 'GitHub OAuth Access Token',
    description: 'GitHub OAuth token detected in outgoing code',
    action: 'Revoke the token and use environment variable',
  },
  {
    id: 'PG-H005',
    regex: /-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/,
    title: 'Private Key Material',
    description: 'Private key detected in outgoing code',
    action: 'Remove the key from source control immediately',
  },
  {
    id: 'PG-H006',
    regex: /(api[_-]?key|api[_-]?secret|access[_-]?key)\s*[=:]\s*['"][A-Za-z0-9+/=]{16,}['"]/i,
    title: 'Hardcoded API Key',
    description: 'API key assignment detected in outgoing code',
    action: 'Move to environment variable, add to .env.example',
  },
  {
    id: 'PG-H007',
    regex: /(password|passwd|pwd)\s*[=:]\s*['"][^'"]{8,}['"]/i,
    title: 'Hardcoded Password',
    description: 'Password assignment detected in outgoing code',
    action: 'Move to environment variable or secrets manager',
  },
  {
    id: 'PG-H008',
    regex: /(database_url|db_password|db_pass|mongo_uri|redis_url)\s*[=:]\s*['"][^'"]+['"]/i,
    title: 'Database Credential',
    description: 'Database connection string or password detected',
    action: 'Move to environment variable',
  },
  {
    id: 'PG-H009',
    regex: /bearer\s+[A-Za-z0-9\-._~+/]+=*/i,
    title: 'Hardcoded Bearer Token',
    description: 'Bearer token detected in outgoing code',
    action: 'Move to environment variable or auth configuration',
  },
];

const PII_PATTERNS: SecretPattern[] = [
  {
    id: 'PG-H012',
    regex: /\d{3}-\d{2}-\d{4}/,
    title: 'Social Security Number Pattern',
    description: 'Possible SSN detected in outgoing code',
    action: 'Remove personal data from source code',
  },
  {
    id: 'PG-H013',
    regex: /\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}/,
    title: 'Credit Card Number Pattern',
    description: 'Possible credit card number detected in outgoing code',
    action: 'Remove payment data from source code immediately',
  },
];

export function scanForSecrets(
  content: string,
  filePath: string,
): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const pattern of [...SECRET_PATTERNS, ...PII_PATTERNS]) {
      const match = line.match(pattern.regex);
      if (match) {
        const redacted = match[0].length > 12
          ? match[0].substring(0, 8) + '...' + match[0].substring(match[0].length - 4)
          : '***REDACTED***';

        findings.push({
          id: pattern.id,
          severity: 'HARD_BLOCK',
          title: pattern.title,
          file: filePath,
          line: i + 1,
          match: redacted,
          category: pattern.id.startsWith('PG-H01') && parseInt(pattern.id.slice(-1)) >= 2 ? 'data' : 'secret',
          description: pattern.description,
          action: pattern.action,
        });
      }
    }
  }

  return findings;
}

export function scanFilePathForSecrets(filePath: string): Finding | null {
  const sensitiveFilePatterns = [
    { regex: /\.env$/, id: 'PG-H010', title: 'Environment File' },
    { regex: /\.pem$/, id: 'PG-H011', title: 'PEM Certificate/Key File' },
    { regex: /\.key$/, id: 'PG-H011', title: 'Key File' },
    { regex: /\.p12$/, id: 'PG-H011', title: 'PKCS12 File' },
    { regex: /\.pfx$/, id: 'PG-H011', title: 'PFX Certificate File' },
    { regex: /id_rsa/, id: 'PG-H011', title: 'SSH Private Key File' },
    { regex: /id_ed25519/, id: 'PG-H011', title: 'SSH Private Key File' },
  ];

  // Exclude template/example env files
  if (/\.env\.(example|template|sample)$/.test(filePath)) {
    return null;
  }

  for (const pattern of sensitiveFilePatterns) {
    if (pattern.regex.test(filePath)) {
      return {
        id: pattern.id,
        severity: 'HARD_BLOCK',
        title: pattern.title,
        file: filePath,
        category: 'secret',
        description: `Sensitive file detected in outgoing changes: ${filePath}`,
        action: 'Remove from version control, add to .gitignore',
      };
    }
  }

  return null;
}
