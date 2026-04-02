import { existsSync, mkdirSync, appendFileSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import type { OverrideEntry } from '../types.js';

export async function overrideCommand(findingId: string, justification: string): Promise<void> {
  // Validate finding ID format
  if (!/^(PG|RG)-[A-Z]\d{3}$/.test(findingId)) {
    console.error(`Invalid finding ID format: ${findingId}`);
    console.error('Expected format: PG-S001, PG-H001, RG-S001, etc.');
    process.exit(1);
  }

  // HARD_BLOCK findings cannot be overridden
  if (findingId.includes('-H')) {
    console.error(`HARD_BLOCK findings cannot be overridden: ${findingId}`);
    console.error('Fix the issue before proceeding.');
    process.exit(1);
  }

  // Get actor from git config or layrix config
  const actor = getActor();

  const entry: OverrideEntry = {
    timestamp: new Date().toISOString(),
    action: 'override',
    findingIds: [findingId],
    actor,
    justification,
    filesAffected: [],
    verdictBefore: 'SOFT_BLOCK',
    verdictAfter: 'PASS (overridden)',
  };

  // Log the override
  const logDir = resolve(process.cwd(), '.llll', 'logs');
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }

  const logPath = resolve(logDir, 'guard-log.jsonl');
  appendFileSync(logPath, JSON.stringify(entry) + '\n');

  console.log('');
  console.log(`Override recorded for ${findingId}`);
  console.log(`  Actor: ${actor}`);
  console.log(`  Justification: ${justification}`);
  console.log(`  Logged to: ${logPath}`);
  console.log('');
  console.log('Warning: This override is logged for compliance audit.');
  console.log('');
}

function getActor(): string {
  // Try layrix config
  try {
    const configPath = resolve(process.env.HOME || '', '.layrix', 'config.json');
    if (existsSync(configPath)) {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (config.email) return config.email;
    }
  } catch {
    // Fall through
  }

  // Try git config
  try {
    return execSync('git config user.email', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}
