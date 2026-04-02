#!/usr/bin/env node

import { Command } from 'commander';
import { pushCommand } from './commands/push.js';
import { releaseCommand } from './commands/release.js';
import { overrideCommand } from './commands/override.js';
import { installHook } from './hooks/install.js';

const program = new Command();

program
  .name('llll-guard')
  .description('LLLL Guard — Push & Release Compliance Gate')
  .version('0.1.0');

program
  .command('push')
  .description('Scan outgoing git changes before push')
  .option('--json', 'Output results as JSON')
  .option('--remote <remote>', 'Remote to compare against', 'origin')
  .option('--branch <branch>', 'Branch to compare against')
  .action(pushCommand);

program
  .command('release')
  .description('Scan release artifacts before publish')
  .option('--json', 'Output results as JSON')
  .option('--dir <directory>', 'Directory to scan (default: auto-detect)')
  .action(releaseCommand);

program
  .command('override')
  .description('Override a SOFT_BLOCK finding')
  .argument('<findingId>', 'Finding ID to override (e.g., PG-S002)')
  .argument('<justification>', 'Reason for overriding')
  .action(overrideCommand);

program
  .command('install-hook')
  .description('Install git pre-push hook')
  .option('--force', 'Overwrite existing pre-push hook')
  .action(installHook);

program.parse();
