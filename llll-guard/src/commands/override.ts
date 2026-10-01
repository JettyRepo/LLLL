import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { GuardError } from '../errors.js';
import { gitTry } from '../git.js';
import {
  DEFAULT_OVERRIDE_DAYS,
  FINDING_REFERENCE,
  MAX_OVERRIDE_DAYS,
  overrideLogPath,
  repoRoot,
} from '../overrides.js';
import type { OverrideEntry } from '../types.js';

export interface OverrideOptions {
  file?: string;
  days?: string;
  yes?: boolean;
}

function parseDays(raw: string | undefined): number {
  if (raw === undefined) return DEFAULT_OVERRIDE_DAYS;
  const days = Number(raw);
  if (!Number.isInteger(days) || days < 1 || days > MAX_OVERRIDE_DAYS) {
    throw new GuardError(`--days must be a whole number from 1 to ${MAX_OVERRIDE_DAYS}, got "${raw}".`);
  }
  return days;
}

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * `llll-guard override <ID>@<token> "<justification>"`: accept one SOFT_BLOCK finding.
 *
 * The token comes from the blocked push output. It ties the override to one finding on one
 * version of one file, and the override expires. A person confirms it at a terminal; automation
 * has to say `--yes`, and the log records which of the two it was.
 */
export async function overrideCommand(
  reference: string,
  justification: string,
  options: OverrideOptions,
): Promise<void> {
  const match = FINDING_REFERENCE.exec(reference);
  if (!match) {
    throw new GuardError(
      `Invalid finding reference "${reference}". Expected the form PG-S002@<token>, as printed by the blocked push.`,
    );
  }
  const [, findingId, token] = match;

  // HARD_BLOCK findings cannot be overridden
  if (findingId.includes('-H')) {
    console.error(`HARD_BLOCK findings cannot be overridden: ${findingId}`);
    console.error('Fix the issue before proceeding.');
    process.exitCode = 1;
    return;
  }

  if (!token) {
    throw new GuardError(
      `An override covers one finding. Use the reference from the blocked push output: ${findingId}@<token>.`,
    );
  }
  if (justification.trim().length < 5) {
    throw new GuardError('Give a justification of at least five characters. It is kept in the audit log.');
  }
  const days = parseDays(options.days);
  // Before asking anyone to confirm: outside a repository there is nowhere to record it.
  const logPath = overrideLogPath(repoRoot());

  let confirmation: OverrideEntry['confirmation'];
  if (options.yes) {
    confirmation = 'flag';
  } else if (process.stdin.isTTY) {
    const answer = await ask(
      `Override ${findingId}${options.file ? ` in ${options.file}` : ''} for ${days} days? It is logged. Type "yes" to confirm: `,
    );
    if (answer.trim().toLowerCase() !== 'yes') {
      console.error('Override cancelled.');
      process.exitCode = 1;
      return;
    }
    confirmation = 'tty';
  } else {
    throw new GuardError(
      'An override needs a person to confirm it. Run it in a terminal, or pass --yes for automation (the log records that).',
    );
  }

  const now = new Date();
  const entry: OverrideEntry = {
    timestamp: now.toISOString(),
    action: 'override',
    findingIds: [findingId],
    findingToken: token,
    actor: getActor(),
    justification: justification.trim(),
    filesAffected: options.file ? [options.file] : [],
    confirmation,
    expiresAt: new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString(),
    verdictBefore: 'SOFT_BLOCK',
    verdictAfter: 'PASS (overridden)',
  };

  mkdirSync(dirname(logPath), { recursive: true });
  appendFileSync(logPath, JSON.stringify(entry) + '\n');

  console.log('');
  console.log(`Override recorded for ${findingId}@${token}`);
  console.log(`  Actor: ${entry.actor}`);
  console.log(`  Justification: ${entry.justification}`);
  console.log(`  Confirmed by: ${confirmation === 'tty' ? 'a person at a terminal' : 'the --yes flag'}`);
  console.log(`  Expires: ${entry.expiresAt}`);
  console.log(`  Logged to: ${logPath}`);
  console.log('');
  console.log('This override covers this finding on this version of the file only, and is kept for the audit.');
  console.log('');
}

function getActor(): string {
  // The Layrix account email, if there is one, then the git identity.
  try {
    const configPath = resolve(process.env.HOME || '', '.layrix', 'config.json');
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf-8')) as { email?: unknown };
      if (typeof config.email === 'string' && config.email) return config.email;
    }
  } catch {
    // Fall through to the git identity.
  }
  // `git var` resolves the identity the way a commit would: environment variables, then config.
  const identity = gitTry(['var', 'GIT_AUTHOR_IDENT']);
  return identity?.match(/<([^>]*)>/)?.[1] || gitTry(['config', 'user.email']) || 'unknown';
}
