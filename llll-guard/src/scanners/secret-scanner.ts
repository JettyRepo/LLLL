import { minimatch } from 'minimatch';
import type { Finding } from '../types.js';

/**
 * How much a match can be trusted:
 * - provider: a credential in a provider's own format (AWS key, GitHub token, PEM header, a
 *   connection string with a real password). High precision. Never downgraded, never reported
 *   as "public by design".
 * - generic: an assignment that looks like a credential (`api_key = "..."`, `password = "..."`).
 *   Can be a deliberately public value, see public-by-design.ts.
 * - pii: personal data (SSN, card number). Never echoed back, not even redacted.
 */
export type SecretTier = 'provider' | 'generic' | 'pii';

interface Rule {
  id: string;
  title: string;
  description: string;
  action: string;
  regex: RegExp;
  tier: SecretTier;
  /** Capture group that holds the secret value. Defaults to the whole match. */
  valueGroup?: number;
  /** Rejects a match that has the right shape but is clearly not a credential. */
  accept?: (value: string) => boolean;
}

export interface SecretHit {
  finding: Finding;
  /** The raw value. Never printed; used for the public-by-design check. */
  value: string;
  /** Offset of the value within `lineText`. */
  valueStart: number;
  lineText: string;
  tier: SecretTier;
}

export interface ScanOptions {
  /** Only run the provider-format rules. */
  providerOnly?: boolean;
  /** Ignore provider matches that are obviously placeholders (documentation, env templates). */
  allowPlaceholders?: boolean;
}

/** Values published in the providers' own documentation. They are examples, not credentials. */
const KNOWN_EXAMPLE_VALUES = new Set([
  'AKIAIOSFODNN7EXAMPLE',
  'ASIAIOSFODNN7EXAMPLE',
]);

/** Card numbers that payment providers publish for testing. They move no money. */
const KNOWN_TEST_CARDS = new Set([
  '4111111111111111',
  '4242424242424242',
  '4012888888881881',
  '4000056655665556',
  '5555555555554444',
  '5105105105105100',
  '5200828282828210',
  '2223003122003222',
  '378282246310005',
  '371449635398431',
  '6011111111111117',
  '6011000990139424',
  '3530111333300000',
  '30569309025904',
  '38520000023237',
]);

