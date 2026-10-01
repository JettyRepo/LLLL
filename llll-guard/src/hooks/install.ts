import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GuardError } from '../errors.js';
import { git, gitTry } from '../git.js';

/** Present in every hook this tool writes, so that a later run can tell its own hook from anyone else's. */
export const MANAGED_MARKER = 'LLLL-GUARD-MANAGED';
/** A comment in the launcher script, used to recognise it. */
export const SHIM_MARKER = 'LLLL-GUARD-SHIM';
/** Hook managers that find their work from the name the hook was started as. */
const HOOK_MANAGER = /husky|overcommit|lefthook/i;
/** In a hook that runs a chained hook; uninstall restores the chained hook only if this is present. */
const CHAINED_MARKER = 'LLLL-GUARD-CHAINED';
/** Where an existing hook of someone else is kept, so that it still runs after the guard. */
const CHAIN_NAME = 'pre-push.pre-llll';

/** The hooks that earlier versions wrote (the bash launcher and the first TypeScript installer). */
const LEGACY_HOOK = /LLLL Guard — Pre-Push Compliance Gate|Installed by: (?:llll-)?guard install-hook/;

export interface InstallOptions {
  /** Replace a hook of someone else instead of chaining it. It is backed up, never deleted. */
  force?: boolean;
  /** The launcher the hook should run. Defaults to the `guard` next to this package, if there is one. */
  shim?: string;
}

type HookKind = 'managed' | 'legacy' | 'foreign';

function classify(content: string): HookKind {
  if (content.includes(MANAGED_MARKER)) return 'managed';
  if (LEGACY_HOOK.test(content)) return 'legacy';
  return 'foreign';
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function isUnder(path: string, parent: string): boolean {
  return path === parent || path.startsWith(parent.endsWith(sep) ? parent : parent + sep);
}

/**
 * Where git reads hooks from for this repository: a plain clone, a linked worktree (whose `.git`
 * is a file, and whose hooks are shared), or a `core.hooksPath` such as husky's. `insideWorkTree`
 * means the folder is part of the checked-out project, so a file in it is likely tracked.
 */
function commonDir(): string {
  return resolve(process.cwd(), git(['rev-parse', '--git-common-dir']));
}

function hooksDirectory(): { dir: string; insideWorkTree: boolean } {
  const cwd = process.cwd();
  const dir = resolve(cwd, git(['rev-parse', '--git-path', 'hooks']));
  const top = gitTry(['rev-parse', '--show-toplevel']);
  const common = commonDir();
  return { dir, insideWorkTree: top !== null && isUnder(dir, top) && !isUnder(dir, common) };
}

/** The launcher that sits next to this package in a clone, if it is there. */
export function defaultShimPath(): string | null {
  // <clone>/llll-guard/dist/hooks/install.js -> <clone>/guard
  const candidate = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'guard');
  try {
    return readFileSync(candidate, 'utf-8').slice(0, 400).includes(SHIM_MARKER) ? candidate : null;
  } catch {
    return null;
  }
}

/**
 * The pre-push hook. It keeps git's stdin in a file so that the guard and a chained hook of
 * someone else both read the refs being pushed, runs the guard first, and runs the chained hook
 * only if the guard lets the push through. If the launcher cannot be found it says so; whether
 * that stops the push follows the same warn-first switch as the launcher (LLLL_GUARD_STRICT).
 */
