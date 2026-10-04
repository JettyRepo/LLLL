#!/usr/bin/env bash
# LLLL installer for Claude Code
# Usage: ./install-claude-code.sh [--uninstall]
#
# Creates ~/.claude/skills/llll/ holding links to the skill files only (SKILL.md and the
# reference documents it reads), so Claude Code discovers /llll without being handed the rest of
# the clone (installers, tests, the guard engine, git history). `git pull` in the clone updates
# the skill; the links keep pointing at it.

set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
SKILL_SRC="$SRC/plugins/llll/skills/llll"
SKILLS_DIR="$HOME/.claude/skills"
DEST="$SKILLS_DIR/llll"
MARKER=".llll-managed"

SKILL_FILES=(
  SKILL.md
  compliance-checklist-master.md
  llll-check-taxonomy.md
  scan-patterns.md
  guard-patterns.md
  output-templates.md
  examples.md
  checklist-schema.md
  mode-scan.md
  mode-guard-review.md
  menus.md
  output-standards.md
  observation-storage.md
)

# The older installer linked the whole clone as the skill directory.
is_legacy_link() {
  local target
  [[ -L "$DEST" ]] || return 1
  target="$(readlink "$DEST")"
  [[ "$target" == "$SRC" || "$(cd "$target" 2>/dev/null && pwd -P)" == "$SRC" ]]
}

is_ours() {
  [[ -d "$DEST" && ! -L "$DEST" && -f "$DEST/$MARKER" ]]
}

if [[ "${1:-}" == "--uninstall" ]]; then
  if is_legacy_link; then
    rm "$DEST"
    echo "✓ Removed $DEST (a link to the whole clone, from an older installer)."
  elif is_ours; then
    rm -rf "$DEST"
    echo "✓ Removed $DEST."
  elif [[ -e "$DEST" || -L "$DEST" ]]; then
    echo "$DEST was not created by this installer, so it is left alone." >&2
    exit 1
  else
    echo "Nothing to remove: $DEST does not exist."
  fi
  exit 0
fi

if [[ -n "${1:-}" ]]; then
  echo "Usage: $0 [--uninstall]" >&2
  exit 2
fi

for f in "${SKILL_FILES[@]}"; do
  if [[ ! -f "$SKILL_SRC/$f" ]]; then
    echo "Error: $SKILL_SRC/$f is missing. Is this a complete clone of LLLL?" >&2
    exit 1
  fi
done

mkdir -p "$SKILLS_DIR"

if is_legacy_link; then
  rm "$DEST"
  echo "Replacing the older whole-clone link with a link to the skill files only."
elif is_ours; then
  rm -rf "$DEST"
elif [[ -e "$DEST" || -L "$DEST" ]]; then
  echo "⚠️  $DEST already exists and was not created by this installer." >&2
  echo "    Move or remove it, then run this again." >&2
  exit 1
fi

mkdir "$DEST"
# The marker goes first: if a link below fails, a rerun or --uninstall still recognises the directory.
echo "Created by $SRC/install-claude-code.sh. Remove with --uninstall." > "$DEST/$MARKER"
for f in "${SKILL_FILES[@]}"; do
  ln -s "$SKILL_SRC/$f" "$DEST/$f"
done

echo "✓ Installed: $DEST (${#SKILL_FILES[@]} files, linked to $SKILL_SRC)"
echo "  Restart Claude Code and type /llll to activate."
