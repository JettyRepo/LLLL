import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GuardConfig, WhitelistConfig } from '../types.js';
import { DEFAULT_CONFIG, DEFAULT_WHITELIST } from './defaults.js';

export function loadConfig(cwd: string = process.cwd()): GuardConfig {
  const configPath = resolve(cwd, 'llll.policy.json');
  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
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

  const raw = JSON.parse(readFileSync(whitelistPath, 'utf-8'));
  return { ...DEFAULT_WHITELIST, ...raw };
}

export function loadGuardIgnore(cwd: string = process.cwd()): string[] {
  const ignorePath = resolve(cwd, '.guardignore');
  if (!existsSync(ignorePath)) {
    return [];
  }

  return readFileSync(ignorePath, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}
