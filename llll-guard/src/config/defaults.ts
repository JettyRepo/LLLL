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
  // Machine-generated lock files, by exact name (matched at any depth). A wildcard such as
  // `*.lock` or `*.sum` would also hide a file somebody merely named that way.
  // Documentation (*.md, *.txt, CHANGELOG*, LICENSE*) is not excluded: it is still scanned.
  excludePatterns: [
    'package-lock.json',
    'npm-shrinkwrap.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'Cargo.lock',
    'go.sum',
    'poetry.lock',
    'Pipfile.lock',
    'composer.lock',
    'Gemfile.lock',
  ],
  // PG-H014. None by default; a project lists the file names that must never be committed.
  internalFilePatterns: [],
};

export const DEFAULT_WHITELIST: WhitelistConfig = {
  maxPackageSize: 10 * 1024 * 1024,
};
