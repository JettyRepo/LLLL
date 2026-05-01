#!/usr/bin/env bash
# LLLL installer for Claude Code
# Usage: ./install-claude-code.sh
#
# Creates a symlink ~/.claude/skills/llll → ~/.llll so Claude Code
# auto-discovers LLLL without coupling the install path to Claude Code.
#
# Assumes LLLL is already cloned at ~/.llll (the canonical install location).

set -euo pipefail

LLLL_HOME="$HOME/.llll"
SKILLS_DIR="$HOME/.claude/skills"
LINK="$SKILLS_DIR/llll"

if [[ ! -d "$LLLL_HOME" ]]; then
  echo "Error: ~/.llll not found. Clone LLLL first:" >&2
  echo "  git clone https://github.com/JettyRepo/LLLL.git ~/.llll" >&2
  exit 1
fi

mkdir -p "$SKILLS_DIR"

if [[ -e "$LINK" || -L "$LINK" ]]; then
  if [[ -L "$LINK" && "$(readlink "$LINK")" == "$LLLL_HOME" ]]; then
    echo "✓ Symlink already correct: $LINK → $LLLL_HOME"
    echo "  Restart Claude Code and type /llll to activate."
    exit 0
  fi
  echo "⚠️  $LINK already exists. Remove it first if you want to re-link:" >&2
  echo "    rm $LINK" >&2
  exit 1
fi

ln -s "$LLLL_HOME" "$LINK"
echo "✓ Linked: $LINK → $LLLL_HOME"
echo "  Restart Claude Code and type /llll to activate."
