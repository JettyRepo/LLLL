import { spawnSync } from 'node:child_process';
import { git, GitError } from '../git.js';

const TEMPLATE_PATHSPECS = [
  '*.env.example',
  '*.env.sample',
  '*.env.template',
  '*.env.defaults',
  'README*',
];

const MAX_REFS = 20;

/**
 * Builds a check for "this exact value is already published".
 *
 * Only committed content that is reachable from a remote-tracking branch counts, so a value
 * added to a README in the very commits being pushed does not vouch for itself. The whole
 * value is matched as a fixed string; a variable name or a prefix of it never qualifies.
 */
export function createPublishedValueCheck(): (value: string) => boolean {
  let refs: string[] | null = null;
  const cache = new Map<string, boolean>();

  return (value: string): boolean => {
    const known = cache.get(value);
    if (known !== undefined) return known;

    refs ??= [
      ...new Set(
        git(['for-each-ref', '--format=%(objectname)', 'refs/remotes'])
          .split('\n')
          .filter(Boolean),
      ),
    ].slice(0, MAX_REFS);

    let published = false;
    if (refs.length > 0) {
      const args = ['grep', '-l', '-F', '-e', value, ...refs, '--', ...TEMPLATE_PATHSPECS];
      const result = spawnSync('git', args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
      if (result.error) throw new GitError(args, result.error.message);
      // `git grep` exits 1 when nothing matches; anything else but 0 is a real failure.
      if (result.status !== 0 && result.status !== 1) throw new GitError(args, result.stderr ?? '');
      published = result.status === 0;
    }

    cache.set(value, published);
    return published;
  };
}
