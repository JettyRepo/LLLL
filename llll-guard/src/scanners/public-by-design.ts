import { isEnvTemplatePath, isPlaceholderValue, type SecretTier } from './secret-scanner.js';

// Some credentials are published on purpose: a maps key shipped to the browser, a placeholder
// in `.env.example`, a demo key that the README tells everyone to use. Reporting those as leaks
// teaches people to ignore the guard. Reporting a real secret as "public" is worse, so every
// rule here compares the matched VALUE, never the variable name or the rest of the line.

export interface PublicByDesignInput {
  tier: SecretTier;
  ruleId: string;
  /** The raw matched secret value. */
  value: string;
  /** Offset of the value within `lineText`. */
  valueStart: number;
  /** The line the value was found on. */
  lineText: string;
  file: string;
}

export interface PublicByDesignDeps {
  /** True if this exact value already exists in a committed template or README on a remote. */
  isPublishedValue(value: string): boolean;
}

const CLIENT_PREFIX = /^\s*(?:(?:export|const|let|var)\s+)*(?:process\.env\.)?['"]?((?:NEXT_PUBLIC|NUXT_PUBLIC|EXPO_PUBLIC|REACT_APP|GATSBY|VITE)_[A-Za-z0-9_]*)['"]?\s*[=:]/;

/** A name that says the value is meant to stay secret, whatever prefix the framework put in front. */
const SECRET_SOUNDING_NAME = /secret|private|password|passwd|token/i;

/**
 * The value is the right-hand side of the assignment that starts the line, as in
 * `NEXT_PUBLIC_MAPS_API_KEY = "..."`. It must come straight after the `=` or `:` (and an optional
 * quote). A prefix on another variable earlier on the line, or a comment mentioning `VITE_`,
 * says nothing about a secret that merely appears later.
 */
function assignedToClientExposedVariable(lineText: string, value: string, valueStart: number): string | null {
  const match = CLIENT_PREFIX.exec(lineText);
  if (!match) return null;
  const name = match[1];
  if (SECRET_SOUNDING_NAME.test(name)) return null;

  const afterOperator = lineText.slice(match[0].length);
  const lead = /^\s*['"`]?/.exec(afterOperator)?.[0].length ?? 0;
  const rightHandSide = match[0].length + lead;
  return valueStart === rightHandSide && lineText.startsWith(value, rightHandSide) ? name : null;
}

/** Mixed letters and digits: something that can be a secret, not an identifier or a word. */
function looksLikeSecretValue(value: string): boolean {
  return value.length >= 16 && /\d/.test(value) && /[A-Za-z]/.test(value);
}

/**
 * Why a finding is a deliberately public credential, or null when it must stay blocked.
 *
 * Provider-format keys, private keys and personal data are never public by design. Only
 * generic assignments can be, and only for the reasons below.
 */
export function publicByDesignReason(input: PublicByDesignInput, deps: PublicByDesignDeps): string | null {
  if (input.tier !== 'generic') return null;

  // 1. A client-exposed API key. Passwords, database credentials and bearer tokens are
  //    secrets even when a framework prefix is attached, so the rule is limited to API keys.
  if (input.ruleId === 'PG-H006') {
    const name = assignedToClientExposedVariable(input.lineText, input.value, input.valueStart);
    if (name) return `assigned to the client-exposed variable ${name}`;
  }

  // 2. An env template documents variables; only placeholder values are harmless there.
  if (isEnvTemplatePath(input.file) && isPlaceholderValue(input.value)) {
    return 'placeholder value in an env template';
  }

  // 3. The same value is already published in a template or README that exists on a remote.
  if (looksLikeSecretValue(input.value) && deps.isPublishedValue(input.value)) {
    return 'the same value is already published in a committed template or README';
  }

  return null;
}
