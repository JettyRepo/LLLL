#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { pushCommand } from './commands/push.js';
import { hookCommand } from './commands/hook.js';
import { releaseCommand } from './commands/release.js';
import { overrideCommand } from './commands/override.js';
import { installHook, uninstallHook } from './hooks/install.js';

// The version is read from package.json (one place), which sits next to dist/ in the package.
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8')) as { version: string };

const program = new Command();

program
  .name('llll-guard')
  .description('LLLL Guard — Push & Release Compliance Gate')
  .version(version)
  .addHelpText(
    'after',
    '\nExit codes: 0 = pass (warnings allowed), 1 = blocked, 2 = the guard could not run (error).',
  );

program
  .command('push')
  .description('Scan outgoing git changes before push')
  .option('--json', 'Output results as JSON')
  .option('--remote <remote>', 'Remote to compare against (default: the branch upstream)')
  .option('--branch <branch>', 'Branch to compare against')
  .option('--range <range>', 'Scan an explicit git range, for example origin/main..HEAD')
  .option('--stdin', 'Read the pushed refs from stdin, in the format git sends to a pre-push hook')
  .action(pushCommand);

program
  .command('hook')
  .description('Run as a git hook (called by the installed hook, not by hand)')
  .argument('<name>', 'Hook name (pre-push)')
  .argument('[args...]', 'Arguments git passes to the hook (remote name and URL)')
  .option('--json', 'Output results as JSON')
  .action(hookCommand);

program
  .command('release')
  .description('Scan release artifacts before publish')
  .option('--json', 'Output results as JSON')
  .option('--dir <directory>', 'Directory to scan (default: auto-detect)')
  .action(releaseCommand);

program
  .command('override')
  .description('Accept one SOFT_BLOCK finding (HARD_BLOCK findings cannot be overridden)')
  .argument('<finding>', 'Finding reference from the blocked push output, e.g. PG-S002@0123456789ab')
  .argument('<justification>', 'Reason for overriding, kept in the audit log')
  .option('--file <path>', 'The file the finding is in (recorded in the audit log)')
  .option('--days <n>', 'How long the override lasts, 1 to 90 (default 14)')
  .option('--yes', 'Confirm without a terminal prompt, for automation (the log records it)')
  .action(overrideCommand);

program
  .command('install-hook')
  .description('Install the git pre-push hook (an existing hook of yours is kept and still runs)')
  .option('--force', 'Replace an existing pre-push hook instead of chaining it (it is backed up)')
  .option('--shim <path>', 'The launcher the hook runs (set by the guard launcher)')
  .action(installHook);

program
  .command('uninstall-hook')
  .description('Remove the LLLL Guard pre-push hook and restore the hook it chained (one replaced with --force stays in its .bak file)')
  .action(uninstallHook);

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`llll-guard: ${message}`);
  // With --json a consumer reads stdout. Empty output must never look like a clean result.
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ verdict: 'ERROR', error: message }, null, 2));
  }
  process.exit(2);
});
