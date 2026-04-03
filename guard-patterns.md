# LLLL Guard Patterns v5.0

Reference data for `/llll guard push` and `/llll guard release` commands.
Defines detection rules, severity classifications, and block triggers.

---

## 1. Severity Model

| Level | Meaning | Effect |
|-------|---------|--------|
| **HARD_BLOCK** | Must not leave the repository under any circumstances | Push/release blocked, no override allowed |
| **SOFT_BLOCK** | Should not leave without policy review or explicit justification | Push/release blocked, overridable with `/llll override` |
| **WARN** | Notable change that may need attention | Push/release proceeds, warning logged |
| **PASS** | No issues detected | Push/release proceeds |

---

## 2. Push Gate — HARD_BLOCK Triggers

These patterns in outgoing diffs trigger an automatic hard block. Scanned against added lines in the diff.

| Pattern ID | Regex / Heuristic | Description | Category |
|-----------|-------------------|-------------|----------|
| PG-H001 | `AKIA[0-9A-Z]{16}` | AWS Access Key ID | secret |
| PG-H002 | `sk-[a-zA-Z0-9]{20,}` | OpenAI / Stripe secret key | secret |
| PG-H003 | `ghp_[a-zA-Z0-9]{36}` | GitHub personal access token | secret |
| PG-H004 | `gho_[a-zA-Z0-9]{36}` | GitHub OAuth access token | secret |
| PG-H005 | `-----BEGIN (RSA\|DSA\|EC\|OPENSSH) PRIVATE KEY-----` | Private key material | secret |
| PG-H006 | `(?i)(api[_-]?key\|api[_-]?secret\|access[_-]?key)\s*[=:]\s*['"][A-Za-z0-9+/=]{16,}['"]` | Hardcoded API key assignment | secret |
| PG-H007 | `(?i)(password\|passwd\|pwd)\s*[=:]\s*['"][^'"]{8,}['"]` | Hardcoded password (>8 chars) | secret |
| PG-H008 | `(?i)(database_url\|db_password\|db_pass\|mongo_uri\|redis_url)\s*[=:]\s*['"][^'"]+['"]` | Database credential | secret |
| PG-H009 | `(?i)bearer\s+[A-Za-z0-9\-._~+/]+=*` | Hardcoded bearer token | secret |
| PG-H010 | New or modified `.env` file (not `.env.example`, `.env.template`, `.env.sample`) | Environment file with potential secrets | secret |
| PG-H011 | Files matching `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*`, `id_ed25519*` | Private key files | secret |
| PG-H012 | `\d{3}-\d{2}-\d{4}` | Social Security Number pattern | data |
| PG-H013 | `\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}` | Credit card number pattern | data |
| PG-H014 | Files matching `*Competitive_Analysis*`, `*Full_Analysis*`, `AGENT_PROMPT_*`, `MCP_analysis*` | Internal/competitive analysis files — must never be committed | internal |

---

## 3. Push Gate — SOFT_BLOCK Triggers

These patterns suggest compliance-relevant changes that should be reviewed before pushing.

| Pattern ID | Heuristic | Description | Category | Maps to Domain |
|-----------|-----------|-------------|----------|----------------|
| PG-S001 | New file upload endpoint, multipart handler, `multer`, `formidable`, `busboy` | Upload capability added without policy review | feature | G |
| PG-S002 | New payment/billing/subscription code, `stripe`, `paypal`, `braintree`, pricing logic | Payment feature added without compliance review | feature | F |
| PG-S003 | Age verification, minor/child references, `coppa`, `age_gate`, `parental_consent` | Minors-related feature | feature | M |
| PG-S004 | New AI/ML model integration, LLM API call, `openai`, `anthropic`, `langchain`, model inference | AI feature added without transparency review | feature | I, J, K |
| PG-S005 | New tracking/analytics/telemetry, `mixpanel`, `segment`, `amplitude`, `ga4`, pixel tracking | User tracking added without privacy review | feature | D |
| PG-S006 | Geolocation/GPS/location access, `navigator.geolocation`, location permissions | Location data access without privacy review | feature | D |
| PG-S007 | Biometric/facial recognition/fingerprint, `faceapi`, `fingerprint`, biometric auth | Biometric feature without policy review | feature | M |
| PG-S008 | Profiling/scoring/ranking algorithm, credit scoring, risk assessment, eligibility logic | Automated decision without review | feature | J |
| PG-S009 | New AGPL/GPL dependency added to package.json, requirements.txt, Cargo.toml, go.mod | Copyleft license risk introduced | license | O |
| PG-S010 | Data retention changes, `TTL`, `expiry`, `retention`, `purge`, `delete_after` | Data lifecycle change without privacy review | feature | D |

---

## 4. Push Gate — WARN Triggers

| Pattern ID | Heuristic | Description | Category |
|-----------|-----------|-------------|----------|
| PG-W001 | `TODO\|FIXME\|HACK\|XXX\|TEMP` in newly added lines | Unresolved markers in outgoing code | hygiene |
| PG-W002 | `console\.log\|console\.debug\|print(\|debugger;` in production code (not test files) | Debug output in production code | hygiene |
| PG-W003 | New dependency added to manifest (package.json, requirements.txt, etc.) | New dependency — review for license and security | dependency |

---

## 5. Release Gate — HARD_BLOCK Triggers

Patterns in release artifacts (npm pack output, dist directory) that must never be published.

