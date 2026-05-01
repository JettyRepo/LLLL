#!/usr/bin/env bash
# LLLL installer for opencode
# Usage: ./install-opencode.sh [--merge]
#
# Copies LLLL data files to ~/.llll/opencode/ and creates (or merges into)
# ~/.config/opencode/config.json with the LLLL agent and /llll command.
# If the config already exists, prints the snippet to merge manually (or use --merge
# to attempt an automatic merge with jq).

set -euo pipefail

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$HOME/.llll/opencode"
CONFIG="$HOME/.config/opencode/config.json"
MERGE=0
[[ "${1:-}" == "--merge" ]] && MERGE=1

# Copy data files to dedicated opencode directory
mkdir -p "$DATA_DIR"
cp "$INSTALL_DIR/SKILL.md"                       "$DATA_DIR/SKILL.md"
cp "$INSTALL_DIR/compliance-checklist-master.md" "$DATA_DIR/checklist.md"
cp "$INSTALL_DIR/scan-patterns.md"               "$DATA_DIR/scan-patterns.md"
cp "$INSTALL_DIR/guard-patterns.md"              "$DATA_DIR/guard-patterns.md"
echo "✓ Data files copied to $DATA_DIR"

AGENT_BLOCK=$(cat << EOF
{
  "description": "LLLL Compliance Engine — read-only, no writes",
  "mode": "subagent",
  "model": "anthropic/claude-sonnet-4-6",
  "tools": { "read": true, "bash": true, "write": false, "edit": false }
}
EOF
)

COMMAND_BLOCK=$(cat << EOF
{
  "description": "LLLL — /llll [deep|checklist|brief|diff|scan|fix|grc|review|guard push|guard release]",
  "template": "{file:${DATA_DIR}/SKILL.md}\n\nActivate LLLL. User invoked: /llll \$ARGUMENTS\n\nDispatch to the correct mode based on the first word of the arguments:\n- (empty) → Diagnosis\n- deep → Deep Analysis\n- checklist → Checklist\n- brief → Expert Handoff Brief\n- diff → Feature vs Policy Coverage\n- scan → Automated Security Scan\n- fix [ID] → Fix mode\n- grc → GRC Dashboard\n- review → Human Expert Escalation\n- guard push → Pre-push compliance gate\n- guard release → Pre-release artifact scan\n- override [ID] [justification] → Override SOFT_BLOCK\n\nCompliance data:\n- Checklist: ${DATA_DIR}/checklist.md\n- Scan patterns: ${DATA_DIR}/scan-patterns.md\n- Guard patterns: ${DATA_DIR}/guard-patterns.md",
  "agent": "llll",
  "subtask": true
}
EOF
)

mkdir -p "$(dirname "$CONFIG")"

# --- Fresh install ---------------------------------------------------------
if [[ ! -f "$CONFIG" ]]; then
  cat > "$CONFIG" << JSONEOF
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
  echo "✓ Created $CONFIG"
  echo "  Restart opencode and type /llll to activate."
  exit 0
fi

# --- Existing config: try jq merge ----------------------------------------
if [[ $MERGE -eq 1 ]]; then
  if ! command -v jq >/dev/null 2>&1; then
    echo "Error: --merge requires jq. Install with: brew install jq" >&2
    exit 1
  fi
  BACKUP="${CONFIG}.bak.$(date +%s)"
  cp "$CONFIG" "$BACKUP"
  echo "Backed up existing config to $BACKUP"
  jq --argjson agent "$AGENT_BLOCK" \
     --argjson cmd "$COMMAND_BLOCK" \
     '.agent.llll = $agent | .command.llll = $cmd' \
     "$BACKUP" > "$CONFIG"
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
