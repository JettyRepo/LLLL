# LLLL Scan, Fix and GRC Modes v5.0

> Part of the LLLL skill. `SKILL.md` says when to read this file; the rules here apply together with it.

### /llll scan — Automated Security and Hygiene Scan

This mode uses Bash, Grep, and Glob tools to perform concrete, executable security and hygiene checks against the actual codebase. Unlike other modes that reason about compliance posture, `/llll scan` produces findings backed by specific file locations and command outputs.

MUST:
1. Detect tech stack (check for package.json, requirements.txt, Cargo.toml, go.mod, Gemfile, Dockerfile)
2. Run applicable scans from the inline patterns below in this order:
   a. Git hygiene checks (GIT-001 through GIT-007)
   b. Secret detection (SEC-001 through SEC-008)
   c. OWASP code pattern scan (OWA-001 through OWA-015)
   d. Dependency audit (tech-stack-specific command)
   e. License risk scan (tech-stack-specific command)
   f. Dockerfile security (if Dockerfile exists)
3. Classify each finding by severity (Critical/High/Medium/Low) and map to domain check ID
4. Identify which findings are auto-fixable
5. Produce structured scan report per the Scan Output Structure subsection below

#### Scan Patterns

##### 1. Secret Detection Patterns

Scan source code files (excluding node_modules, .git, vendor, dist, build directories) for hardcoded secrets.

| Pattern ID | Regex Pattern | Description | Severity |
|-----------|---------------|-------------|----------|
| SEC-001 | `(?i)(api[_-]?key\|api[_-]?secret\|access[_-]?key)\s*[=:]\s*['"][A-Za-z0-9+/=]{16,}['"]` | Hardcoded API key assignment | Critical |
| SEC-002 | `(?i)password\s*[=:]\s*['"][^'"]{4,}['"]` | Hardcoded password (excluding test files) | Critical |
| SEC-003 | `AKIA[0-9A-Z]{16}` | AWS Access Key ID | Critical |
| SEC-004 | `\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}` | OpenAI / Anthropic-style secret key (`sk-`; Stripe live keys use `sk_live_`) | Critical |
| SEC-005 | `ghp_[a-zA-Z0-9]{36}` | GitHub personal access token | Critical |
| SEC-006 | `-----BEGIN (?:RSA \|DSA \|EC \|OPENSSH \|ENCRYPTED )?PRIVATE KEY-----` | Private key in source | Critical |
| SEC-007 | `(?i)(database_url\|db_password\|db_pass)\s*[=:]\s*['"][^'"]+['"]` | Database credential | Critical |
| SEC-008 | `(?i)bearer\s+[a-zA-Z0-9._\-]{20,}` | Hardcoded bearer token | High |

Exclude from scanning: `*.md`, `*.txt`, `*.lock`, `*.sum`, test fixtures explicitly named as examples.

Before reporting a SEC-001, SEC-002, SEC-007 or SEC-008 match as Critical/High, apply the credential false-positive check in `SKILL.md` (Step 4: exact value, template or client-exposed by design). SEC-003 to SEC-006 are never downgraded.

##### 2. OWASP Code Pattern Scan

Scan application source code for common vulnerability patterns.

