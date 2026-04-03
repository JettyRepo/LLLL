#!/bin/bash
# LLLL Integrity Check — run after any content changes
# Exit on first failure
set -e

cd "$(dirname "$0")"
echo "=== LLLL Integrity Check ==="

# Domain count (A-O = 15)
DOMAINS=$(grep -c "^## [A-O]\." compliance-checklist-master.md)
test "$DOMAINS" -eq 15 && echo "PASS: $DOMAINS domains (A-O)" || { echo "FAIL: $DOMAINS domains (expected 15)"; exit 1; }

# Check count (>=51)
CHECKS=$(grep -c "^### [A-O][0-9]" compliance-checklist-master.md)
test "$CHECKS" -ge 51 && echo "PASS: $CHECKS checks (expected >=51)" || { echo "FAIL: $CHECKS checks (expected >=51)"; exit 1; }

# All domain letters present
for letter in A B C D E F G H I J K L M N O; do
  grep -q "^## ${letter}\." compliance-checklist-master.md && echo "PASS: Domain $letter" || { echo "FAIL: Domain $letter missing"; exit 1; }
done

# Section numbering (8-13)
for i in 8 9 10 11 12 13; do
  grep -q "^# ${i}\." compliance-checklist-master.md && echo "PASS: Section $i" || { echo "FAIL: Section $i missing"; exit 1; }
done

# Key files exist
for f in SKILL.md compliance-checklist-master.md checklist-schema.md output-templates.md examples.md scan-patterns.md guard-patterns.md; do
  test -f "$f" && echo "PASS: $f exists" || { echo "FAIL: $f missing"; exit 1; }
done

# Guard CLI exists
test -d "llll-guard/src" && echo "PASS: llll-guard/ exists" || { echo "FAIL: llll-guard/ missing"; exit 1; }

# SKILL.md key concepts
grep -q "Layer 0" SKILL.md && echo "PASS: Layer 0 in SKILL.md" || { echo "FAIL: Layer 0 missing"; exit 1; }
grep -q "Foundation Alert" SKILL.md && echo "PASS: Foundation Alert" || { echo "FAIL: Foundation Alert missing"; exit 1; }
grep -q "/llll scan" SKILL.md && echo "PASS: /llll scan command" || { echo "FAIL: /llll scan missing"; exit 1; }
grep -q "/llll guard" SKILL.md && echo "PASS: /llll guard command" || { echo "FAIL: /llll guard missing"; exit 1; }
grep -q "/llll review" SKILL.md && echo "PASS: /llll review command" || { echo "FAIL: /llll review missing"; exit 1; }

# No internal files accidentally tracked
LEAKED=$(git ls-files | grep -iE "(Competitive_Analysis|Full_Analysis|AGENT_PROMPT|MCP_analysis)" || true)
if [ -z "$LEAKED" ]; then
  echo "PASS: No internal files in git"
else
  echo "FAIL: Internal files tracked in git: $LEAKED"
  exit 1
fi

echo "=== All checks passed ==="
