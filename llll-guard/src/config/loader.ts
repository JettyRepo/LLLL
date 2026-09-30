import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { GuardError } from '../errors.js';
import type { GuardConfig, WhitelistConfig } from '../types.js';
import { DEFAULT_CONFIG, DEFAULT_WHITELIST } from './defaults.js';

function readJson(path: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf-8'));
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('expected a JSON object');
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    throw new GuardError(`Cannot read ${path}: ${(error as Error).message}`);
  }
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

export function loadConfig(cwd: string = process.cwd()): GuardConfig {
  const configPath = resolve(cwd, 'llll.policy.json');
  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  const raw = readJson(configPath) as Partial<GuardConfig>;
  if (Array.isArray(raw.excludePatterns)) {
    rejectNegatedPatterns(raw.excludePatterns, `${configPath} excludePatterns`);
  }
  return {
    ...DEFAULT_CONFIG,
    ...raw,
    pushRules: { ...DEFAULT_CONFIG.pushRules, ...raw.pushRules },
    releaseRules: { ...DEFAULT_CONFIG.releaseRules, ...raw.releaseRules },
  };
}

export function loadWhitelist(cwd: string = process.cwd()): WhitelistConfig {
  const whitelistPath = resolve(cwd, 'llll.whitelist.json');
  if (!existsSync(whitelistPath)) {
    return DEFAULT_WHITELIST;
  }

  const raw = readJson(whitelistPath) as Partial<WhitelistConfig>;
  return { ...DEFAULT_WHITELIST, ...raw };
}

export function loadGuardIgnore(cwd: string = process.cwd()): string[] {
  const ignorePath = resolve(cwd, '.guardignore');
  if (!existsSync(ignorePath)) {
    return [];
  }

  const patterns = readFileSync(ignorePath, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
  rejectNegatedPatterns(patterns, ignorePath);
  return patterns;
}