| Pattern ID | Regex Pattern | Language | Vulnerability | Severity | Domain Check |
|-----------|---------------|----------|---------------|----------|-------------|
| OWA-001 | `(?:^\|[^.\w])eval\s*\(` | JS/Python | Code injection | Critical | B5 |
| OWA-002 | `(?:^\|[^.\w])exec\s*\(` | Python | Command injection | Critical | B5 |
| OWA-003 | `child_process\.(exec\|execSync)\s*\(` | Node.js | Command injection | Critical | B5 |
| OWA-004 | `os\.system\s*\(` | Python | Command injection | Critical | B5 |
| OWA-005 | `subprocess\.(call\|run\|Popen)\s*\(.*shell\s*=\s*True` | Python | Shell injection | Critical | B5 |
| OWA-006 | `innerHTML\s*=` | JS | DOM XSS | High | B6 |
| OWA-007 | `dangerouslySetInnerHTML` | React | XSS via raw HTML | High | B6 |
| OWA-008 | `v-html\s*=` | Vue | XSS via raw HTML | High | B6 |
| OWA-009 | `(?i)\b(?:SELECT\|INSERT\|UPDATE\|DELETE\|DROP)\b[^\x60\n]*\$\{` | JS/TS | SQL injection via template literal | Critical | B5 |
| OWA-010 | `f".*(?:SELECT\|INSERT\|UPDATE\|DELETE\|DROP).*\{` | Python | SQL injection via f-string | Critical | B5 |
| OWA-011 | `".*(?:SELECT\|INSERT\|UPDATE\|DELETE).*"\s*%` | Python | SQL injection via % formatting | Critical | B5 |
| OWA-012 | `(?i)document\.write\s*\(` | JS | DOM manipulation XSS | High | B6 |
| OWA-013 | `(?i)(createHash\(\s*['"](md5\|sha1)['"]\|hashlib\.(md5\|sha1)\s*\()` | Any | Weak hashing algorithm | High | B7 |
| OWA-014 | `(?i)DEBUG\s*=\s*(True\|true\|1\|"true")` | Any | Debug mode enabled | High | B8 |
| OWA-015 | `(?i)Access-Control-Allow-Origin.*\*` | Any | Permissive CORS | Medium | B8 |

An OWA match is a **lead**, not a finding. Before assigning Critical or High, read the surrounding code and confirm that the flagged call receives input a user can influence (request data, file or network content, an environment the user controls). A match on a constant, a build script or a test is Low or not reported; if you cannot tell, report it as NEEDS TECHNICAL CONFIRMATION. Calls such as `model.eval()` or `regex.exec()` are methods that share the name and are not code execution.

##### 3. Git Hygiene Checks

| Check ID | Command | What It Checks | Severity |
|----------|---------|----------------|----------|
| GIT-001 | `test -f .gitignore` | .gitignore file exists | High |
| GIT-002 | `git check-ignore -q .env` | .env excluded from tracking | Critical |
| GIT-003 | `git log --all --diff-filter=A --name-only --format= -- '.env' '*.env' '.env.*' ':!*.example' ':!*.sample' ':!*.template'` | .env files never committed to history | Critical |
| GIT-004 | `git log --all --diff-filter=A --name-only --format= -- '*.pem' '*.key' '*id_rsa*' ':!*.pub'` | Private keys never committed | Critical |
| GIT-005 | `gh api repos/{owner}/{repo}/branches/{default_branch}/protection 2>/dev/null` (needs `gh` and admin access; otherwise NEEDS TECHNICAL CONFIRMATION. Rulesets use a different API, so a 404 here is not proof that the branch is unprotected) | Branch protection on main | High |
| GIT-006 | `test -f LICENSE \|\| test -f LICENSE.md \|\| test -f LICENSE.txt \|\| test -f COPYING` | LICENSE file exists | High |
| GIT-007 | `test -f CODEOWNERS \|\| test -f .github/CODEOWNERS \|\| test -f docs/CODEOWNERS` | CODEOWNERS file exists | Low |

##### 4. Dependency Audit Commands

| Tech Stack | Audit Command | Lock File |
|-----------|---------------|-----------|
| Node.js (npm) | `npm audit --json 2>/dev/null` | `package-lock.json` |
| Node.js (yarn) | `yarn audit --json 2>/dev/null` | `yarn.lock` |
| Node.js (pnpm) | `pnpm audit --json 2>/dev/null` | `pnpm-lock.yaml` |
| Python (pip) | `pip-audit -r requirements.txt -f json 2>/dev/null` | `requirements.txt` |
| Python (pipenv) | `pipenv check --json 2>/dev/null` | `Pipfile.lock` |
| Python (poetry) | no built-in audit command: a third-party audit plugin, or `pip-audit` on exported requirements; if neither is installed, NEEDS TECHNICAL CONFIRMATION | `poetry.lock` |
| Rust | `cargo audit --json 2>/dev/null` | `Cargo.lock` |
| Go | `govulncheck ./... 2>/dev/null` | `go.sum` |
| Ruby | `bundle audit check --format=json 2>/dev/null` | `Gemfile.lock` |

