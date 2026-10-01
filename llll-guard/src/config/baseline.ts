import { GuardError } from '../errors.js';
import { gitShowFile } from '../git.js';
import type { GuardConfig, WhitelistConfig } from '../types.js';
import { DEFAULT_CONFIG, DEFAULT_WHITELIST } from './defaults.js';
import { parseConfig, parseGuardIgnore, parseWhitelist } from './loader.js';

export interface Policy {
  config: GuardConfig;
  ignorePatterns: string[];
  /** `llll.whitelist.json`: used by the release gate. */
  whitelist: WhitelistConfig;
}

const DEFAULT_POLICY: Policy = { config: DEFAULT_CONFIG, ignorePatterns: [], whitelist: DEFAULT_WHITELIST };

/**
 * The policy that governs a push is the one the remote already has: `llll.policy.json` and
 * `.guardignore` as they are in the base commit. Reading them from the working tree, or from
 * the commits being pushed, would let a push loosen the rules that judge it: add `*` to
 * `.guardignore`, or turn a rule off, in the same push as the secret.
 *
 * With no base (the first push to an empty remote) the defaults apply.
 */
export function readPolicyAt(base: string | null): Policy {
  if (base === null) return DEFAULT_POLICY;

  const label = base.slice(0, 12);
  try {
    const policy = gitShowFile(base, 'llll.policy.json');
    const ignore = gitShowFile(base, '.guardignore');
    const whitelist = gitShowFile(base, 'llll.whitelist.json');

    return {
      config: policy === null ? DEFAULT_CONFIG : parseConfig(policy, `llll.policy.json at ${label}`),
      ignorePatterns: ignore === null ? [] : parseGuardIgnore(ignore, `.guardignore at ${label}`),
      whitelist: whitelist === null ? DEFAULT_WHITELIST : parseWhitelist(whitelist, `llll.whitelist.json at ${label}`),
    };
  } catch (error) {
    if (!(error instanceof GuardError)) throw error;
    // The version the remote has cannot be read, so every push to it stops here, including the
    // one that would fix it. Say how to get out instead of leaving the user stuck.
    throw new GuardError(
      `${error.message} This is the version the remote already has, so the fix itself has to be pushed past the guard once (for example with \`git push --no-verify\`).`,
    );
  }
}
