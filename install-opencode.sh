#!/usr/bin/env bash
# LLLL installer for opencode
# Usage: ./install-opencode.sh [--merge | --uninstall]
#
# Copies LLLL data files to ~/.local/share/llll/opencode/ (outside the clone, so `git clean` or
# re-cloning cannot remove them) and creates (or merges into) ~/.config/opencode/config.json with
# the LLLL agent and /llll command. If the config already exists, prints the snippet to merge by
# hand, or use --merge to merge it with jq. The existing config is backed up first and is never
# truncated before the new content is ready.
#
# The agent can read and run shell commands (it needs bash for `llll-guard`); it cannot write or edit.

set -euo pipefail

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/llll/opencode"
CONFIG="$HOME/.config/opencode/config.json"
MODE="install"

case "${1:-}" in
  "") ;;
  --merge) MODE="merge" ;;
  --uninstall) MODE="uninstall" ;;
  *) echo "Usage: $0 [--merge | --uninstall]" >&2; exit 2 ;;
esac

# Writes the jq result over the config only if it is a non-empty JSON object (jq prints nothing and
# exits 0 for an empty input). Writes through the file, so a symlinked config stays a symlink.
apply_jq() {
  local backup="$1" tmp
  shift
  tmp="$(mktemp "${CONFIG}.XXXXXX")"
  if jq "$@" "$backup" > "$tmp" && [[ -s "$tmp" ]] && jq -e 'type == "object"' "$tmp" >/dev/null 2>&1; then
    cat "$tmp" > "$CONFIG"
    rm -f "$tmp"
  else
    rm -f "$tmp"
    echo "Error: could not edit $CONFIG (empty, or not valid JSON?). It is unchanged." >&2
    exit 1
  fi
}

if [[ "$MODE" == "uninstall" ]]; then
  # Config first, data last: a failed config edit must not leave the command pointing at deleted files.
  if [[ -f "$CONFIG" ]]; then
    if ! command -v jq >/dev/null 2>&1; then
      echo "Remove the \"llll\" entries under \"agent\" and \"command\" in $CONFIG by hand (jq is not installed). Nothing was removed." >&2
      exit 1
    fi
    BACKUP="${CONFIG}.bak.$(date +%s)"
    cp "$CONFIG" "$BACKUP"
    apply_jq "$BACKUP" 'del(.agent.llll) | del(.command.llll)'
    echo "✓ Removed the llll agent and command from $CONFIG (backup: $BACKUP)"
  fi
  rm -rf "$DATA_DIR"
  echo "✓ Removed $DATA_DIR"
  exit 0
fi

mkdir -p "$DATA_DIR"
cp "$INSTALL_DIR/SKILL.md"                       "$DATA_DIR/SKILL.md"
cp "$INSTALL_DIR/compliance-checklist-master.md" "$DATA_DIR/checklist.md"
cp "$INSTALL_DIR/scan-patterns.md"               "$DATA_DIR/scan-patterns.md"
cp "$INSTALL_DIR/guard-patterns.md"              "$DATA_DIR/guard-patterns.md"
# The skill's reference files keep their names: SKILL.md names them, and the model reads them from here.
for f in mode-scan.md mode-guard-review.md menus.md output-standards.md observation-storage.md; do
  cp "$INSTALL_DIR/$f" "$DATA_DIR/$f"
done
echo "✓ Data files copied to $DATA_DIR"

AGENT_BLOCK=$(cat << EOF
{
  "description": "LLLL Compliance Engine — analysis only: reads files and runs llll-guard, never writes or edits",
  "mode": "subagent",
  "model": "anthropic/claude-sonnet-4-6",
  "tools": { "read": true, "bash": true, "write": false, "edit": false }
}
EOF
)

COMMAND_BLOCK=$(cat << EOF
{
  "description": "LLLL — /llll [deep|checklist|brief|diff|scan|fix|grc|review|guard push|guard release]",
  "template": "{file:${DATA_DIR}/SKILL.md}\n\nActivate LLLL. User invoked: /llll \$ARGUMENTS\n\nDispatch to the correct mode based on the first word of the arguments:\n- (empty) → Diagnosis\n- deep → Deep Analysis\n- checklist → Checklist\n- brief → Expert Handoff Brief\n- diff → Feature vs Policy Coverage\n- scan → Automated Security Scan\n- fix [ID] → Fix mode\n- grc → GRC Dashboard\n- review → Human Expert Escalation\n- guard push → Pre-push compliance gate\n- guard release → Pre-release artifact scan\n- override [ID] [justification] → Override SOFT_BLOCK\n\nCompliance data:\n- Checklist: ${DATA_DIR}/checklist.md\n- Scan patterns: ${DATA_DIR}/scan-patterns.md\n- Guard patterns: ${DATA_DIR}/guard-patterns.md\n- Reference files named in SKILL.md (read them from this folder): ${DATA_DIR}/mode-scan.md, mode-guard-review.md, menus.md, output-standards.md, observation-storage.md",
  "agent": "llll",
  "subtask": true
}
EOF
)

mkdir -p "$(dirname "$CONFIG")"

# --- Fresh install ---------------------------------------------------------
if [[ ! -f "$CONFIG" ]]; then
  TMP="$(mktemp "${CONFIG}.XXXXXX")"
  cat > "$TMP" << JSONEOF
{
  "\$schema": "https://opencode.ai/config.json",
  "agent": {
    "llll": $AGENT_BLOCK
  },
  "command": {
    "llll": $COMMAND_BLOCK
  }
}
JSONEOF
  mv "$TMP" "$CONFIG"
  echo "✓ Created $CONFIG"
  echo "  Restart opencode and type /llll to activate."
  exit 0
fi

# --- Existing config: try jq merge ----------------------------------------
if [[ "$MODE" == "merge" ]]; then
  if ! command -v jq >/dev/null 2>&1; then
    echo "Error: --merge requires jq. Install with: brew install jq" >&2
    exit 1
  fi
  BACKUP="${CONFIG}.bak.$(date +%s)"
  cp "$CONFIG" "$BACKUP"
  echo "Backed up existing config to $BACKUP"
  apply_jq "$BACKUP" --argjson agent "$AGENT_BLOCK" --argjson cmd "$COMMAND_BLOCK" \
    '.agent.llll = $agent | .command.llll = $cmd'
  echo "✓ Merged LLLL agent and command into $CONFIG"
  echo "  Restart opencode and type /llll to activate."
  exit 0
fi

# --- Existing config: print manual snippet --------------------------------
echo "⚠️  $CONFIG already exists."
echo ""
echo "Add the following entries to your config manually,"
echo "or re-run with --merge (requires jq):"
echo ""
echo '  "agent": {'
echo "    \"llll\": $AGENT_BLOCK,"
echo '    ...existing agents...'
echo '  },'
echo ""
echo '  "command": {'
echo "    \"llll\": $COMMAND_BLOCK,"
echo '    ...existing commands...'
echo '  }'
echo ""
echo "Run with --merge to apply automatically: ./install-opencode.sh --merge"
echo "The LLLL agent and command are NOT registered yet."
exit 3
