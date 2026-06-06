#!/bin/bash
# Pre-deploy verification for layrix.ai (paper/serif edition · 2026-05-11)
# Run from repo root: bash site/verify-deploy.sh

FAIL=0

echo "=== Theme Consistency (paper/serif tokens per page) ==="
# Pages either inline a <style> with --paper or load site-shared.css; check for that + marq- class usage + Caerus footer.
# Skip standalone iframe widgets that intentionally use their own art direction.
SKIP_THEMING="site/llll/demo.html site/academy/demo.html"
PAGES=$(find site -type f -name "*.html" | sort)
for f in $PAGES; do
  if echo "$SKIP_THEMING" | grep -qF "$f"; then
    echo "SKIP: $f (standalone iframe widget — own theme by design)"
    continue
  fi
  has_paper=$(grep -cE -- '--paper|site-shared\.css' "$f")
  has_marq=$(grep -cE 'marq-link|marq-cta|marq-kicker|marq-prose' "$f")
  has_fraunces=$(grep -c 'Fraunces' "$f")
  has_caerus=$(grep -c 'Caerus' "$f")
  total=$((has_paper + has_marq + has_fraunces + has_caerus))
  if [ "$total" -lt 4 ]; then
    echo "FAIL: $f — paper:$has_paper marq:$has_marq fraunces:$has_fraunces caerus:$has_caerus (need 4+, one of each)"
    FAIL=1
  else
    echo "OK: $f — paper:$has_paper marq:$has_marq fraunces:$has_fraunces caerus:$has_caerus"
  fi
done

echo ""
echo "=== Required Shared Assets ==="
for asset in site/site-shared.css site/site-chrome.jsx site/legal-shared.jsx; do
  if [ ! -f "$asset" ]; then
    echo "FAIL: missing $asset"
    FAIL=1
  else
    echo "OK: $asset"
  fi
done

echo ""
echo "=== Inter-page Links Are Deploy-Path Style ==="
# No filename-style hrefs (Layrix Homepage.html, LLLL.html, AIGP.html, etc.) should remain
BAD=$(grep -rEho 'href="[^"]*\.html"' site/ --include="*.html" --include="*.jsx" | grep -vE '^href="https?:' | grep -vE '^href="#' | sort -u || true)
if [ -n "$BAD" ]; then
  echo "FAIL: filename-style hrefs found (should be /llll/, /academy/, /terms etc.):"
  echo "$BAD"
  FAIL=1
else
  echo "OK: no leftover .html-suffix internal hrefs"
fi

echo ""
echo "=== Footer Verification (live site) ==="
for page in "/" "/terms" "/privacy" "/acceptable-use" "/register"; do
  body=$(curl -sL "https://layrix.ai${page}" 2>/dev/null)
  missing=""
  for term in "Caerus Enterprises" "Terms" "Privacy" "Acceptable Use"; do
    if ! echo "$body" | grep -q "$term"; then
      missing="${missing} '${term}'"
    fi
  done
  if [ -n "$missing" ]; then
    echo "FAIL: ${page} missing:${missing}"
    FAIL=1
  else
    echo "OK: ${page}"
  fi
done

echo ""
echo "=== WCAG Contrast (paper palette) ==="
python3 -c "
def lum(r,g,b):
    rs,gs,bs=[x/255 for x in(r,g,b)]
    def l(c):return c/12.92 if c<=0.04045 else((c+.055)/1.055)**2.4
    return .2126*l(rs)+.7152*l(gs)+.0722*l(bs)
def cr(l1,l2):return(max(l1,l2)+.05)/(min(l1,l2)+.05)
# paper #f1efe7, ink #161614, accent #2f6f4a, muted rgba(22,22,20,0.62) -> on paper ~ #5e5d5b
paper = lum(0xf1,0xef,0xe7)
ink   = lum(0x16,0x16,0x14)
acc   = lum(0x2f,0x6f,0x4a)
muted = lum(0x5e,0x5d,0x5b)  # rgba(22,22,20,0.62) over paper
fail=False
for n,a,b in [('Ink on paper',ink,paper),('Accent on paper',acc,paper),('Muted on paper',muted,paper),('Paper on ink',paper,ink)]:
    r=cr(a,b)
    ok='PASS' if r>=4.5 else 'FAIL'
    if ok=='FAIL': fail=True
    print(f'{r:.1f}:1 {ok} {n}')
import sys
if fail: sys.exit(1)
" || FAIL=1

echo ""
echo "=== Internal Documents (must not be tracked by git) ==="
for pattern in "Competitive_Analysis" "Full_Analysis" "AGENT_PROMPT" "MCP_analysis" "Business_Plan"; do
  found=$(git ls-files 2>/dev/null | grep -i "$pattern" || true)
  if [ -n "$found" ]; then
    echo "FAIL: Internal document tracked by git: $found"
    FAIL=1
  fi
done
if ! git ls-files 2>/dev/null | grep -qiE "Competitive_Analysis|Full_Analysis|AGENT_PROMPT|MCP_analysis|Business_Plan"; then
  echo "OK: No internal documents tracked by git"
fi

echo ""
if [ "$FAIL" -eq 1 ]; then
  echo "DEPLOY BLOCKED — fix issues above"
  exit 1
else
  echo "ALL CHECKS PASSED — safe to deploy"
fi
