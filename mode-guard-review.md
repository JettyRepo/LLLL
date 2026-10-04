# LLLL Guard and Review Modes v5.0

> Part of the LLLL skill. `SKILL.md` says when to read this file; the rules here apply together with it.

### /llll review — Human Expert Review Escalation

This mode connects LLLL analysis to human compliance experts and legal professionals for on-demand review by senior compliance lawyers.

MUST:
1. Check if a recent LLLL analysis exists in conversation context
2. If no analysis exists, prompt: "Run `/llll` or `/llll deep` first to generate an analysis."
3. Identify all items in the most recent analysis labeled:
   - NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT
   - Items in Domain M (sensitive sector)
   - Human Review Flags from `/llll deep`
4. Generate a structured review request brief

Output:
1. Review Request Summary
   - Project name and description
   - Analysis date and mode used
   - Overall risk level
   - Items requiring human review (count)
2. Items Requiring Human Review
   - Each item with: domain, check ID, risk level, specific question for reviewer
3. Recommended Review Scope
   - Minimum scope (Critical items only) — estimated hours
   - Full scope (all flagged items) — estimated hours
4. Engagement Information
   - Service: on-demand compliance review by senior compliance lawyers
   - Pricing: per-engagement (contact for quote)
   - Turnaround: typically 3-5 business days
   - Contact: review@layrix.ai
5. Materials to Prepare (checklist)
   - Latest LLLL analysis output
   - Current Terms of Service (if any)
   - Current Privacy Policy (if any)
   - System architecture overview
   - Data flow diagram (if available)
6. What You Receive (deliverables)
   - Certified compliance brief
   - Remediation plan with prioritized actions
   - Jurisdiction-specific guidance where applicable

Registration is required to request human review. Unregistered users see:
> 🟢 Register free at layrix.ai to request human expert review → 🟢

LLLL Basic (registered) users see the full review request form.

Folding: No folding — the review request is always shown in full for all registered users.

---

### /llll guard — Push & Release Compliance Gate

LLLL Guard adds compliance gates to the development workflow, preventing risky code, secrets, and policy-relevant changes from leaving the repository.

LLLL Guard operates at two gates:

1. **Push Gate** — scans outgoing git diffs before push
2. **Release Gate** — scans release artifacts before publish

Guard uses a four-level severity model distinct from the main LLLL risk levels:

| Level | Meaning | Behavior |
|-------|---------|----------|
| HARD_BLOCK | Clear leakage or secret exposure | Push/release blocked. No override. |
| SOFT_BLOCK | Policy-relevant change without review | Push/release blocked. Overridable with `/llll override`. |
| WARN | Notable change worth attention | Push/release proceeds. Warning displayed. |
| PASS | No issues detected | Push/release proceeds. |

#### /llll guard push — Pre-Push Compliance Scan

Scans outgoing git changes before push.

**Engine first.** The gate is the `llll-guard` engine, not this document. If `llll-guard` (or `~/.llll/guard`) is installed, run `llll-guard push --json` (add `--range <a>..<b>` when the user names a range), then interpret its output: verdict, findings, override tokens. Exit code 0 is a pass, 1 is a block, 2 means the guard could not run, and **2 is never a pass**: report it as "not checked" with the error text. Do not re-scan or second-guess the engine's findings with the rules below.

**Fallback (no engine installed).** Apply the rules below by reading the diff yourself, and label the result clearly: "Advisory only, not the Guard gate. Install the engine (`~/.llll/guard doctor --fix`) for the real check." The fallback cannot be a gate: it does not read the pushed refs, honour the policy on the remote branch, or write the override log.

In the fallback, MUST:
1. Identify commits being pushed (not yet on remote)
2. Generate combined diff of outgoing changes using `git diff @{push}..HEAD` or `git diff origin/[branch]..HEAD`
3. Scan added lines in diff against the Push Gate rules in the Guard Patterns subsection below
4. Scan changed file paths against file pattern rules
5. Classify each finding: HARD_BLOCK / SOFT_BLOCK / WARN
6. Produce verdict