// Provider tokens are anchored on the left with a look-behind rather than `\b`: `_` and digits
// are word characters, so `\b` would hide `TOKEN_ghp_…`. There is no anchor on the right for
// fixed-length tokens: `ghp_<36>_old` and `ghp_<36>1` still contain a full token.
const RULES: Rule[] = [
  {
    id: 'PG-H001',
    regex: /(?<![A-Z0-9])(?:AKIA|ASIA)[0-9A-Z]{16}/,
    tier: 'provider',
    title: 'AWS Access Key ID',
    description: 'AWS access key detected in outgoing code',
    action: 'Remove the key, use AWS_ACCESS_KEY_ID environment variable',
  },
  // PG-H002: API secret keys (OpenAI, Anthropic, Stripe live, Slack, Google)
  {
    id: 'PG-H002',
    regex: /(?<![A-Za-z0-9])sk-[A-Za-z0-9_-]{20,}/,
    tier: 'provider',
    title: 'OpenAI / Stripe Secret Key',
    description: 'API secret key detected in outgoing code',
    action: 'Remove the key, use environment variable',
  },
  {
    id: 'PG-H002',
    regex: /(?<![A-Za-z0-9])(?:sk|rk)_live_[A-Za-z0-9]{16,}/,
    tier: 'provider',
    title: 'OpenAI / Stripe Secret Key',
    description: 'API secret key detected in outgoing code',
    action: 'Remove the key, use environment variable',
  },
  {
    id: 'PG-H002',
    regex: /(?<![A-Za-z0-9])xox[abprs]-[A-Za-z0-9-]{10,}/,
    tier: 'provider',
    title: 'OpenAI / Stripe Secret Key',
    description: 'Slack token detected in outgoing code',
    action: 'Revoke the token, use environment variable',
  },
  {
    id: 'PG-H002',
    // The last character may be "-" or "_", so no right-hand anchor.
    regex: /(?<![A-Za-z0-9_-])AIza[0-9A-Za-z_-]{35}/,
    tier: 'provider',
    title: 'OpenAI / Stripe Secret Key',
    description: 'Google API key detected in outgoing code',
    action: 'Restrict or rotate the key, use environment variable',
  },
  // PG-H003: GitHub personal access tokens
  {
    id: 'PG-H003',
    regex: /(?<![A-Za-z0-9])ghp_[A-Za-z0-9]{36}/,
    tier: 'provider',
    title: 'GitHub Personal Access Token',
    description: 'GitHub PAT detected in outgoing code',
    action: 'Revoke the token immediately and use environment variable',
  },
  {
    id: 'PG-H003',
    regex: /(?<![A-Za-z0-9])github_pat_[A-Za-z0-9_]{22,}/,
    tier: 'provider',
    title: 'GitHub Personal Access Token',
    description: 'GitHub fine-grained PAT detected in outgoing code',
    action: 'Revoke the token immediately and use environment variable',
  },
  {
    id: 'PG-H004',
    regex: /(?<![A-Za-z0-9])gho_[A-Za-z0-9]{36}/,
    tier: 'provider',
    title: 'GitHub OAuth Access Token',
    description: 'GitHub OAuth token detected in outgoing code',
    action: 'Revoke the token and use environment variable',
  },
  {
    id: 'PG-H005',
    regex: /-----BEGIN (?:RSA |DSA |EC |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY(?: BLOCK)?-----/,
    tier: 'provider',
    title: 'Private Key Material',
    description: 'Private key detected in outgoing code',
    action: 'Remove the key from source control immediately',
  },
  {
    id: 'PG-H006',
    regex: /(?:api[_-]?key|api[_-]?secret|access[_-]?key)\s*[=:]\s*['"]([A-Za-z0-9+/=]{16,})['"]/i,
    tier: 'generic',
    valueGroup: 1,
    title: 'Hardcoded API Key',
    description: 'API key assignment detected in outgoing code',
    action: 'Move to environment variable, add to .env.example',
  },
  {
    id: 'PG-H007',
    regex: /(?:password|passwd|pwd)\s*[=:]\s*['"]([^'"]{8,})['"]/i,
    tier: 'generic',
    valueGroup: 1,
    title: 'Hardcoded Password',
    description: 'Password assignment detected in outgoing code',
    action: 'Move to environment variable or secrets manager',
  },
  {
    id: 'PG-H008',
    regex: /(?:database_url|db_password|db_pass|mongo_uri|redis_url)\s*[=:]\s*['"]([^'"]+)['"]/i,
    tier: 'generic',
    valueGroup: 1,
    title: 'Database Credential',
    description: 'Database connection string or password detected',
    action: 'Move to environment variable',
  },
  {
    // A password inside a URL (`scheme://user:password@host`) is a credential wherever it is
    // written, including documentation, so it counts as a provider-format match.
    id: 'PG-H008',
    regex: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@'"<>]+:([^\s@/'"<>]{3,})@/i,
    tier: 'provider',
    valueGroup: 1,
    accept: password => !isDummyPassword(password),
    title: 'Database Credential',
    description: 'Connection string with an embedded password detected',
    action: 'Move the credentials to an environment variable and rotate the password',
  },
  {
    id: 'PG-H009',
    regex: /\bbearer\s+([A-Za-z0-9\-._~+/]{20,}=*)/i,
    tier: 'generic',
    valueGroup: 1,
    // A real token has digits; "Bearer authentication header" in a comment does not.
    accept: value => /\d/.test(value),
    title: 'Hardcoded Bearer Token',
    description: 'Bearer token detected in outgoing code',
    action: 'Move to environment variable or auth configuration',
  },
  {
    id: 'PG-H012',
    regex: /\b\d{3}-\d{2}-\d{4}\b/,
    tier: 'pii',
    accept: looksLikeSsn,
    title: 'Social Security Number Pattern',
    description: 'Possible SSN detected in outgoing code',
    action: 'Remove personal data from source code',
  },
  {
    id: 'PG-H013',
    // A run of digits with optional separators. A card number can be followed by a CVV or an
    // expiry date, so the run is searched for a card number rather than judged as a whole.
    regex: /\b\d(?:[ -]?\d){12,}\b/,
    tier: 'pii',
    accept: containsCardNumber,
    title: 'Credit Card Number Pattern',
    description: 'Possible credit card number detected in outgoing code',
    action: 'Remove payment data from source code immediately',
  },
];

function looksLikeSsn(value: string): boolean {
  const [area, group, serial] = value.split('-');
  return area !== '000' && area !== '666' && !area.startsWith('9') && group !== '00' && serial !== '0000';
}

export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

function looksLikeCardNumber(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19 || !luhnValid(digits)) return false;
  if (KNOWN_TEST_CARDS.has(digits)) return false;
  // Major issuers only: a Luhn-valid timestamp or id would otherwise pass one time in ten.
  return /^(?:4|5[1-5]|2[2-7]|3[47]|35|6011|65|62|30[0-5]|36|38)/.test(digits);
}

/** Groups searched in one run of digits; keeps the search bounded on a very long line. */
const MAX_CARD_GROUPS = 40;

/**
 * Looks for a card number inside a run of digits like `4111 1111 1111 1111 123 12/25`, where a
 * CVV or an expiry date follows the number. Candidates start and end on the boundaries between
 * space- or hyphen-separated groups, so an unseparated number is judged as a whole: cutting
 * arbitrary 13 to 19 digit pieces out of it would make unrelated digits pass the Luhn check.
 */
function containsCardNumber(run: string): boolean {
  const groups = run.split(/[ -]/).filter(Boolean).slice(0, MAX_CARD_GROUPS);
  for (let start = 0; start < groups.length; start++) {
    let digits = '';
    for (let end = start; end < groups.length; end++) {
      digits += groups[end];
      if (digits.length > 19) break;
      if (digits.length < 13) continue;
      // A published test number followed by more digits is still a test number.
      if (KNOWN_TEST_CARDS.has(digits)) break;
      if (looksLikeCardNumber(digits)) return true;
    }
  }
  return false;
}

// A value is a placeholder when every word in it comes from this vocabulary, so
// `your-api-key-here` and `changemechangeme1234` are, and `sk-<real key>_example` is not.
const PLACEHOLDER_WORDS = [
  'your', 'api', 'key', 'secret', 'token', 'here', 'example', 'placeholder', 'changeme', 'change',
  'replace', 'me', 'dummy', 'redacted', 'test', 'sample', 'todo', 'fake', 'demo', 'password',
  'passwd', 'pass', 'sk', 'rk', 'pk', 'live', 'proj', 'ant', 'akia', 'asia', 'ghp', 'gho', 'abc',
];
const PLACEHOLDER_TOKEN = new RegExp(`^(?:${PLACEHOLDER_WORDS.join('|')}|x|\\d)+$`, 'i');
/** Longer tokens are never treated as placeholders, which also bounds the regex above. */
const MAX_PLACEHOLDER_TOKEN = 64;

/** Obviously not a credential: empty, a template variable, masked, built from placeholder words, or repeated characters. */
export function isPlaceholderValue(value: string): boolean {
  const v = value.trim();
  if (v === '') return true;
  if (/^[<[{$].*[>\]}]$/.test(v)) return true;
  if (/\*{3,}|\.{3,}/.test(v)) return true;
  const tokens = v.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (tokens.length > 0 && tokens.every(t => t.length <= MAX_PLACEHOLDER_TOKEN && PLACEHOLDER_TOKEN.test(t))) {
    return true;
  }
  return v.length >= 8 && new Set(v).size <= 3;
}

/** A password in a URL that is a development default or a placeholder, not a real credential. */
function isDummyPassword(password: string): boolean {
  return isPlaceholderValue(password) || /^(?:pass(?:word|wd)?|pwd|secret|admin|root|test|user|guest|postgres|mysql|redis|0*12345*6*)$/i.test(password);
}

/**
 * `abcd...wxyz` for long values, `****` for short ones. A generic value (a password) can be
 * short, so it is revealed less than a provider key whose first four characters are its prefix.
 */
export function redactValue(value: string, tier: SecretTier = 'provider'): string {
  if (tier === 'generic') {
    if (value.length >= 32) return `${value.slice(0, 4)}...${value.slice(-4)}`;
    if (value.length >= 16) return `${value.slice(0, 2)}...${value.slice(-2)}`;
    return '****';
  }
  return value.length >= 16 ? `${value.slice(0, 4)}...${value.slice(-4)}` : '****';
}

function redactForRule(rule: Rule, value: string): string | undefined {
  // Personal data is never echoed. A private key header is not the secret, but it needs no partial echo either.
  if (rule.tier === 'pii') return undefined;
  if (rule.id === 'PG-H005') return '[private key]';
  return redactValue(value, rule.tier);
}

const GLOBAL_RULES = RULES.map(rule => ({
  rule,
  // `d` gives the start offset of each capture group.
  regex: new RegExp(rule.regex.source, `${rule.regex.flags.replace(/[gd]/g, '')}gd`),
}));

/**
 * Scans added lines and returns every match with its raw value, so callers can apply
 * the public-by-design check. `scanForSecrets` is the findings-only view.
 */
export function scanForSecretHits(content: string, filePath: string, options: ScanOptions = {}): SecretHit[] {
  const hits: SecretHit[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i];
    const lineHits: SecretHit[] = [];

    for (const { rule, regex } of GLOBAL_RULES) {
      if (options.providerOnly && rule.tier !== 'provider') continue;

      for (const match of lineText.matchAll(regex)) {
        const group = rule.valueGroup ?? 0;
        const value = match[group];
        if (value === undefined) continue;
        if (rule.accept && !rule.accept(value)) continue;
        if (rule.tier === 'provider') {
          if (KNOWN_EXAMPLE_VALUES.has(value)) continue;
          if (options.allowPlaceholders && isPlaceholderValue(value)) continue;
        }

        lineHits.push({
          value,
          valueStart: match.indices?.[group]?.[0] ?? match.index ?? 0,
          lineText,
          tier: rule.tier,
          finding: {
            id: rule.id,
            severity: 'HARD_BLOCK',
            title: rule.title,
            file: filePath,
            line: i + 1,
            match: redactForRule(rule, value),
            category: rule.tier === 'pii' ? 'data' : 'secret',
            description: rule.description,
            action: rule.action,
          },
        });
      }
    }

    // A connection string is matched by both the generic assignment rule and the provider-format
    // rule. Report it once, as the provider-format match: that one is never downgraded.
    const providerIds = new Set(lineHits.filter(h => h.tier === 'provider').map(h => h.finding.id));
    hits.push(...lineHits.filter(h => h.tier === 'provider' || !providerIds.has(h.finding.id)));
  }

  return hits;
}

