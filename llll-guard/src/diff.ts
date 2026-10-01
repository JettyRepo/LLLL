import { GuardError } from './errors.js';

// Parser for the output of:
//   git log -p --cc -U0 --format=%x00COMMIT %H --src-prefix=a/ --dst-prefix=b/ ...
//
// It yields one `commit` event per commit and one `file` event per changed file,
// carrying the lines that commit added, with their real line numbers in the file.

export interface AddedLine {
  text: string;
  /** Line number in the new version of the file. */
  line: number;
}

export interface FileEvent {
  kind: 'file';
  commit: string;
  /** The path after the change. For a deleted file, the path that was removed. */
  path: string;
  added: AddedLine[];
  /** The file was removed. It has no added lines and its content is not scanned. */
  deleted: boolean;
  /** For a rename or copy, the path it came from. */
  oldPath?: string;
}

export type LogEvent = { kind: 'commit'; commit: string } | FileEvent;

/** Marks the start of each commit. NUL never appears in a text diff. */
export const COMMIT_MARKER = '\u0000COMMIT ';

/** Path used when git's header cannot be parsed. Its added lines are still scanned. */
export const UNKNOWN_PATH = '(unknown path)';

interface Current {
  commit: string;
  headerPath: string | null;
  plusPath: string | null;
  /** The `--- a/<path>` side, which is the only place a deleted file's name appears with certainty. */
  minusPath: string | null;
  renameTo: string | null;
  renameFrom: string | null;
  deleted: boolean;
  inHunk: boolean;
  /** Number of prefix columns before the content: 1, or parents count for a combined diff. */
  prefixLen: number;
  newLine: number;
  added: AddedLine[];
}

const HUNK_HEADER = /^(@{2,}) (?:-\d+(?:,\d+)? )+\+(\d+)(?:,\d+)? \1/;

/** Decodes a path that git wrapped in double quotes (C-style escapes, octal bytes). */
export function unquoteGitPath(raw: string): string {
  if (raw.length < 2 || !raw.startsWith('"') || !raw.endsWith('"')) return raw;
  const body = raw.slice(1, -1);
  const bytes: number[] = [];
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch !== '\\') {
      bytes.push(...Buffer.from(ch, 'utf-8'));
      continue;
    }
    const next = body[++i];
    if (next >= '0' && next <= '7') {
      let octal = next;
      while (octal.length < 3 && body[i + 1] >= '0' && body[i + 1] <= '7') octal += body[++i];
      bytes.push(Number.parseInt(octal, 8));
    } else {
      const simple: Record<string, number> = { n: 10, t: 9, r: 13, a: 7, b: 8, f: 12, v: 11, '"': 34, '\\': 92 };
      bytes.push(simple[next] ?? next.charCodeAt(0));
    }
  }
  return Buffer.from(bytes).toString('utf-8');
}

/** Extracts `P` from `a/P b/P`. Only used when the header has no `+++` line (empty or binary files). */
function pathFromGitHeader(rest: string): string | null {
  const mid = (rest.length - 1) / 2;
  if (Number.isInteger(mid) && rest[mid] === ' ') {
    const left = unquoteGitPath(rest.slice(0, mid));
    const right = unquoteGitPath(rest.slice(mid + 1));
    if (left.startsWith('a/') && right.startsWith('b/') && left.slice(2) === right.slice(2)) {
      return right.slice(2);
    }
  }
  const match = rest.match(/^.* (?:"b\/(.*)"|b\/(.*))$/);
  if (match?.[1] !== undefined) return unquoteGitPath(`"${match[1]}"`);
  return match?.[2] ?? null;
}

function stripPrefix(path: string, prefix: string): string {
  return path.startsWith(prefix) ? path.slice(prefix.length) : path;
}

function finish(current: Current | null): LogEvent | null {
  if (!current) return null;
  if (current.deleted) {
    // A deletion is reported so that removing a policy file is seen; its content is not scanned.
    const path = current.minusPath ?? current.headerPath ?? UNKNOWN_PATH;
    return { kind: 'file', commit: current.commit, path, added: [], deleted: true };
  }
  const path = current.plusPath ?? current.renameTo ?? current.headerPath ?? UNKNOWN_PATH;
  return {
    kind: 'file',
    commit: current.commit,
    path,
    added: current.added,
    deleted: false,
    ...(current.renameFrom ? { oldPath: current.renameFrom } : {}),
  };
}

export async function* parseLog(lines: AsyncIterable<string>): AsyncGenerator<LogEvent> {
  let commit = '';
  let current: Current | null = null;

  for await (const line of lines) {
    if (line.startsWith(COMMIT_MARKER)) {
      const done = finish(current);
      if (done) yield done;
      current = null;
      commit = line.slice(COMMIT_MARKER.length).trim();
      yield { kind: 'commit', commit };
      continue;
    }

    if (line.startsWith('diff --git ') || line.startsWith('diff --cc ') || line.startsWith('diff --combined ')) {
      const done = finish(current);
      if (done) yield done;
      const isGit = line.startsWith('diff --git ');
      const rest = line.slice(line.indexOf(' ', 5) + 1);
      current = {
        commit,
        headerPath: isGit ? pathFromGitHeader(rest) : unquoteGitPath(rest),
        plusPath: null,
        minusPath: null,
        renameTo: null,
        renameFrom: null,
        deleted: false,
        inHunk: false,
        prefixLen: 1,
        newLine: 0,
        added: [],
      };
      continue;
    }

    if (!current) continue;

    if (line.startsWith('@@')) {
      const match = line.match(HUNK_HEADER);
      // Anything we cannot read stops the scan. Skipping it would drop the added lines that follow.
      if (!match) throw new GuardError(`Unrecognised hunk header in git output: ${JSON.stringify(line.slice(0, 80))}`);
      current.inHunk = true;
      current.prefixLen = match[1].length - 1;
      current.newLine = Number.parseInt(match[2], 10);
      continue;
    }

    if (!current.inHunk) {
      if (line.startsWith('deleted file mode')) {
        current.deleted = true;
      } else if (line.startsWith('--- ')) {
        const name = line.slice(4).replace(/\t$/, '');
        if (name !== '/dev/null') current.minusPath = stripPrefix(unquoteGitPath(name), 'a/');
      } else if (line.startsWith('rename from ') || line.startsWith('copy from ')) {
        current.renameFrom = unquoteGitPath(line.slice(line.indexOf(' from ') + 6));
      } else if (line.startsWith('+++ ')) {
        // Git appends a TAB after names that contain spaces.
        const name = line.slice(4).replace(/\t$/, '');
        if (name === '/dev/null') current.deleted = true;
        else current.plusPath = stripPrefix(unquoteGitPath(name), 'b/');
      } else if (line.startsWith('rename to ') || line.startsWith('copy to ')) {
        current.renameTo = unquoteGitPath(line.slice(line.indexOf(' to ') + 4));
      }
      continue;
    }

    if (line === '' || line.startsWith('\\')) continue;

    const prefix = line.slice(0, current.prefixLen);
    const text = line.slice(current.prefixLen);
    if (!/^[ +-]+$/.test(prefix)) {
      throw new GuardError(`Unexpected line inside a diff hunk: ${JSON.stringify(line.slice(0, 80))}`);
    }
    if (/^\++$/.test(prefix)) {
      // Added relative to every parent: genuinely new content.
      current.added.push({ text, line: current.newLine });
    }
    // The line exists in the result unless some column marks it as removed.
    if (!prefix.includes('-')) current.newLine++;
  }

  const done = finish(current);
  if (done) yield done;
}