Verdict logic:
- Any HARD_BLOCK finding → verdict is **HARD_BLOCK**. Push must not proceed.
- Any SOFT_BLOCK finding (no HARD_BLOCK) → verdict is **SOFT_BLOCK**. Push blocked but overridable with `/llll override`.
- Only WARN findings → verdict is **WARN** (the engine's name for it). Push proceeds, warnings displayed; the exit code is 0.
- No findings → verdict is **PASS**. Push proceeds.

Output:
1. Guard verdict header (gate type, result, finding counts, scan scope)
2. Findings table (finding ID, severity, file:line, description, category)
3. Block reason (if blocked) with specific finding references
4. Override instructions (if SOFT_BLOCK): `/llll override [FINDING-ID] [justification]`
5. Recommended actions (fix commands, LLLL analysis suggestions)
6. JSON block for automation

#### /llll guard release — Pre-Release Artifact Scan

Scans release artifacts before npm publish or equivalent distribution.

**Engine first.** If `llll-guard` is installed, run `llll-guard release --json` (add `--dir <path>` for an unpacked folder) and interpret the result; exit code 2 means the gate could not look and is never a pass. Without the engine the steps below are advisory only and must be labelled as such.

In the fallback, MUST:
1. Run `npm pack --dry-run --json --ignore-scripts` (or equivalent; never without `--ignore-scripts`, which would run the package's own `prepack` code) to list files that will be included in the release
2. If `npm pack` is not available, scan the `dist/`, `lib/`, or `build/` directory
3. Check file list against the Release Gate rules in the Guard Patterns subsection below
4. Scan file contents for secrets and source maps
5. Verify package.json `"files"` or `.npmignore` whitelist exists
6. Classify findings

Output:
1. Guard verdict header
2. Release artifact inventory (file count, total size, directories included)
3. Findings table
4. Block reason (if blocked)
5. Recommended `.npmignore` or `"files"` whitelist if missing

#### /llll override — Override SOFT_BLOCK

Usage: `/llll override [FINDING-ID] [justification]`

**Engine first.** Overrides are recorded by the engine, which asks for confirmation in a terminal. Give the user the exact command to run themselves: `llll-guard override <FINDING-ID>@<token> "<justification>"` (the push output prints each finding's `<FINDING-ID>@<token>` reference; a bare rule id is refused because an override covers one finding). Do **not** add `--yes` on the user's behalf: that flag exists for automation, and the confirmation is the point. The steps below describe what the engine does and what to report afterwards.

MUST:
1. Verify the finding exists and is SOFT_BLOCK severity (not HARD_BLOCK — those cannot be overridden)
2. If HARD_BLOCK, reject with explanation: "HARD_BLOCK findings cannot be overridden. Fix the issue before proceeding."
3. Record the override:
   - Finding ID(s)
   - Justification (from user)
   - Actor (from git config user.email or ~/.layrix/config.json email)
   - Timestamp
   - Affected files
4. Log to `.llll/logs/guard-log.jsonl`
5. Mark the finding as overridden
6. Re-evaluate verdict (if all SOFT_BLOCKs are overridden, verdict becomes WARN when warnings remain, otherwise PASS)

Output:
1. Override confirmation with finding details
2. Justification recorded
3. Updated verdict
4. Warning: "This override is logged for compliance audit"

#### Guard Patterns

##### 1. Severity Model

| Level | Meaning | Effect |
|-------|---------|--------|
| **HARD_BLOCK** | Must not leave the repository under any circumstances | Push/release blocked, no override allowed |
| **SOFT_BLOCK** | Should not leave without policy review or explicit justification | Push/release blocked, overridable with `/llll override` |
| **WARN** | Notable change that may need attention | Push/release proceeds, warning logged |
| **PASS** | No issues detected | Push/release proceeds |

##### 2. Push Gate — HARD_BLOCK Triggers

These patterns in outgoing diffs trigger an automatic hard block. Scanned against added lines in the diff.

| Pattern ID | Regex / Heuristic | Description | Category |
|-----------|-------------------|-------------|----------|
| PG-H001 | `\b(AKIA\|ASIA)[0-9A-Z]{16}\b` | AWS access key ID (long-term or temporary) | secret |
| PG-H002 | `\bsk-[A-Za-z0-9_-]{20,}` (OpenAI, Anthropic), `\b(sk\|rk)_live_[A-Za-z0-9]{16,}` (Stripe live), `\bxox[abprs]-…` (Slack), `\bAIza[0-9A-Za-z_-]{35}` (Google) | API secret key | secret |
| PG-H003 | `ghp_[a-zA-Z0-9]{36}` | GitHub personal access token | secret |
| PG-H004 | `gho_[a-zA-Z0-9]{36}` | GitHub OAuth access token | secret |
| PG-H005 | `-----BEGIN (RSA \|DSA \|EC \|OPENSSH \|ENCRYPTED \|PGP )?PRIVATE KEY( BLOCK)?-----` | Private key material (including PKCS#8 and PGP) | secret |
| PG-H006 | `(?i)(api[_-]?key\|api[_-]?secret\|access[_-]?key)\s*[=:]\s*['"][A-Za-z0-9+/=]{16,}['"]` | Hardcoded API key assignment | secret |
| PG-H007 | `(?i)(password\|passwd\|pwd)\s*[=:]\s*['"][^'"]{8,}['"]` | Hardcoded password (>8 chars) | secret |
| PG-H008 | `(?i)(database_url\|db_password\|db_pass\|mongo_uri\|redis_url)\s*[=:]\s*['"][^'"]+['"]` | Database credential | secret |
| PG-H009 | `(?i)bearer\s+[A-Za-z0-9\-._~+/]+=*` | Hardcoded bearer token | secret |
| PG-H010 | New or modified `.env` file (not `.env.example`, `.env.template`, `.env.sample`) | Environment file with potential secrets | secret |
| PG-H011 | Files matching `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*`, `id_ed25519*` | Private key files | secret |
| PG-H012 | `\d{3}-\d{2}-\d{4}` | Social Security Number pattern | data |
| PG-H013 | `\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}` | Credit card number pattern | data |
| PG-H014 | Files matching `*Competitive_Analysis*`, `*Full_Analysis*`, `AGENT_PROMPT_*`, `MCP_analysis*` | Internal/competitive analysis files | internal |

##### 3. Push Gate — SOFT_BLOCK Triggers

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
| PG-S011 | `llll.policy.json`, `.guardignore` or `llll.whitelist.json` at the repository root changed | Guard policy changed. The change applies from the next push, not the push that carries it | policy | — |

##### 4. Push Gate — WARN Triggers

| Pattern ID | Heuristic | Description | Category |
|-----------|-----------|-------------|----------|
| PG-W001 | `TODO\|FIXME\|HACK\|XXX\|TEMP` in newly added lines | Unresolved markers in outgoing code | hygiene |
| PG-W002 | `console\.log\|console\.debug\|print(\|debugger;` in production code (not test files) | Debug output in production code | hygiene |
| PG-W003 | New dependency added to manifest (package.json, requirements.txt, etc.) | New dependency — review for license and security | dependency |

##### 5. Release Gate — HARD_BLOCK Triggers

| Pattern ID | Pattern | Description | Category |
|-----------|---------|-------------|----------|
| RG-H001 | `.env` file in release artifact | Secrets in release package | secret |
| RG-H002 | `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*` in release | Private keys in release package | secret |
| RG-H003 | Files matching secret patterns (PG-H001 through PG-H009) in release content | Embedded secrets in release artifacts | secret |
| RG-H004 | `*.map` files in release artifact | Source maps expose original source code | leakage |
| RG-H005 | Source map files with `sourcesContent` field populated | Full source code embedded in source maps | leakage |
| RG-H006 | References to private archives, internal buckets (`s3://`, `gs://`, internal URLs) in release | Internal infrastructure references exposed | leakage |
| RG-H007 | A file matching `internalFilePatterns` from the policy (none by default) | Internal file in release package | leakage |

##### 6. Release Gate — SOFT_BLOCK Triggers

| Pattern ID | Pattern | Description | Category |
|-----------|---------|-------------|----------|
| RG-S001 | `src/` directory in release artifact | Source code included in production package | leakage |
| RG-S002 | `test/`, `tests/`, `__tests__/`, `spec/`, `*.test.*`, `*.spec.*` in release | Test files included in release | leakage |
| RG-S003 | `internal/`, `private/` directories in release | Internal assets exposed in release | leakage |
| RG-S004 | `prompts/`, `*.prompt`, `SKILL.md`, `system-prompt*` in release | Prompt files or skill definitions in release | leakage |
| RG-S005 | `tools/`, `scripts/`, `Makefile`, `Taskfile*` in release | Development tooling in release package | leakage |
| RG-S006 | No `.npmignore` AND no `"files"` field in package.json | No release whitelist policy | policy |
| RG-S007 | Release artifact total size > 10MB without justification | Unusually large package | policy |
| RG-S008 | A file the gate did not read: larger than `LLLL_GUARD_MAX_FILE_BYTES` (64 MiB by default), or not a regular file | File not scanned: what is in it is unknown | policy |

##### 7. Exclusions

**Push Gate Exclusions:** `*.md`, `*.txt`, `*.lock`, `*.sum`, `yarn.lock`, `package-lock.json`, `CHANGELOG*`, `CHANGES*`, `HISTORY*`, `LICENSE*`

**Release Gate Exclusions:** `node_modules/`, `.git/`

**User-Defined Exclusions:** Users can create a `.guardignore` file (gitignore-style syntax) to exclude additional files.

##### 8. Guard Domain Mapping

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

##### 9. Override Rules

- **HARD_BLOCK**: Cannot be overridden. Must fix before retrying.
- **SOFT_BLOCK**: Overridable with `/llll override`. Requires finding ID, justification, actor, and timestamp. Logged to `.llll/logs/guard-log.jsonl`.

##### 10. Guard Output Structure

```
┌────────────────────────────────────────┐
│ LLLL Guard — Push Gate                 │
│ Result: HARD_BLOCK                     │
│ Findings: 2 HARD_BLOCK, 1 WARN        │
│ Scanned: 3 commits, 12 files changed  │
└────────────────────────────────────────┘

[PG-H001] AWS Access Key Detected — HARD_BLOCK
  File: src/config/aws.ts:42
  Match: AKIA...EXAMPLE (redacted)
  Category: secret
  Action: Remove the key, use environment variable instead
  Fix: /llll fix PG-H001
```

---

### Pre-Push Activation (Guard Mode)

When the user mentions pushing code, deploying, publishing, or releasing:
- Suggest `/llll guard push` before `git push`
- Suggest `/llll guard release` before `npm publish` or release packaging

When feature planning outputs involve:
- New secrets or API integrations → remind about `/llll guard push`
- New package publishing → remind about `/llll guard release`

---