export function scanForSecrets(content: string, filePath: string, options: ScanOptions = {}): Finding[] {
  return scanForSecretHits(content, filePath, options).map(hit => hit.finding);
}

export interface PathScanOptions {
  /** Glob patterns (matched against the base name when they contain no "/") for internal files that must never be pushed. */
  internalFilePatterns?: string[];
}

// Anchored to the base name, and `[^./]+` keeps every segment unambiguous so matching is linear.
const ENV_TEMPLATE = /(?:^|\/)[^/]*\.env(?:\.[^./]+)*\.(?:example|sample|template|defaults|dist)$/i;

/** `.env.example` and friends: documentation of the variables, not their values. */
export function isEnvTemplatePath(filePath: string): boolean {
  return ENV_TEMPLATE.test(filePath);
}

export function scanFilePathForSecrets(filePath: string, options: PathScanOptions = {}): Finding | null {
  const base = filePath.split('/').pop() ?? filePath;

  const hit = (id: string, title: string, category: Finding['category'], action: string): Finding => ({
    id,
    severity: 'HARD_BLOCK',
    title,
    file: filePath,
    category,
    description: `Sensitive file detected in outgoing changes: ${filePath}`,
    action,
  });

  // Checked first: an internal file stays internal even if its name looks like a template.
  if (options.internalFilePatterns?.some(pattern => minimatch(filePath, pattern, { matchBase: true, dot: true }))) {
    return hit('PG-H014', 'Internal File', 'leakage', 'Remove the file. It must not be committed.');
  }

  if (isEnvTemplatePath(filePath)) return null;

  // .env, .env.local, .env.production, nested or not.
  if (/^\.env(\..+)?$/i.test(base)) {
    return hit('PG-H010', 'Environment File', 'secret', 'Remove from version control, add to .gitignore');
  }

  const isPublicSshKey = /\.pub$/i.test(base);
  if (
    /\.(pem|key|p12|pfx)$/i.test(base) ||
    (!isPublicSshKey && /^id_(?:rsa|ed25519|ecdsa|dsa)/i.test(base))
  ) {
    const title = /^id_/i.test(base) ? 'SSH Private Key File' : 'Private Key File';
    return hit('PG-H011', title, 'secret', 'Remove from version control, add to .gitignore');
  }

  return null;
}