| Pattern ID | Pattern | Description | Category |
|-----------|---------|-------------|----------|
| RG-H001 | `.env` file in release artifact | Secrets in release package | secret |
| RG-H002 | `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*` in release | Private keys in release package | secret |
| RG-H003 | Files matching secret patterns (PG-H001 through PG-H009) in release content | Embedded secrets in release artifacts | secret |
| RG-H004 | `*.map` files in release artifact | Source maps expose original source code | leakage |
| RG-H005 | Source map files with `sourcesContent` field populated | Full source code embedded in source maps | leakage |
| RG-H006 | References to private archives, internal buckets (`s3://`, `gs://`, internal URLs) in release | Internal infrastructure references exposed | leakage |

---

## 6. Release Gate — SOFT_BLOCK Triggers

| Pattern ID | Pattern | Description | Category |
|-----------|---------|-------------|----------|
| RG-S001 | `src/` directory in release artifact | Source code included in production package | leakage |
| RG-S002 | `test/`, `tests/`, `__tests__/`, `spec/`, `*.test.*`, `*.spec.*` in release | Test files included in release | leakage |
| RG-S003 | `internal/`, `private/` directories in release | Internal assets exposed in release | leakage |
| RG-S004 | `prompts/`, `*.prompt`, `SKILL.md`, `system-prompt*` in release | Prompt files or skill definitions in release | leakage |
| RG-S005 | `tools/`, `scripts/`, `Makefile`, `Taskfile*` in release | Development tooling in release package | leakage |
| RG-S006 | No `.npmignore` AND no `"files"` field in package.json | No release whitelist policy — everything included by default | policy |
| RG-S007 | Release artifact total size > 10MB without justification | Unusually large package — may include unintended files | policy |

---

## 7. Exclusions

Files and directories excluded from guard scanning by default:

### Push Gate Exclusions
- `*.md` (documentation changes)
- `*.txt` (plain text)
- `*.lock`, `*.sum`, `yarn.lock`, `package-lock.json` (lock files)
- `CHANGELOG*`, `CHANGES*`, `HISTORY*`
- `LICENSE*`

### Release Gate Exclusions
- `node_modules/` (never scanned — should never be in release)
- `.git/`

### User-Defined Exclusions
Users can create a `.guardignore` file (gitignore-style syntax) to exclude additional files from scanning.

---

## 8. Guard Domain Mapping

When LLLL Guard identifies SOFT_BLOCK findings, it maps them to LLLL compliance domains for deeper analysis:

| Guard Finding | Recommended LLLL Command | Triggered Domain |
|--------------|--------------------------|------------------|
| PG-S001 (uploads) | `/llll diff` | Domain G (UGC) |
| PG-S002 (payments) | `/llll diff` | Domain F (Payments) |
| PG-S003 (minors) | `/llll deep` | Domain M (Sensitive Sector) |
| PG-S004 (AI) | `/llll diff` | Domains I, J, K (AI) |
| PG-S005 (tracking) | `/llll diff` | Domain D (Privacy) |
| PG-S006 (location) | `/llll diff` | Domain D (Privacy) |
| PG-S007 (biometric) | `/llll deep` | Domain M (Sensitive Sector) |
| PG-S008 (profiling) | `/llll diff` | Domain J (Automated Decisions) |
| PG-S009 (copyleft) | `/llll scan` | Domain O (Licensing) |
| PG-S010 (retention) | `/llll diff` | Domain D (Privacy) |

---

## 9. Override Rules

### HARD_BLOCK
- Cannot be overridden
- Push/release must not proceed
- User must fix the finding before retrying

### SOFT_BLOCK
- Can be overridden with `/llll override`
- Override requires:
  - Finding ID(s)
  - Justification text
  - Actor (auto-detected from git config or config.json)
  - Timestamp (auto-generated)
- Override is logged to `.llll/logs/guard-log.jsonl`

### Override Log Format

```json
{
  "timestamp": "2026-04-01T12:00:00Z",
  "action": "override",
  "finding_ids": ["PG-S002"],
  "actor": "user@example.com",
  "justification": "Payment feature reviewed by compliance team in ticket COMP-123",
  "files_affected": ["src/billing/checkout.ts"],
  "verdict_before": "SOFT_BLOCK",
  "verdict_after": "PASS (overridden)"
}
```

---

## 10. Output Structure

### Guard Verdict Header

```
┌────────────────────────────────────────┐
│ LLLL Guard — Push Gate                 │
│ Result: HARD_BLOCK                     │
│ Findings: 2 HARD_BLOCK, 1 WARN        │
│ Scanned: 3 commits, 12 files changed  │
└────────────────────────────────────────┘
```

### Finding Format

```
[PG-H001] AWS Access Key Detected — HARD_BLOCK
  File: src/config/aws.ts:42
  Match: AKIA...EXAMPLE (redacted)
  Category: secret
  Action: Remove the key, use environment variable instead
  Fix: /llll fix PG-H001
```

### JSON Output (for CI)

```json
{
  "gate": "push",
  "verdict": "HARD_BLOCK",
  "timestamp": "2026-04-01T12:00:00Z",
  "scanned_commits": 3,
  "scanned_files": 12,
  "findings": [
    {
      "id": "PG-H001",
      "severity": "HARD_BLOCK",
      "title": "AWS Access Key Detected",
      "file": "src/config/aws.ts",
      "line": 42,
      "category": "secret",
      "action": "Remove the key, use environment variable"
    }
  ],
  "overrides": []
}
```
