#!/bin/bash
# LLLL Integrity Check — run after any content changes
# Exit on first failure
set -e

cd "$(dirname "$0")"
echo "=== LLLL Integrity Check ==="

# The skill files live in the Claude plugin folder; S is the path to them from the repository root.
S="plugins/llll/skills/llll"

# The skill is SKILL.md plus the reference files it tells the model to read. Content checks look at all of them.
SKILL_FILES="SKILL.md mode-scan.md mode-guard-review.md menus.md output-standards.md observation-storage.md"
SKILL_ALL=$(mktemp)
trap 'rm -f "$SKILL_ALL"' EXIT
for f in $SKILL_FILES; do
  test -f "$S/$f" && cat "$S/$f" >> "$SKILL_ALL" || { echo "FAIL: $S/$f missing"; exit 1; }
done

# SKILL.md must stay a core file, and every reference file must be named in it (or it would never be read)
test "$(wc -l < "$S/SKILL.md")" -lt 1000 && echo "PASS: SKILL.md stays under 1000 lines" || { echo "FAIL: SKILL.md grew past 1000 lines; move detail into a reference file"; exit 1; }
for f in $SKILL_FILES; do
  [ "$f" = "SKILL.md" ] && continue
  grep -q "\`$f\`" "$S/SKILL.md" && echo "PASS: SKILL.md tells the model when to read $f" || { echo "FAIL: SKILL.md never mentions $f"; exit 1; }
done

# Domain count (A-O = 15)
DOMAINS=$(grep -c "^## [A-O]\." "$S/compliance-checklist-master.md" || true)
test "$DOMAINS" -eq 15 && echo "PASS: $DOMAINS domains (A-O)" || { echo "FAIL: $DOMAINS domains (expected 15)"; exit 1; }

# Check count (>=51)
CHECKS=$(grep -c "^### [A-O][0-9]" "$S/compliance-checklist-master.md" || true)
test "$CHECKS" -ge 51 && echo "PASS: $CHECKS checks (expected >=51)" || { echo "FAIL: $CHECKS checks (expected >=51)"; exit 1; }

# All domain letters present
for letter in A B C D E F G H I J K L M N O; do
  grep -q "^## ${letter}\." "$S/compliance-checklist-master.md" && echo "PASS: Domain $letter" || { echo "FAIL: Domain $letter missing"; exit 1; }
done

# Section numbering (8-13)
for i in 8 9 10 11 12 13; do
  grep -q "^# ${i}\." "$S/compliance-checklist-master.md" && echo "PASS: Section $i" || { echo "FAIL: Section $i missing"; exit 1; }
done

# Key files exist
for f in SKILL.md compliance-checklist-master.md checklist-schema.md output-templates.md examples.md scan-patterns.md guard-patterns.md; do
  test -f "$S/$f" && echo "PASS: $f exists" || { echo "FAIL: $S/$f missing"; exit 1; }
done

# Guard engine and launcher exist, and the shell scripts parse (the launcher under the system bash, 3.2 on macOS)
test -d "llll-guard/src" && echo "PASS: llll-guard/ exists" || { echo "FAIL: llll-guard/ missing"; exit 1; }
grep -q "LLLL-GUARD-SHIM" guard && echo "PASS: guard is the thin launcher" || { echo "FAIL: guard is not the launcher"; exit 1; }
for script in guard install-claude-code.sh install-opencode.sh install-codex.sh verify.sh; do
  /bin/bash -n "$script" && echo "PASS: $script parses" || { echo "FAIL: $script has a syntax error"; exit 1; }
done
test "$(wc -l < guard)" -lt 250 && echo "PASS: guard stays a launcher (no rules in it)" || { echo "FAIL: guard has grown past a launcher; rules belong in llll-guard/"; exit 1; }