If the audit command is not installed, report as: `NEEDS TECHNICAL CONFIRMATION — [tool] not installed. Install with [install command] and re-run scan.`

##### 5. License Risk Scan

| Tech Stack | License Command |
|-----------|----------------|
| Node.js | `npx license-checker --json --production 2>/dev/null` or parse `package.json` license fields |
| Python | `pip-licenses --format=json 2>/dev/null` or parse metadata |
| Rust | `cargo license --json 2>/dev/null` |
| Go | `go-licenses report ./... 2>/dev/null` |

**License Risk Classification**

| License | Risk Level | Commercial Impact |
|---------|-----------|------------------|
| MIT, BSD-2, BSD-3, ISC, Unlicense | 🟢 Low | Permissive — no restrictions on commercial use |
| Apache 2.0 | 🟢 Low | Permissive — patent grant included |
| MPL-2.0 | 🟡 Medium | File-level copyleft — modified files must be shared |
| LGPL-2.1, LGPL-3.0 | 🟡 Medium | Dynamic linking OK, static linking may trigger copyleft |
| GPL-2.0, GPL-3.0 | 🔴 High | Strong copyleft — derivative works must use same license |
| AGPL-3.0 | 🔴🔴 Critical | Network copyleft — SaaS/API use triggers disclosure obligation |
| SSPL | 🔴🔴 Critical | Service-level copyleft — offering as a service triggers disclosure |
| No license / Unknown | 🔴 High | Default copyright — cannot legally use, modify, or distribute |

##### 6. Dockerfile Security Patterns

If a Dockerfile exists, scan for common misconfigurations.

| Pattern ID | Pattern | Issue | Severity |
|-----------|---------|-------|----------|
| DOC-001 | `^FROM .+:latest` | Using :latest tag (non-reproducible) | Medium |
| DOC-002 | No `USER` instruction | Running as root | High |
| DOC-003 | `COPY .env` or `ADD .env` | Secrets in image layer | Critical |
| DOC-004 | `ARG.*PASSWORD\|ARG.*SECRET\|ARG.*KEY` | Secrets as build args (visible in history) | High |
| DOC-005 | No `.dockerignore` | Potential secret leakage into build context | Medium |

##### 7. Scan Output Structure

```
## LLLL Scan Report

Output Mode: LLLL [level]

Scan target: [repository path]
Scan time: [ISO 8601 timestamp]
Tech stack: [detected technologies]

### Findings Summary

| Severity | Count | Auto-fixable |
|----------|-------|-------------|
| 🔴🔴 Critical | N | N |
| 🔴 High | N | N |
| 🟡 Medium | N | N |
| 🟢 Low | N | N |

### Layer 0 — Software Resilience

[Git hygiene, version control, testing existence findings]

### Layer 1 — Security Posture

[Secret detection, OWASP patterns, dependency vulnerabilities, license risks]

### Detailed Findings

#### [FINDING-ID]: [Title]
- **Severity:** [Critical/High/Medium/Low with indicator]
- **Domain:** [N/O/B/C] — Check [ID]
- **Location:** [file:line or command output]
- **Description:** [What was found]
- **Risk:** [What could go wrong]
- **Fix:** [Specific remediation steps]
- **Auto-fixable:** Yes/No
- **Fix command:** `/llll fix [FINDING-ID]` (if auto-fixable)

### Recommended Tools

[For findings that require ongoing monitoring beyond Claude Code's session-based capability, recommend specific tools:]
- Dependency monitoring: Dependabot (GitHub native), Snyk, Renovate
- Secret scanning: GitHub Secret Scanning, GitLeaks, TruffleHog
- SAST: SonarQube, Semgrep, CodeQL
- Container scanning: Trivy, Grype
- License compliance: FOSSA, Snyk License, Mend (formerly WhiteSource)

### Coverage Confidence
[Standard LLLL coverage confidence section]

### Education Insight
[Standard LLLL education insight]

---
⚠️ Disclaimer:
This content is generated by AI and may be incomplete or inaccurate.
Human compliance expert or legal professional review is recommended.

Next:
[1] /llll fix [highest-severity auto-fixable finding]
[2] /llll scan (re-scan)
[3] /llll grc (GRC dashboard)
[4] /llll
[5] /llll deep
```

