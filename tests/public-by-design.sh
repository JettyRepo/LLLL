#!/usr/bin/env bash
# Regression tests for public_by_design_reason() in ../guard
#
# A credential a project ships on purpose (a scaffold's shared demo RPC
# endpoint, a client-bundled public key) must be reported but not blocked.
# A real leak must still block. All fixtures below are synthetic.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
# guard returns early when sourced, so this defines its functions and nothing else.
# shellcheck source=../guard
source ./guard

pass=0; fail=0

expect() {
  local want="$1" desc="$2" line="$3" file="$4" id="$5" got
  if public_by_design_reason "$line" "$file" "$id" >/dev/null 2>&1; then
    got="downgrade"
  else
    got="block"
  fi
  if [[ "$got" == "$want" ]]; then
    printf 'PASS  %-46s %s\n' "$desc" "$got"; pass=$((pass + 1))
  else
    printf 'FAIL  %-46s want=%s got=%s\n' "$desc" "$want" "$got"; fail=$((fail + 1))
  fi
}

# Published on purpose — must downgrade to WARN.
expect downgrade "NEXT_PUBLIC_ prefix" \
  'NEXT_PUBLIC_PROVIDER_URL=https://example.test/rpc/v0/PLACEHOLDERVALUE0001' \
  'packages/web/.env' PG-H006
expect downgrade "VITE_ prefix" \
  'VITE_ANALYTICS_KEY="PLACEHOLDERVALUE0002"' \
  'src/config.ts' PG-H006
expect downgrade "value sits in an env template" \
  'RPC_URL=https://example.test/rpc/v0/PLACEHOLDERVALUE0003' \
  'packages/api/.env.example' PG-H006

# Real leaks — must still block.
expect block "AWS key in application source" \
  'const key = "AKIAQQQQQQQQQQQQQQQQ";' \
  'src/config.js' PG-H001
expect block "private key material, even in a template" \
  '-----BEGIN RSA PRIVATE KEY-----' \
  'packages/api/.env.example' PG-H005

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[[ $fail -eq 0 ]]
