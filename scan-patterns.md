# LLLL Scan Patterns v4.0

Reference data for the `/llll scan` command. Defines grep patterns, shell commands, and finding classifications for automated security and hygiene scanning.

This file is NOT executed directly. LLLL reads it to know what to scan for and how to classify findings.

---

## 1. Secret Detection Patterns

Scan source code files (excluding node_modules, .git, vendor, dist, build directories) for hardcoded secrets.

| Pattern ID | Regex Pattern | Description | Severity |
|-----------|---------------|-------------|----------|
| SEC-001 | `(?i)(api[_-]?key\|api[_-]?secret\|access[_-]?key)\s*[=:]\s*['"][A-Za-z0-9+/=]{16,}['"]` | Hardcoded API key assignment | Critical |
| SEC-002 | `(?i)password\s*[=:]\s*['"][^'"]{4,}['"]` | Hardcoded password (excluding test files) | Critical |
| SEC-003 | `AKIA[0-9A-Z]{16}` | AWS Access Key ID | Critical |
| SEC-004 | `sk-[a-zA-Z0-9]{20,}` | OpenAI / Stripe secret key pattern | Critical |
| SEC-005 | `ghp_[a-zA-Z0-9]{36}` | GitHub personal access token | Critical |
| SEC-006 | `-----BEGIN (RSA\|DSA\|EC\|OPENSSH) PRIVATE KEY-----` | Private key in source | Critical |
| SEC-007 | `(?i)(database_url\|db_password\|db_pass)\s*[=:]\s*['"][^'"]+['"]` | Database credential | Critical |
| SEC-008 | `(?i)bearer\s+[a-zA-Z0-9._\-]{20,}` | Hardcoded bearer token | High |

Exclude from scanning: `*.md`, `*.txt`, `*.lock`, `*.sum`, test fixtures explicitly named as examples.

## 2. OWASP Code Pattern Scan

Scan application source code for common vulnerability patterns.

| Pattern ID | Regex Pattern | Language | Vulnerability | Severity | Domain Check |
|-----------|---------------|----------|---------------|----------|-------------|
| OWA-001 | `\beval\s*\(` | JS/Python | Code injection | Critical | B5 |
| OWA-002 | `\bexec\s*\(` | Python | Command injection | Critical | B5 |
| OWA-003 | `child_process\.(exec\|execSync)\s*\(` | Node.js | Command injection | Critical | B5 |
| OWA-004 | `os\.system\s*\(` | Python | Command injection | Critical | B5 |
| OWA-005 | `subprocess\.(call\|run\|Popen)\s*\(.*shell\s*=\s*True` | Python | Shell injection | Critical | B5 |
| OWA-006 | `innerHTML\s*=` | JS | DOM XSS | High | B6 |
| OWA-007 | `dangerouslySetInnerHTML` | React | XSS via raw HTML | High | B6 |
| OWA-008 | `v-html\s*=` | Vue | XSS via raw HTML | High | B6 |
| OWA-009 | `\$\{.*\}.*(?:SELECT\|INSERT\|UPDATE\|DELETE\|DROP)` | JS/TS | SQL injection via template literal | Critical | B5 |
| OWA-010 | `f".*(?:SELECT\|INSERT\|UPDATE\|DELETE\|DROP).*\{` | Python | SQL injection via f-string | Critical | B5 |
| OWA-011 | `".*(?:SELECT\|INSERT\|UPDATE\|DELETE).*"\s*%` | Python | SQL injection via % formatting | Critical | B5 |
| OWA-012 | `(?i)document\.write\s*\(` | JS | DOM manipulation XSS | High | B6 |
| OWA-013 | `(?i)(md5\|sha1)\s*\(` | Any | Weak hashing algorithm | High | B7 |
| OWA-014 | `(?i)DEBUG\s*=\s*(True\|true\|1\|"true")` | Any | Debug mode enabled | High | B8 |
| OWA-015 | `(?i)Access-Control-Allow-Origin.*\*` | Any | Permissive CORS | Medium | B8 |

## 3. Git Hygiene Checks

These checks use git and GitHub CLI commands.

| Check ID | Command | What It Checks | Severity |
|----------|---------|----------------|----------|
| GIT-001 | `test -f .gitignore` | .gitignore file exists | High |
| GIT-002 | `grep -q "\.env" .gitignore` | .env excluded from tracking | Critical |
| GIT-003 | `git log --all --diff-filter=A -- '*.env' '.env.*'` | .env files never committed to history | Critical |
| GIT-004 | `git log --all --diff-filter=A -- '*.pem' '*.key' 'id_rsa*'` | Private keys never committed | Critical |
| GIT-005 | `gh api repos/{owner}/{repo}/branches/main/protection 2>/dev/null` | Branch protection on main | High |
| GIT-006 | `test -f LICENSE` | LICENSE file exists | High |
| GIT-007 | `test -f CODEOWNERS` | CODEOWNERS file exists | Low |

## 4. Dependency Audit Commands

Run the appropriate command based on detected tech stack.

| Tech Stack | Audit Command | Lock File |
|-----------|---------------|-----------|
| Node.js (npm) | `npm audit --json 2>/dev/null` | `package-lock.json` |
| Node.js (yarn) | `yarn audit --json 2>/dev/null` | `yarn.lock` |
| Node.js (pnpm) | `pnpm audit --json 2>/dev/null` | `pnpm-lock.yaml` |
| Python (pip) | `pip audit --format=json 2>/dev/null` | `requirements.txt` |
| Python (pipenv) | `pipenv check --json 2>/dev/null` | `Pipfile.lock` |
| Python (poetry) | `poetry audit 2>/dev/null` | `poetry.lock` |
| Rust | `cargo audit --json 2>/dev/null` | `Cargo.lock` |
| Go | `govulncheck ./... 2>/dev/null` | `go.sum` |
| Ruby | `bundle audit check --format=json 2>/dev/null` | `Gemfile.lock` |

If the audit command is not installed, report as: `NEEDS TECHNICAL CONFIRMATION — [tool] not installed. Install with [install command] and re-run scan.`

## 5. License Risk Scan

For each detected package manager, extract license information:

| Tech Stack | License Command |
|-----------|----------------|
| Node.js | `npx license-checker --json --production 2>/dev/null` or parse `package.json` license fields |
| Python | `pip-licenses --format=json 2>/dev/null` or parse metadata |
| Rust | `cargo license --json 2>/dev/null` |
| Go | `go-licenses report ./... 2>/dev/null` |

### License Risk Classification

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

## 6. Dockerfile Security Patterns

If a Dockerfile exists, scan for common misconfigurations.

| Pattern ID | Pattern | Issue | Severity |
|-----------|---------|-------|----------|
| DOC-001 | `^FROM .+:latest` | Using :latest tag (non-reproducible) | Medium |
| DOC-002 | No `USER` instruction | Running as root | High |
| DOC-003 | `COPY .env` or `ADD .env` | Secrets in image layer | Critical |
| DOC-004 | `ARG.*PASSWORD\|ARG.*SECRET\|ARG.*KEY` | Secrets as build args (visible in history) | High |
| DOC-005 | No `.dockerignore` | Potential secret leakage into build context | Medium |

## 7. Scan Output Structure

The scan report follows this structure:

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
- License compliance: FOSSA, Snyk License, WhiteSource

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