export function renderHook(options: { shim: string | null; chain: boolean }): string {
  const lines = [
    '#!/bin/sh',
    `# ${MANAGED_MARKER}: pre-push hook written by \`install-hook\`. Run it again to refresh,`,
    '# `uninstall-hook` to remove. Do not edit: the next install overwrites this file.',
    'input=$(mktemp "${TMPDIR:-/tmp}/llll-guard-input.XXXXXX") || exit 2',
    `trap 'rm -f "$input"' EXIT`,
    'cat > "$input" || { echo "LLLL Guard: could not save the pushed refs, so the push is stopped." >&2; exit 2; }',
    'status=0',
  ];

  const found = (command: string): string[] => [`${command} hook pre-push "$@" < "$input" || status=$?`];
  const branches: string[][] = [];
  if (options.shim) {
    const shim = shellQuote(options.shim);
    branches.push([`if [ -x ${shim} ]; then`, ...found(shim)]);
    // A launcher that exists but cannot run is a fault to fix, not a missing install: stop the push.
    branches.push([
      `elif [ -e ${shim} ]; then`,
      `  echo "LLLL Guard: the launcher exists but is not executable (chmod +x it). The push is stopped." >&2`,
      '  status=2',
    ]);
  }
  branches.push([`${options.shim ? 'elif' : 'if'} command -v llll-guard >/dev/null 2>&1; then`, ...found('llll-guard')]);
  branches.push([
    'else',
    `  echo "LLLL Guard: not found${options.shim ? ` at ${options.shim.replace(/["$`\\]/g, '')} and` : ''} on PATH. This push was NOT checked." >&2`,
    '  if [ "${LLLL_GUARD_STRICT:-0}" = "1" ]; then status=2; fi',
  ]);
  for (const branch of branches) lines.push(...branch.map(line => (line.startsWith('  ') || line.startsWith('if') || line.startsWith('elif') || line.startsWith('else') ? line : `  ${line}`)));
  lines.push('fi');

  lines.push(
    'if [ "$status" -ne 0 ]; then',
    '  if [ "$status" -eq 1 ]; then',
    '    echo "LLLL Guard: push blocked. Fix the findings above, or override SOFT_BLOCK ones with the command shown." >&2',
    '  else',
    '    echo "LLLL Guard could not run, so the push is stopped (exit $status). See the message above." >&2',
    '  fi',
    '  exit "$status"',
    'fi',
  );

  if (options.chain) {
    lines.push(
      `# ${CHAINED_MARKER}`,
      `chained="$(dirname "$0")/${CHAIN_NAME}"`,
      'if [ -x "$chained" ]; then "$chained" "$@" < "$input" || exit $?; fi',
    );
  }
  lines.push('exit 0', '');
  return lines.join('\n');
}

export async function installHook(options: InstallOptions): Promise<void> {
  const { dir, insideWorkTree } = hooksDirectory();
  const hookPath = join(dir, 'pre-push');
  const chainPath = join(dir, CHAIN_NAME);
  const shim = options.shim ? resolve(options.shim) : defaultShimPath();

  mkdirSync(dir, { recursive: true });

  let chain = false;
  let note = '';
  let undo: (() => void) | null = null;
  if (existsSync(hookPath) || isLink(hookPath)) {
    const existing = isLink(hookPath) ? '' : readFileSync(hookPath, 'utf-8');
    const kind = isLink(hookPath) ? 'foreign' : classify(existing);

    if (kind === 'managed') {
      chain = existing.includes(CHAINED_MARKER) && existsSync(chainPath);
      note = chain ? 'Refreshed. Your own hook still runs after the guard.' : 'Refreshed.';
    } else if (kind === 'legacy') {
      note = 'Replaced the hook of an earlier LLLL version.';
    } else if (options.force) {
      const backup = `${hookPath}.bak.${Date.now()}`;
      renameSync(hookPath, backup);
      undo = () => renameSync(backup, hookPath);
      note = `Your existing hook was replaced and is kept as ${backup}. It no longer runs.`;
    } else if (insideWorkTree) {
      // husky 9 points core.hooksPath at a generated, ignored folder; the file to edit is one level up.
      const target = hookPath.endsWith(`${sep}.husky${sep}_${sep}pre-push`) ? join(dir, '..', 'pre-push') : hookPath;
      throw new GuardError(
        `${hookPath} is a pre-push hook inside your project (husky or similar), so it is probably tracked. ` +
          `It is not changed. Add this line to ${target} yourself, before anything in it that reads standard input:\n\n` +
          `  ${shim ? shellQuote(shim) : 'llll-guard'} hook pre-push "$@"\n\n` +
          'Or run install-hook --force to replace it (it is backed up first).',
      );
    } else if (HOOK_MANAGER.test(existing)) {
      // These tools pick the hook to run from the name of the file they were started as, which
      // chaining changes; the user's own checks would stop running without a word.
      throw new GuardError(
        `${hookPath} belongs to a hook manager (husky, overcommit or lefthook), which does not work when chained. ` +
          `It is not changed. Add this line to the hook the manager runs, before anything that reads standard input:\n\n` +
          `  ${shim ? shellQuote(shim) : 'llll-guard'} hook pre-push "$@"\n\n` +
          'Or run install-hook --force to replace it (it is backed up first).',
      );
    } else {
      if (existsSync(chainPath)) {
        throw new GuardError(
          `${chainPath} already exists, so ${hookPath} cannot be kept next to it. Move one of them, or run install-hook --force.`,
        );
      }
      renameSync(hookPath, chainPath);
      undo = () => renameSync(chainPath, hookPath);
      chain = true;
      note = `Your existing hook was kept as ${CHAIN_NAME} and runs after the guard.`;
    }
  }

  // Write beside the hook and rename into place, so an interrupted write never leaves an empty
  // (and therefore passing) hook, and put the user's own hook back if the write fails.
  const staged = `${hookPath}.llll-new`;
  try {
    writeFileSync(staged, renderHook({ shim, chain }), { mode: 0o755 });
    chmodSync(staged, 0o755);
    renameSync(staged, hookPath);
  } catch (error) {
    // Restore the user's hook first; cleaning up the staged file must not get in its way.
    if (undo) undo();
    try {
      rmSync(staged, { force: true });
    } catch {
      // Not ours to remove (for example a directory of that name); the original error is the one to report.
    }
    throw error;
  }

  console.log('LLLL Guard pre-push hook installed.');
  const top = gitTry(['rev-parse', '--show-toplevel']);
  if ((top === null || !isUnder(dir, top)) && !isUnder(dir, commonDir())) {
    console.log(`  Note: ${dir} is outside this repository (a shared core.hooksPath), so this hook runs for every repository that uses it.`);
  }
  console.log(`  Location: ${hookPath}`);
  console.log(`  Runs: ${shim ?? 'llll-guard from PATH'}`);
  if (note) console.log(`  ${note}`);
  console.log('');
  console.log('The hook scans what is about to be pushed. To remove it: uninstall-hook.');
}

export async function uninstallHook(): Promise<void> {
  const { dir } = hooksDirectory();
  const hookPath = join(dir, 'pre-push');
  const chainPath = join(dir, CHAIN_NAME);

  if (!existsSync(hookPath) && !isLink(hookPath)) {
    console.log('There is no pre-push hook to remove.');
    return;
  }
  if (isLink(hookPath) || classify(readFileSync(hookPath, 'utf-8')) === 'foreign') {
    console.log(`${hookPath} is not an LLLL Guard hook, so it is left alone.`);
    return;
  }

  const hadChain = readFileSync(hookPath, 'utf-8').includes(CHAINED_MARKER) && existsSync(chainPath);
  if (hadChain) {
    // One rename replaces the guard's hook with the user's own: there is no moment without a hook.
    renameSync(chainPath, hookPath);
    console.log(`LLLL Guard hook removed. Your own hook is back at ${hookPath}.`);
  } else {
    rmSync(hookPath);
    console.log(`LLLL Guard hook removed from ${hookPath}.`);
  }
}

function isLink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}
