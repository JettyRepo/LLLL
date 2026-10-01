import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { git, gitTry } from './git.js';
import type { Finding, OverrideEntry } from './types.js';

export const DEFAULT_OVERRIDE_DAYS = 14;
export const MAX_OVERRIDE_DAYS = 90;

/** `PG-S002@0123456789ab` */
export const FINDING_REFERENCE = /^((?:PG|RG)-[A-Z]\d{3})(?:@([0-9a-f]{12}))?$/;

/** The repository root, so the log is the same wherever in the repository the command runs. */
export function repoRoot(): string {
  return git(['rev-parse', '--show-toplevel']);
}

export function overrideLogPath(root: string = repoRoot()): string {
  return join(root, '.llll', 'logs', 'guard-log.jsonl');
}

/**
 * Identifies one finding: the rule, the file, and the file's content at the commit that
 * introduced the finding. An override carries this token, so it covers that one thing and
 * stops applying the moment the file changes.
 */
export function findingToken(finding: Pick<Finding, 'id' | 'file' | 'commit'>): string {
  const blob = finding.commit && finding.file ? gitTry(['rev-parse', `${finding.commit}:${finding.file}`]) : null;
  // A file that is not in that commit (deleted, or a path that could not be named) must not give a
  // token that is the same in every commit: fall back to the commit itself.
  const version = blob ?? `no-blob@${finding.commit ?? ''}`;
  return createHash('sha256')
    .update(`${finding.id}\0${finding.file ?? ''}\0${version}`)
    .digest('hex')
    .slice(0, 12);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One log line as an override entry, or null if it is damaged or not an override. The expiry is
 * held to the longest an override may last, counted from when it was written, so a hand-edited
 * `expiresAt` far in the future does not make an override permanent.
 */
function parseEntry(line: string): OverrideEntry | null {
  let raw: unknown;
  try {
    raw = JSON.parse(line);
  } catch {
    return null;
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const entry = raw as Partial<OverrideEntry>;

  if (entry.action !== 'override') return null;
  if (typeof entry.findingToken !== 'string' || !/^[0-9a-f]{12}$/.test(entry.findingToken)) return null;
  if (!Array.isArray(entry.findingIds) || entry.findingIds.some(id => typeof id !== 'string')) return null;
  if (typeof entry.timestamp !== 'string' || typeof entry.expiresAt !== 'string') return null;

  const written = Date.parse(entry.timestamp);
  const expires = Date.parse(entry.expiresAt);
  if (!Number.isFinite(written) || !Number.isFinite(expires)) return null;

  const latest = written + MAX_OVERRIDE_DAYS * DAY_MS;
  return { ...entry, expiresAt: new Date(Math.min(expires, latest)).toISOString() } as OverrideEntry;
}

/**
 * The overrides that are in force, by token. Expired entries and lines that do not parse
 * are ignored: a damaged log can only lead to a block, never to a pass.
 */
export function loadActiveOverrides(now: Date = new Date(), root: string = repoRoot()): Map<string, OverrideEntry> {
  const active = new Map<string, OverrideEntry>();
  const logPath = overrideLogPath(root);
  if (!existsSync(logPath)) return active;

  for (const line of readFileSync(logPath, 'utf-8').split('\n')) {
    if (!line.trim()) continue;
    const entry = parseEntry(line);
    if (entry) {
      // A later entry for the same finding replaces an earlier one, even if it has already expired:
      // that is how an override is ended early.
      active.set(entry.findingToken, entry);
    }
  }

  for (const [token, entry] of active) {
    if (Date.parse(entry.expiresAt) <= now.getTime()) active.delete(token);
  }
  return active;
}
