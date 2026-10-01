import { GuardError } from './errors.js';
import { commitExists, git, gitOk, gitTry } from './git.js';

/** One line of the pre-push hook's stdin: `<local ref> <local sha> <remote ref> <remote sha>`. */
export interface PushedRef {
  localRef: string;
  localSha: string;
  remoteRef: string;
  remoteSha: string;
}

/** What to hand to `git log` / `git rev-list` (always followed by `--`). */
export interface ResolvedRange {
  revArgs: string[];
  /** Human readable, for error messages. */
  label: string;
  /**
   * A commit that stands for "what the remote already has". The policy that judges this
   * range is read from it. Null when there is no such commit (an empty remote).
   */
  base: string | null;
}

const SHA = /^[0-9a-f]{40}([0-9a-f]{24})?$/;
const ALL_ZEROS = /^0+$/;

function isZero(sha: string): boolean {
  return ALL_ZEROS.test(sha);
}

/** Parses what git writes to a pre-push hook's stdin. Anything unexpected is an error, never a guess. */
export function parsePrePushInput(input: string): PushedRef[] {
  const refs: PushedRef[] = [];
  for (const raw of input.split('\n')) {
    const line = raw.trim();
    if (line === '') continue;
    const parts = line.split(/\s+/);
    if (parts.length !== 4 || !SHA.test(parts[1]) && !isZero(parts[1]) || !SHA.test(parts[3]) && !isZero(parts[3])) {
      throw new GuardError(`Unexpected line from git on stdin: "${line}". Expected "<local ref> <local sha> <remote ref> <remote sha>".`);
    }
    const [localRef, localSha, remoteRef, remoteSha] = parts;
    refs.push({ localRef, localSha, remoteRef, remoteSha });
  }
  return refs;
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/**
 * Maps what git passed as the remote (a configured name, or a URL) to a configured remote name.
 * Returns null when it is neither, for example a push to a fork URL that has no remote entry.
 */
export function resolveRemoteName(remote: string | undefined): string | null {
  if (!remote) return null;
  const names = git(['remote']).split('\n').filter(Boolean);
  if (names.includes(remote)) return remote;

  const wanted = normalizeUrl(remote);
  for (const name of names) {
    const urls = [
      ...(gitTry(['remote', 'get-url', '--all', name]) ?? '').split('\n'),
      ...(gitTry(['remote', 'get-url', '--push', '--all', name]) ?? '').split('\n'),
    ];
    if (urls.some(url => url !== '' && normalizeUrl(url) === wanted)) return name;
  }
  return null;
}

/**
 * Commits a pushed ref would publish.
 *
 * - An existing remote ref whose old commit we have: `<remote sha>..<local sha>`.
 * - A new ref, or a remote sha we do not have (a force-push over commits never fetched):
 *   everything reachable from the local sha that is not on a remote-tracking branch of the
 *   remote being pushed to. That is the set git would send.
 * - A remote we cannot match to a configured one: we know nothing about what it already has,
 *   so nothing is excluded. Commits that only exist on another remote's branches are
 *   published here for the first time.
 *
 * Returns null for a deletion, which adds nothing.
 */
export function rangeForPushedRef(ref: PushedRef, remote: string | undefined): ResolvedRange | null {
  if (isZero(ref.localSha)) return null;

  // Only a configured remote name is ever turned into a pattern.
  const name = resolveRemoteName(remote);
  const tip = defaultBranchTip(name);

  if (!isZero(ref.remoteSha) && commitExists(ref.remoteSha)) {
    // The policy for a branch is the default branch's, so a branch cannot keep a loosened policy
    // of its own. Pushing the default branch itself is judged by the exact commit it replaces.
    const pushingDefault = tip?.branch !== null && tip?.branch !== undefined && ref.remoteRef === `refs/heads/${tip.branch}`;
    return {
      revArgs: [`${ref.remoteSha}..${ref.localSha}`],
      label: ref.localRef,
      base: tip && !pushingDefault ? tip.sha : ref.remoteSha,
    };
  }

  return {
    revArgs: name ? [ref.localSha, '--not', `--remotes=${name}`] : [ref.localSha],
    label: ref.localRef,
    base: tip?.sha ?? null,
  };
}

interface DefaultBranchTip {
  sha: string;
  /** The branch name on the remote, if it is known. */
  branch: string | null;
}

/**
 * The tip of the remote's default branch as the local clone knows it: `<remote>/HEAD` if that is
 * set, else `main` or `master`, else the first remote-tracking branch. This, not a merge base with
 * whatever the pushed branch grew from, is what "the policy the remote has" means: a branch cut
 * from an old commit, or an orphan branch, is judged by the policy as it is now.
 */
function defaultBranchTip(remoteName: string | null): DefaultBranchTip | null {
  const pattern = remoteName ? `refs/remotes/${remoteName}` : 'refs/remotes';
  const rank = (ref: string): number => (/\/HEAD$/.test(ref) ? 0 : /\/(?:main|master)$/.test(ref) ? 1 : 2);
  const [top] = git(['for-each-ref', '--format=%(refname) %(objectname)', pattern])
    .split('\n')
    .filter(Boolean)
    .map(line => line.split(' '))
    .sort((a, b) => rank(a[0]) - rank(b[0]));
  if (!top) return null;

  const [refname, sha] = top;
  let branch: string | null = refname.replace(/^refs\/remotes\/[^/]+\//, '');
  if (branch === 'HEAD') {
    const target = gitTry(['symbolic-ref', '--short', refname]);
    branch = target ? target.replace(/^[^/]+\//, '') : null;
  }
  return { sha, branch };
}

function refuseOptionLike(value: string, what: string): void {
  if (value.startsWith('-')) {
    throw new GuardError(`${what} must not start with "-": ${value}`);
  }
}

export interface ManualRangeOptions {
  remote?: string;
  branch?: string;
  range?: string;
}

/**
 * Range for `llll-guard push` without hook input. Uses the branch's upstream, an explicit
 * remote/branch pair, or an explicit range. With none of those there is nothing sound to
 * compare against, so it stops with an error instead of passing.
 */
export function resolveManualRange(options: ManualRangeOptions): ResolvedRange {
  if (options.range) {
    refuseOptionLike(options.range, '--range');
    if (!gitOk(['rev-list', '--max-count=1', options.range, '--'])) {
      throw new GuardError(`git cannot resolve the range "${options.range}".`);
    }
    if (options.range.includes('...')) {
      throw new GuardError(`The symmetric range "${options.range}" is not supported. Use <a>..<b>.`);
    }
    let base: string | null;
    if (options.range.includes('..')) {
      // For `a..b` the policy comes from `a`; `..b` means from HEAD.
      const left = options.range.split('..')[0] || 'HEAD';
      base = gitTry(['rev-parse', '--verify', '--quiet', `${left}^{commit}`]);
      if (base === null) {
        throw new GuardError(`Cannot resolve the start of the range "${options.range}" to a commit.`);
      }
    } else {
      // A single revision has no start. Judge it by the remote's default branch, never by itself.
      base = defaultBranchTip(null)?.sha ?? null;
    }
    return { revArgs: [options.range], label: options.range, base };
  }

  if (options.branch !== undefined || options.remote !== undefined) {
    const remote = options.remote ?? 'origin';
    const branch = options.branch ?? git(['rev-parse', '--abbrev-ref', 'HEAD']);
    refuseOptionLike(remote, '--remote');
    refuseOptionLike(branch, '--branch');
    const tracking = `refs/remotes/${remote}/${branch}`;
    if (!gitOk(['rev-parse', '--verify', '--quiet', tracking])) {
      throw new GuardError(`No remote branch ${remote}/${branch} to compare against. Fetch it, or pass --range.`);
    }
    return {
      revArgs: [`${tracking}..HEAD`],
      label: `${remote}/${branch}..HEAD`,
      base: git(['rev-parse', '--verify', `${tracking}^{commit}`]),
    };
  }

  const upstream = gitTry(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
  if (upstream === null) {
    const branch = gitTry(['rev-parse', '--abbrev-ref', 'HEAD']) ?? 'HEAD';
    throw new GuardError(
      `Branch "${branch}" has no upstream to compare against. Pass --range <a>..<b>, or run the gate from the pre-push hook, which knows what is being pushed.`,
    );
  }
  return {
    revArgs: ['@{upstream}..HEAD'],
    label: `${upstream}..HEAD`,
    base: git(['rev-parse', '--verify', '@{upstream}^{commit}']),
  };
}