# SKILL.md key concepts
grep -q "Layer 0" "$SKILL_ALL" && echo "PASS: Layer 0 in SKILL.md" || { echo "FAIL: Layer 0 missing"; exit 1; }
grep -q "Foundation Alert" "$SKILL_ALL" && echo "PASS: Foundation Alert" || { echo "FAIL: Foundation Alert missing"; exit 1; }
grep -q "/llll scan" "$SKILL_ALL" && echo "PASS: /llll scan command" || { echo "FAIL: /llll scan missing"; exit 1; }
grep -q "/llll guard" "$SKILL_ALL" && echo "PASS: /llll guard command" || { echo "FAIL: /llll guard missing"; exit 1; }
grep -q "/llll review" "$SKILL_ALL" && echo "PASS: /llll review command" || { echo "FAIL: /llll review missing"; exit 1; }
grep -q "OBSERVATION STORAGE" "$SKILL_ALL" && echo "PASS: Observation Storage section" || { echo "FAIL: Observation Storage section missing"; exit 1; }
grep -q "LLLL does not save" "$SKILL_ALL" && echo "PASS: No-auto-save policy declared" || { echo "FAIL: No-auto-save policy missing"; exit 1; }
grep -q "\.llll/scratch" "$SKILL_ALL" && echo "PASS: Scratch directory documented" || { echo "FAIL: Scratch directory missing"; exit 1; }
grep -q "DO_NOT_UPLOAD" "$SKILL_ALL" && echo "PASS: Do-not-upload marker documented" || { echo "FAIL: Do-not-upload marker missing"; exit 1; }
grep -qE "MCP" "$SKILL_ALL" && grep -qE "Pro.*Team|Team.*Pro" "$SKILL_ALL" && echo "PASS: Pro/Team MCP roadmap documented" || { echo "FAIL: Pro/Team MCP roadmap missing"; exit 1; }
grep -q "mtime +90" "$SKILL_ALL" && echo "PASS: Cleanup reminder (90-day) documented" || { echo "FAIL: Cleanup reminder missing"; exit 1; }
grep -qE "append \`-S\`|\`-S\` flag|pre-save gates verify" "$SKILL_ALL" && { echo "FAIL: -S flag reference still present"; exit 1; } || echo "PASS: -S flag fully removed"
grep -q "auditable history" "$SKILL_ALL" && { echo "FAIL: 'auditable history' language still present"; exit 1; } || echo "PASS: Overclaim language removed"
grep -q "ephemeral" "$SKILL_ALL" && echo "PASS: Ephemeral language present" || { echo "FAIL: Ephemeral language missing"; exit 1; }
TOOLS=$(grep -m1 "^allowed-tools:" "$S/SKILL.md")
case "$TOOLS" in
  *" Write"*|*" Edit"*) echo "FAIL: allowed-tools lists Write or Edit"; exit 1 ;;
esac
case "$TOOLS" in
  *"Bash,"*|*"Bash") echo "FAIL: allowed-tools has an unrestricted Bash"; exit 1 ;;
esac
case "$TOOLS" in
  "allowed-tools: Read, Grep, Glob, "*"Bash(llll-guard push:*)"*"Bash(llll-guard release:*)"*) echo "PASS: allowed-tools has no Write/Edit, Bash is restricted, the guard engine push and release are reachable" ;;
  *) echo "FAIL: allowed-tools must start 'Read, Grep, Glob' and include Bash(llll-guard push:*) and Bash(llll-guard release:*)"; exit 1 ;;
esac
grep -q "data controller" "$SKILL_ALL" && echo "PASS: Personal data / data-controller warning (H1)" || { echo "FAIL: H1 personal data warning missing"; exit 1; }
grep -q "GDPR Art" "$SKILL_ALL" && echo "PASS: GDPR articles cited (H1)" || { echo "FAIL: H1 GDPR citations missing"; exit 1; }
grep -q "Gitignore integrity check" "$SKILL_ALL" && echo "PASS: Runtime gitignore check documented (H2)" || { echo "FAIL: H2 gitignore check missing"; exit 1; }
grep -q "git check-ignore -q \.llll/" "$SKILL_ALL" && echo "PASS: Gitignore check command specified (H2)" || { echo "FAIL: H2 check command missing"; exit 1; }
grep -q "GITIGNORE_MISSING" "$SKILL_ALL" && echo "PASS: Gitignore warning render flag (H2)" || { echo "FAIL: H2 render flag missing"; exit 1; }