> The `Next:` block above is a sketch. The exact menu for `/llll scan` (including the registration item for LLLL Unregistered) is in `menus.md`; use that one.

Output:
1. Scan metadata (target, time, tech stack)
2. Findings summary (severity counts, auto-fixable counts)
3. Layer 0 findings (software resilience)
4. Layer 1 findings (security posture)
5. Detailed findings with file:line locations and fix commands
6. Recommended tools for ongoing monitoring
7. Coverage Confidence
8. Education Insight
9. Next steps menu (with `/llll fix` for highest auto-fixable finding)

When a scan command is not available (e.g., `npm audit` when npm is not installed), report as NEEDS TECHNICAL CONFIRMATION and suggest installation.

Folding rules: Same as all other modes. Unregistered users see `round(N/2)` findings per table by severity descending, with the remainder folded and names listed. LLLL Basic (registered) users see all.

---

### /llll fix — Generate Fix for Scan Finding

This mode generates concrete code fixes for findings identified by `/llll scan`.

Usage: `/llll fix [FINDING-ID]` or `/llll fix` (fixes highest-severity auto-fixable finding)

MUST:
1. Look up the finding by ID from the most recent `/llll scan` output in conversation context
2. If no scan has been run in this session, prompt: "Run `/llll scan` first to identify findings."
3. Generate the specific fix:
   - For secret exposure: move to environment variable, update .gitignore, create .env.example
   - For OWASP patterns: replace unsafe pattern with safe alternative, add input validation
   - For dependency vulnerabilities: suggest version update, show breaking change risk
   - For git hygiene: create/update .gitignore, suggest branch protection commands
   - For license risk: identify the problematic dependency, suggest alternatives with compatible licenses
   - For Dockerfile issues: rewrite the affected instructions
4. Show before/after comparison for each changed file
5. Do NOT automatically apply changes — present them for user approval
6. After user approves, apply changes using Edit/Write tools
7. Suggest re-running `/llll scan` to verify the fix

Output:
1. Finding summary (ID, severity, location)
2. Fix description (what will change and why)
3. Before/after code comparison for each affected file
4. Potential side effects or breaking changes
5. Post-fix verification command
6. Next steps menu

---

### /llll grc — Governance, Risk, and Compliance Dashboard

This mode aggregates findings across all LLLL domains into an executive-level GRC dashboard. It combines automated scan results (if available) with compliance analysis.

MUST:
1. Run context gathering (same as `/llll` Step 1)
2. If `/llll scan` has been run in this session, incorporate scan findings
3. If no scan has been run, note that scan data is unavailable and suggest running `/llll scan` first
4. Produce three sections:

**Governance (controls status)**
- Version control discipline (N1)
- Code review process (A2)
- Release management (A2, N5)
- Incident response (A3)
- Documentation (N3)

**Risk (threat landscape)**
- Vulnerability counts by severity (from scan or INFERRED)
- License risk summary (from scan or INFERRED from Domain O)
- Secret exposure status (from scan or INFERRED from B9)
- Supply chain risk (C1-C9 assessment)
- Data protection risk (D1-D4 assessment)

**Compliance (domain scores)**
- Per-domain completeness scores (same methodology as `/llll checklist`)
- Overall compliance score
- Trend indicator if previous scores exist in conversation context

Output:
1. GRC Dashboard header
2. Governance section with control status table
3. Risk section with threat summary table
4. Compliance section with domain scores
5. Top 5 recommended actions (prioritized across all three categories)
6. Coverage Confidence
7. Education Insight
8. Next steps menu

Folding rules: Same as all other modes.

---
