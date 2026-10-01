import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { GuardError } from '../errors.js';
import type { GuardConfig, WhitelistConfig } from '../types.js';
import { DEFAULT_CONFIG, DEFAULT_WHITELIST } from './defaults.js';

function parseJson(text: string, label: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('expected a JSON object');
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    throw new GuardError(`Cannot read ${label}: ${(error as Error).message}`);
  }
}

function readJson(path: string): Record<string, unknown> {
  let text: string;
  try {
    text = readFileSync(path, 'utf-8');
  } catch (error) {
    throw new GuardError(`Cannot read ${path}: ${(error as Error).message}`);
  }
  return parseJson(text, path);
}

/**
 * minimatch reads "!pattern" as "everything except pattern", so a gitignore-style negation
 * would switch scanning off for almost every file. Refuse it instead of guessing.
 */
function rejectNegatedPatterns(patterns: unknown[], source: string): void {
  for (const pattern of patterns) {
    if (typeof pattern === 'string' && pattern.startsWith('!')) {
      throw new GuardError(`${source}: negated pattern "${pattern}" is not supported. Remove it, or list what to ignore explicitly.`);
    }
  }
}

function fail(path: string, message: string): never {
  throw new GuardError(`${path}: ${message}`);
}

function expectStringArray(value: unknown, path: string, where: string): void {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    fail(path, `"${where}" must be an array of strings.`);
  }
}

function validateRules(value: unknown, path: string, where: string): void {
  if (value === undefined) return;
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(path, `"${where}" must be an object.`);
  }
  const rules = value as Record<string, unknown>;
  for (const flag of ['hardBlock', 'softBlock', 'warn']) {
    // `null` or `0` from a typo would otherwise switch a whole class of rules off without a word.
    if (rules[flag] !== undefined && typeof rules[flag] !== 'boolean') {
      fail(path, `"${where}.${flag}" must be true or false.`);
    }
  }
  if (rules.disabledRules !== undefined) {
    expectStringArray(rules.disabledRules, path, `${where}.disabledRules`);
    // PG-S011 is the alarm for changing this very file. A policy that mutes it would exempt every
    // later change to the policy from review.
    if ((rules.disabledRules as string[]).includes('PG-S011')) {
      fail(path, `"${where}.disabledRules" cannot include PG-S011, the review of changes to the policy.`);
    }
  }
}

/**
 * A config that is wrong in a way that would quietly weaken the guard is an error, not a
 * default: `hardBlock: null` must not turn secret scanning off, and `disabledRules: "PG-H0"`
 * must not be read as a substring that disables every PG-H0xx rule.
 */
function validateConfig(raw: Partial<GuardConfig>, path: string): void {
  if (raw.enabled !== undefined && typeof raw.enabled !== 'boolean') {
    fail(path, '"enabled" must be true or false.');
  }
  validateRules(raw.pushRules, path, 'pushRules');
  validateRules(raw.releaseRules, path, 'releaseRules');
  for (const key of ['excludePatterns', 'internalFilePatterns'] as const) {
    const value: unknown = raw[key];
    if (value === undefined) continue;
    expectStringArray(value, path, key);
    rejectNegatedPatterns(value as string[], `${path} ${key}`);
  }
}

/** Parses and validates the text of an llll.policy.json. `label` names it in error messages. */
export function parseConfig(text: string, label: string): GuardConfig {
  const raw = parseJson(text, label) as Partial<GuardConfig>;
  validateConfig(raw, label);
  return {
    ...DEFAULT_CONFIG,
    ...raw,
    pushRules: { ...DEFAULT_CONFIG.pushRules, ...raw.pushRules },
    releaseRules: { ...DEFAULT_CONFIG.releaseRules, ...raw.releaseRules },
  };
}

export function loadConfig(cwd: string = process.cwd()): GuardConfig {
  const configPath = resolve(cwd, 'llll.policy.json');
  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }
  return parseConfig(readFileSync(configPath, 'utf-8'), configPath);
}

/** Parses and validates the text of an llll.whitelist.json. `label` names it in error messages. */
export function parseWhitelist(text: string, label: string): WhitelistConfig {
  const raw = parseJson(text, label) as Partial<WhitelistConfig>;
  if (raw.maxPackageSize !== undefined && (typeof raw.maxPackageSize !== 'number' || !(raw.maxPackageSize > 0))) {
    fail(label, '"maxPackageSize" must be a positive number of bytes.');
  }
  return { ...DEFAULT_WHITELIST, ...raw };
}

export function loadWhitelist(cwd: string = process.cwd()): WhitelistConfig {
  const whitelistPath = resolve(cwd, 'llll.whitelist.json');
  if (!existsSync(whitelistPath)) {
    return DEFAULT_WHITELIST;
  }
  return parseWhitelist(readFileSync(whitelistPath, 'utf-8'), whitelistPath);
}

/** Parses the text of a .guardignore. Negated patterns are refused, see rejectNegatedPatterns. */
export function parseGuardIgnore(text: string, label: string): string[] {
  const patterns = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
  rejectNegatedPatterns(patterns, label);
  return patterns;
}

export function loadGuardIgnore(cwd: string = process.cwd()): string[] {
  const ignorePath = resolve(cwd, '.guardignore');
  if (!existsSync(ignorePath)) {
    return [];
  }
  return parseGuardIgnore(readFileSync(ignorePath, 'utf-8'), ignorePath);
}