# One version for the document set: VERSION, and the heading of every reference file
VERSION_NOW=$(tr -d '[:space:]' < VERSION)
for f in $SKILL_FILES scan-patterns.md guard-patterns.md output-templates.md compliance-checklist-master.md examples.md checklist-schema.md; do
  head -n 8 "$S/$f" | grep -q "v${VERSION_NOW}\b" && echo "PASS: $f is v${VERSION_NOW}" || { echo "FAIL: $f does not say v${VERSION_NOW} (VERSION file) near the top"; exit 1; }
done
grep -q "Embedded Compliance Layer v${VERSION_NOW}" "$S/SKILL.md" && echo "PASS: install-codex.sh will read v${VERSION_NOW} from SKILL.md" || { echo "FAIL: SKILL.md title version differs from VERSION"; exit 1; }

# The Claude plugin: its version follows VERSION, the copied LICENSE matches the original, and the icon exists
PLUGIN_VERSION=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' plugins/llll/.claude-plugin/plugin.json | head -1)
case "$PLUGIN_VERSION" in
  "$VERSION_NOW"|"$VERSION_NOW".*) echo "PASS: plugin.json version $PLUGIN_VERSION follows VERSION $VERSION_NOW" ;;
  *) echo "FAIL: plugin.json version '$PLUGIN_VERSION' does not start with VERSION $VERSION_NOW"; exit 1 ;;
esac
cmp -s LICENSE plugins/llll/LICENSE && echo "PASS: plugins/llll/LICENSE matches LICENSE" || { echo "FAIL: plugins/llll/LICENSE differs from LICENSE (copy it again)"; exit 1; }
cmp -s LLLL.svg plugins/llll/icon.svg && echo "PASS: plugins/llll/icon.svg matches LLLL.svg" || { echo "FAIL: plugins/llll/icon.svg differs from LLLL.svg (plugin.json names it as the icon; copy it again)"; exit 1; }

# The command prefix rule for plugin installs is present, so menus stay correct when invoked as /llll:llll
grep -q "/llll:llll" plugins/llll/skills/llll/menus.md && grep -q "/llll:llll" plugins/llll/skills/llll/SKILL.md && echo "PASS: command prefix rule (/llll:llll) is in SKILL.md and menus.md" || { echo "FAIL: command prefix rule for plugin installs is missing"; exit 1; }

# pip-audit may only run without installing anything
grep -q "pip-audit --no-deps" plugins/llll/skills/llll/mode-scan.md && grep -q "Bash(pip-audit --no-deps -r:\*)" plugins/llll/skills/llll/SKILL.md && echo "PASS: pip-audit is pre-approved only with --no-deps" || { echo "FAIL: pip-audit must be pre-approved only as 'pip-audit --no-deps -r'"; exit 1; }
if grep -q "Bash(pip-audit -r:" plugins/llll/skills/llll/SKILL.md; then echo "FAIL: allowed-tools still pre-approves pip-audit without --no-deps"; exit 1; fi

# Rule ids: guard-patterns.md, taxonomy and the engine name the same rules (needs llll-guard dependencies)
if [ -d llll-guard/node_modules ]; then
  (cd llll-guard && npx vitest run tests/rule-docs-sync.test.ts >/dev/null 2>&1) && echo "PASS: rule ids in sync with the engine" || { echo "FAIL: rule ids out of sync (run: cd llll-guard && npx vitest run tests/rule-docs-sync.test.ts)"; exit 1; }
else
  echo "SKIP: rule id sync (run npm ci in llll-guard/ to enable)"
fi

# No internal files accidentally tracked
LEAKED=$(git ls-files | grep -iE "(Competitive_Analysis|Full_Analysis|AGENT_PROMPT|MCP_analysis)" || true)
if [ -z "$LEAKED" ]; then
  echo "PASS: No internal files in git"
else
  echo "FAIL: Internal files tracked in git: $LEAKED"
  exit 1
fi

echo "=== All checks passed ==="
