import type { GuardConfig, WhitelistConfig } from '../types.js';

export const DEFAULT_CONFIG: GuardConfig = {
  enabled: true,
  pushRules: {
    hardBlock: true,
    softBlock: true,
    warn: true,
    disabledRules: [],
  },
  releaseRules: {
    hardBlock: true,
    softBlock: true,
    warn: true,
    disabledRules: [],
  },
  excludePatterns: [
    '*.md',
    '*.txt',
    '*.lock',
    'yarn.lock',
    'package-lock.json',
    'CHANGELOG*',
    'LICENSE*',
  ],
};

export const DEFAULT_WHITELIST: WhitelistConfig = {
  allowedPatterns: [
    'package.json',
    'README*',
    'LICENSE*',
    'CHANGELOG*',
    'dist/**',
    'lib/**',
    'build/**',
    'bin/**',
  ],
  maxPackageSize: 10 * 1024 * 1024,
};
