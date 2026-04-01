# LLLL v4.0.0 — Software Resilience & Compliance Foundation

**Estimated time:** 4-6 hours
**Budget:** 7 hours (est + 20%)
**Scope:** Expand LLLL from 13 compliance domains (A-M) to 17 domains (A-O), deepen existing security/supply-chain domains, add 3 new command modes (`/llll scan`, `/llll fix`, `/llll grc`), and update all supporting files (schema, templates, examples).

**Architecture change:** Add Layer 0 (Software Resilience Foundation) beneath the existing compliance framework. The premise: compliance is meaningless if the software cannot run safely. Target audience is solo developers and small teams lacking basic software engineering discipline.

---

## Reference — Current Project State

**Repository:** `/Users/vox/LLLL` (also symlinked at `~/.claude/skills/llll`)
**Branch:** `main`
**Latest commit:** `bc54988`
**Current version:** v3.0.1

### File inventory (all paths relative to `/Users/vox/LLLL`)

| File | Lines | Purpose | Modified in this prompt? |
|------|-------|---------|------------------------|
| `compliance-checklist-master.md` | 875 | Master compliance rules — Domains A-M, 30+ checks | YES (Phase 1 + 2) |
| `SKILL.md` | 827 | Core skill definition — engine, modes, tiering | YES (Phase 3 + 4) |
| `checklist-schema.md` | 231 | Structured intake schema — Domain → Inputs → Status → Owner | YES (Phase 5) |
| `output-templates.md` | 705 | 8 output templates for all modes and tiers | YES (Phase 5) |
| `examples.md` | 743 | 10 usage examples across all modes | YES (Phase 5) |
| `CHANGELOG.md` | 36 | Version history | YES (Phase 5) |
| `TODO.md` | 33 | Task tracking | YES (Phase 5) |
| `README.md` | 120 | Project documentation | YES (Phase 5) |
| `scan-patterns.md` | — | NEW FILE: scan pattern definitions for `/llll scan` | CREATED (Phase 3) |

### Current domain structure in compliance-checklist-master.md

```
# 4. Universal Compliance Domains (always active)
  A. Project Governance (A1-A3)         — lines 119-180
  B. Application Security (B1-B4)       — lines 183-263
  C. Supply Chain (C1-C3)               — lines 266-326
  D. Privacy (D1-D4)                    — lines 329-409
  E. Accessibility (E1-E2)             — lines 412-449

# 5. Business Model Specific Domains
  F. Payments (F1-F2)                   — lines 458-499
  G. UGC / Moderation (G1-G2)          — lines 502-541
  H. Enterprise / B2B (H1)             — lines 544-565

# 6. AI-Specific Domains
  I. AI Transparency (I1-I2)            — lines 574-609
  J. Automated Decisions (J1-J2)        — lines 612-652
  K. AI Safety Ops (K1-K2)             — lines 655-693

# 7. Mobile-Specific Domains
  L. Mobile (L1-L2)                     — lines 700-741

# 8. Industry-Specific
  M. Sensitive Sector                   — lines 748-773

# 9-12. Operating rules                 — lines 775-875
```

### Pattern for new checks (copy this exact format)

```markdown
### XX. Check title
Check:
- whether [condition 1]
- whether [condition 2]
- whether [condition 3]

Evidence:
- [evidence source 1]
- [evidence source 2]

Priority:
- [Critical / High / Medium / Low]

Applicability:
- [when this check applies]
```

### SKILL.md structure

```
Lines 1-7:     Frontmatter (name, description, allowed-tools)
Lines 8-28:    Identity and role definition
Lines 29-47:   Three Engine Model
Lines 48-100:  Embedded Workflow Integration (passive activation)
Lines 101-117: Continuous Compliance
Lines 118-130: Checklist-Driven Engine
Lines 131-189: Required Operating Flow (Steps 1-4)
Lines 190-300: Tiered Visibility Architecture (Basic/Pro/Team, folding rules)
Lines 301-339: Internal Data Model
Lines 340-357: Decision Labels
Lines 358-469: Mode System (/llll, checklist, brief, diff, deep)
Lines 470-579: Registration, Upgrade, Next Steps Menu
Lines 580-631: Actionable Output Standard, Compliance Artifacts, Escalation
Lines 632-656: Mandatory Disclaimer
Lines 657-706: Coverage Confidence Indicator
Lines 707-759: Registration Hint
Lines 760-827: Education Insight, Style Rules, Completion Standard
```

### Current domain selection logic in SKILL.md (lines 152-178)

```
### Step 2 — Select compliance domains
Priority order:
1. Universal domains (A-E)
2. Business model domains (F-H)
3. Industry / high-sensitivity activation (M)
4. AI domains (I-K)
5. Mobile domains (L)

### Step 3 — Activate only relevant domains
#### Always Active
- A (Project Governance) — all projects
- B (Application Security) — all projects with users
- C (Supply Chain) — all projects with dependencies
- D (Privacy) — all projects processing personal data

#### Conditionally Active
- E through M [list]
```

---

## Critical Rules

1. **Language:** All file content must be in English. No Chinese, no mixed languages in any file.
2. **No module removal:** Never delete existing domains, checks, or modes. Only add or expand.
3. **Folding rules:** New domains N and O follow the same Basic/Pro/Team folding rules as existing domains. Critical + High never folded. Medium + Low folded in Basic (show 2, fold rest with names listed).
4. **Color indicators:** All new risk-leveled items must use emoji indicators: 🔴🔴 Critical, 🔴 High, 🟡 Medium, 🟢 Low.
5. **Check ID format:** New checks use their domain letter + number (N1, N2, O1, O2, B5, B6, C4, C5, etc.).
6. **Consistency:** New content must match the exact formatting patterns of existing content (header levels, table formats, list styles).
7. **File paths:** All edits target files in `/Users/vox/LLLL/`. Do not create files elsewhere.
8. **Git:** Do NOT commit, push, or create branches. Only edit files.
9. **SKILL.md frontmatter:** The `allowed-tools` field currently says `Read, Grep, Glob`. Phase 3 adds Bash. Update to `Read, Grep, Glob, Bash`.
10. **Disclaimer:** All new output templates must end with the mandatory disclaimer block.
11. **Next Steps Menu:** All new command modes must include the mandatory next steps menu.
12. **scan-patterns.md:** This is a NEW file. It is a reference data file for the `/llll scan` command, not a skill file. It contains grep patterns, command templates, and finding definitions.

---

## Work Strategy

- **Batch size:** Each phase edits 1-3 files. Complete one phase fully before starting the next.
- **Validation cadence:** Run verification after each phase. Do not proceed if verification fails.
- **Fallback:** If an edit fails (e.g., `old_string` not unique), read the file first, find the exact surrounding context, and retry with more context.
- **Insertion strategy:** For large insertions into compliance-checklist-master.md, insert at the correct location relative to existing section numbers. After Phase 1 and 2, section numbers in the "Operating rules" area (currently sections 9-12) will shift — use content matching, not line numbers.
- **Read before edit:** Always read the target file (or target region) before making edits, especially after prior phases have modified it.

---

## Phase 1 — New Domains N + O in compliance-checklist-master.md

**Goal:** Add two new domains to the master checklist: Domain N (Software Engineering Fundamentals) and Domain O (Open Source & Licensing Risk). These form "Layer 0" — the software resilience foundation that must be addressed before compliance work is meaningful.

**File:** `compliance-checklist-master.md`

### Step 1.1 — Read current file state

Read `compliance-checklist-master.md` lines 740-875 to see the end of Domain M and the operating rules sections.

### Step 1.2 — Insert Layer 0 section header + Domain N

Insert a new section **before** the current `# 8. Industry-Specific` section (which starts around line 745). The new structure is:

**Important:** The current section numbering is:
- `# 4. Universal Compliance Domains`
- `# 5. Business Model Specific Domains`
- `# 6. AI-Specific Domains`
- `# 7. Mobile-Specific Domains`
- `# 8. Industry-Specific and High-Sensitivity Activation Layer`
- `# 9. Output Mapping Rules`
- `# 10. Decision Labels`
- `# 11. Domain Selection Guidance`
- `# 12. Final Operating Principle`

After this phase, the numbering becomes:
- `# 4.` through `# 7.` — unchanged
- `# 8. Software Resilience Foundation (Layer 0)` — NEW (contains N + O)
- `# 9. Industry-Specific and High-Sensitivity Activation Layer` — renumbered from 8
- `# 10. Output Mapping Rules` — renumbered from 9
- `# 11. Decision Labels` — renumbered from 10
- `# 12. Domain Selection Guidance` — renumbered from 11
- `# 13. Final Operating Principle` — renumbered from 12

Insert the following content **immediately before** the line `# 8. Industry-Specific and High-Sensitivity Activation Layer`:

```markdown
# 8. Software Resilience Foundation (Layer 0)

These domains establish the minimum software engineering and security hygiene required before compliance analysis is meaningful. They target solo developers and small teams who may lack formal software engineering training.

When Layer 0 checks detect severe issues (e.g., no version control discipline, secrets in code, no tests), LLLL should insert a Foundation Alert at the top of the output:

> ⚠️ Foundation Alert: Software resilience issues detected that undermine compliance posture.
> Resolve Layer 0 findings before investing in Layer 2 compliance work.

Layer 0 domains are always active for all projects.

---

## N. Software Engineering Fundamentals

### N1. Version control discipline
Check:
- whether a branching strategy exists (vs direct-to-main commits only)
- whether meaningful commit messages are used
- whether the main/production branch has protection rules (no force-push, require PR)
- whether work-in-progress is recoverable (branches, stash, not only local uncommitted changes)
- whether the team can identify what code is running in production at any given time

Evidence:
- git branch list
- branch protection rules (GitHub/GitLab settings)
- commit message history
- deployment tags or release branches

Priority:
- High

Applicability:
- all software projects using version control

### N2. Rollback and recovery capability
Check:
- whether the team can roll back any release to the previous known-good state
- whether database migrations are reversible
- whether deployments are atomic or can leave the system in a partial state
- whether a "break glass" emergency recovery procedure exists
- whether backups exist and have been tested

Evidence:
- rollback runbook or procedure
- migration scripts (up and down)
- deployment configuration
- backup schedule and test records

Priority:
- High

Applicability:
- all software projects with production deployments

### N3. Knowledge continuity and bus factor
Check:
- whether system architecture is documented anywhere (even a diagram or README section)
- whether onboarding documentation exists for new contributors
- whether credentials and secrets are managed centrally (not in one person's head or personal accounts)
- whether the bus factor is greater than 1 (more than one person can maintain the system)
- whether development handoff documentation exists

Evidence:
- architecture diagram or description
- onboarding guide
- secrets manager or shared vault
- CODEOWNERS file
- contributor documentation

Priority:
- High

Applicability:
- all software projects

### N4. Testing existence
Check:
- whether any automated tests exist (unit, integration, or end-to-end)
- whether critical user paths have test coverage
- whether tests run before deployment (CI gate)
- whether manual QA processes exist for releases
- whether test results are recorded or tracked

Evidence:
- test files in repository
- CI/CD configuration with test step
- test coverage reports
- QA checklist or sign-off process

Priority:
- High

Applicability:
- all software projects

### N5. CI/CD and release process
Check:
- whether builds are automated (not manual compilation or packaging)
- whether deployment is repeatable and documented
- whether staging or preview environments exist
- whether releases are tagged and traceable to specific commits
- whether the release process is documented enough for anyone on the team to execute

Evidence:
- CI/CD pipeline configuration (GitHub Actions, GitLab CI, etc.)
- deployment scripts or documentation
- staging environment URL or configuration
- release tags in git
- release checklist

Priority:
- Medium

Applicability:
- all software projects with production deployments

### N6. Repository hygiene
Check:
- whether `.gitignore` covers sensitive files (`.env`, credentials, private keys, IDE configs)
- whether sensitive files have ever been committed to git history (even if later removed)
- whether the repository has a CODEOWNERS file for critical paths
- whether GitHub Actions or CI secrets are used instead of hardcoded values
- whether the repository README provides enough context to understand the project

Evidence:
- `.gitignore` file
- `git log` search for sensitive file patterns
- CODEOWNERS file
- CI/CD configuration
- README.md

Priority:
- Critical

Applicability:
- all software projects using git

### N7. Development environment security
Check:
- whether IDE plugins and extensions come from trusted sources
- whether AI code generation tools (Claude Code, Cursor, Copilot, etc.) output is reviewed before merging
- whether local development environments are isolated from production
- whether development dependencies are separated from production dependencies
- whether developer machines have basic security hygiene (disk encryption, screen lock, updated OS)

Evidence:
- IDE extension list
- code review process for AI-generated code
- environment separation documentation
- package.json devDependencies vs dependencies (or equivalent)

Priority:
- Medium

Applicability:
- all software projects

---

## O. Open Source and Licensing Risk

### O1. Project license selection
Check:
- whether the project has a LICENSE file
- whether the chosen license matches the intended business model (commercial, open-core, SaaS, etc.)
- whether the team understands the implications of their license choice:
  - MIT/Apache 2.0: permissive — anyone can use, modify, redistribute commercially
  - GPL/AGPL: copyleft — derivative works must use the same license
  - No license file: default copyright — others cannot legally use, modify, or distribute
  - "Source available" vs "open source": different legal and community implications
- whether the license choice has been reviewed against the monetization strategy

Evidence:
- LICENSE file in repository root
- README license section
- business model documentation
- legal review records

Priority:
- High

Applicability:
- all software projects, especially those planning commercial distribution

### O2. Copyleft contamination detection
Check:
- whether any direct or transitive dependency uses GPL, AGPL, LGPL, or other copyleft licenses
- whether AGPL dependencies are used in network-accessible services (AGPL triggers on network use, not just distribution)
- whether copyleft obligations would force disclosure of proprietary source code
- whether the team has evaluated the "linking" boundary for LGPL dependencies
- whether copyleft risk is monitored when new dependencies are added

Evidence:
- dependency license audit (npm, pip, cargo, go modules)
- license scanner output
- legal opinion on copyleft exposure

Priority:
- Critical

Applicability:
- all projects with third-party dependencies, especially commercial or proprietary projects

### O3. License compatibility matrix
Check:
- whether all dependency licenses are compatible with each other
- whether all dependency licenses are compatible with the project's own license
- whether license compatibility has been verified for the distribution method (binary, SaaS, library, etc.)
- common incompatibilities to check:
  - Apache 2.0 + GPLv2 (incompatible)
  - MIT + GPLv3 (compatible but output must be GPLv3)
  - Multiple copyleft licenses with conflicting terms

Evidence:
- license compatibility analysis
- dependency tree with license annotations
- distribution plan

Priority:
- High

Applicability:
- projects with multiple third-party dependencies

### O4. Contributor license and IP ownership
Check:
- whether contributor IP assignment or CLA (Contributor License Agreement) exists
- whether external contributions (PRs from non-team members) have clear IP terms
- whether the project could transition from open-source to commercial without contributor consent issues
- whether employment agreements cover IP ownership for code written by team members

Evidence:
- CLA document or bot (e.g., CLA Assistant)
- CONTRIBUTING.md with IP terms
- employment/contractor agreements
- GitHub repository contributor list

Priority:
- Medium

Applicability:
- projects accepting external contributions, projects planning license changes or commercial transitions
```

### Step 1.3 — Renumber existing sections 8-12 to 9-13

Find and replace the following section headers in order:

1. `# 12. Final Operating Principle` → `# 13. Final Operating Principle`
2. `# 11. Domain Selection Guidance` → `# 12. Domain Selection Guidance`
3. `# 10. Decision Labels for Structured Outputs` → `# 11. Decision Labels for Structured Outputs`
4. `# 9. Output Mapping Rules` → `# 10. Output Mapping Rules`
5. `# 8. Industry-Specific and High-Sensitivity Activation Layer` → `# 9. Industry-Specific and High-Sensitivity Activation Layer`

**Important:** Renumber in reverse order (12→13 first, then 11→12, etc.) to avoid double-renumbering.

### Step 1.4 — Update Domain Selection Guidance

Read the (now renumbered) `# 12. Domain Selection Guidance` section. Update LLLL's domain selection instructions to include Layer 0:

Find the text:
```
- select only relevant domains for the current context
- NOT dump the full checklist — surface only triggered checks
- map the analysis chain: system → domains → obligations → gaps → actions → owners
```

Replace with:
```
- select only relevant domains for the current context
- NOT dump the full checklist — surface only triggered checks
- map the analysis chain: system → domains → obligations → gaps → actions → owners
- always evaluate Layer 0 domains (N, O) first — software resilience issues undermine all other compliance work
- when Layer 0 findings are Critical or High, insert Foundation Alert before main analysis
```

### Verification 1

Run from `/Users/vox/LLLL`:

```bash
# Check new domains exist
grep -c "^## N\." compliance-checklist-master.md | grep -q "1" && echo "PASS: Domain N exists" || echo "FAIL: Domain N missing"
grep -c "^## O\." compliance-checklist-master.md | grep -q "1" && echo "PASS: Domain O exists" || echo "FAIL: Domain O missing"

# Check all N checks exist (N1-N7)
for i in 1 2 3 4 5 6 7; do grep -q "^### N${i}\." compliance-checklist-master.md && echo "PASS: N${i}" || echo "FAIL: N${i}"; done

# Check all O checks exist (O1-O4)
for i in 1 2 3 4; do grep -q "^### O${i}\." compliance-checklist-master.md && echo "PASS: O${i}" || echo "FAIL: O${i}"; done

# Check section renumbering
grep -q "^# 9\. Industry-Specific" compliance-checklist-master.md && echo "PASS: Section 9 renumbered" || echo "FAIL: Section 9"
grep -q "^# 13\. Final Operating Principle" compliance-checklist-master.md && echo "PASS: Section 13 renumbered" || echo "FAIL: Section 13"

# Check Layer 0 header exists
grep -q "^# 8\. Software Resilience Foundation" compliance-checklist-master.md && echo "PASS: Layer 0 header" || echo "FAIL: Layer 0 header"

# Check Foundation Alert text exists
grep -q "Foundation Alert" compliance-checklist-master.md && echo "PASS: Foundation Alert" || echo "FAIL: Foundation Alert"

# Check no old section 8 header remains
grep -c "^# 8\. Industry" compliance-checklist-master.md | grep -q "0" && echo "PASS: Old section 8 gone" || echo "FAIL: Old section 8 still exists"
```

**All checks must print PASS. Do not proceed to Phase 2 if any check fails.**

---

## Phase 2 — Deepen Domain B (B5-B9) + Domain C (C4-C9)

**Goal:** Add tactical OWASP-level security checks to Domain B and expand Domain C to cover the full upstream/midstream/downstream supply chain model.

**File:** `compliance-checklist-master.md`

### Step 2.1 — Read current Domain B and C sections

Read `compliance-checklist-master.md` from the start of Domain B (around line 183) through the end of Domain C (around line 326) to see the exact current content.

### Step 2.2 — Add B5-B9 after existing B4

Find the end of the B4 section. B4 ends with:
```
Applicability:
- most software systems

---
```

(The `---` is followed by `## C. Software Supply Chain`.)

Insert the following **between** the B4 `Applicability` block and the `---` separator before Domain C:

```markdown

### B5. Injection defense
Check:
- whether parameterized queries or ORM are used for all database operations (no raw SQL string concatenation)
- whether user input is never passed to `eval()`, `exec()`, `os.system()`, `child_process.exec()`, or equivalent shell/code execution functions
- whether template engines use auto-escaping by default
- whether LDAP, XPath, and NoSQL queries are parameterized where applicable
- whether server-side template injection (SSTI) is prevented

Evidence:
- code search for raw SQL concatenation patterns
- code search for eval/exec/system calls with user input
- ORM or query builder configuration
- template engine auto-escape settings
- security test cases for injection vectors

Priority:
- Critical

Applicability:
- all applications processing user input

OWASP mapping: A03:2021 Injection

### B6. Cross-site scripting (XSS) and output encoding
Check:
- whether output encoding is applied for all user-controlled content rendered in HTML
- whether `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, or equivalent raw HTML insertion is avoided or sanitized
- whether Content Security Policy (CSP) headers are configured
- whether DOM-based XSS vectors are addressed (e.g., `document.write`, `location.href` with user input)
- whether stored XSS is prevented in user-generated content flows

Evidence:
- code search for innerHTML/dangerouslySetInnerHTML/v-html usage
- CSP header configuration
- output encoding middleware or framework settings
- XSS test cases

Priority:
- High

Applicability:
- web applications rendering user-controlled content

OWASP mapping: A03:2021 Injection (XSS subcategory)

### B7. Sensitive data exposure and cryptographic failures
Check:
- whether passwords are hashed with a strong algorithm (bcrypt, argon2, scrypt — NOT MD5, SHA1, plain SHA256)
- whether HTTPS is enforced for all endpoints (HSTS headers, HTTP redirect)
- whether sensitive data at rest is encrypted (database fields, file storage)
- whether error messages avoid exposing stack traces, internal paths, or database details to users
- whether API responses avoid leaking data beyond what the requester should see (over-fetching)
- whether cryptographic keys and certificates are properly managed and rotated

Evidence:
- password hashing implementation
- TLS/HTTPS configuration
- error handling middleware
- API response schema review
- key management documentation

Priority:
- High

Applicability:
- all applications handling credentials, personal data, or sensitive information

OWASP mapping: A02:2021 Cryptographic Failures

### B8. Security misconfiguration
Check:
- whether debug mode is disabled in production
- whether default credentials are changed (admin/admin, default database passwords)
- whether unnecessary ports, services, and endpoints are disabled
- whether CORS is configured restrictively (not `Access-Control-Allow-Origin: *` in production)
- whether directory listing is disabled on web servers
- whether security headers are set (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- whether cloud infrastructure follows least-privilege (S3 buckets not public, IAM roles scoped)

Evidence:
- production configuration files
- CORS configuration
- HTTP response headers
- cloud IAM policies
- infrastructure-as-code review

Priority:
- High

Applicability:
- all deployed applications and infrastructure

OWASP mapping: A05:2021 Security Misconfiguration

### B9. Secrets management
Check:
- whether secrets (API keys, database passwords, tokens) are stored in environment variables or a secrets manager — NOT hardcoded in source code
- whether `.env` files are in `.gitignore` and have never been committed to git history
- whether API keys are absent from frontend bundles (client-side JavaScript)
- whether secret rotation procedures exist
- whether secrets follow the principle of least privilege (each service gets only the secrets it needs)
- whether common secret patterns are absent from code: `sk-`, `AKIA`, `ghp_`, `-----BEGIN PRIVATE KEY`, `password=`, `secret=`

Evidence:
- `.gitignore` contents
- `git log` search for `.env` or secret patterns
- environment variable configuration
- secrets manager setup (AWS Secrets Manager, HashiCorp Vault, Doppler, etc.)
- frontend bundle analysis

Priority:
- Critical

Applicability:
- all software projects

```

### Step 2.3 — Restructure Domain C with upstream/midstream/downstream model

Find the Domain C section header:
```
## C. Software Supply Chain and Component Transparency
```

Replace the **entire Domain C section** (from `## C. Software Supply Chain and Component Transparency` up to but NOT including `## D. Privacy and Personal Data Protection`) with the following expanded version:

```markdown
## C. Software Supply Chain and Component Transparency

LLLL evaluates supply chain security across three segments:
- **Upstream** (what you pull in): dependencies, tools, SDKs, registries
- **Midstream** (how components interact): service-to-service trust, integration security
- **Downstream** (how you deliver): distribution channels, update mechanisms

### Upstream Supply Chain

### C1. Dependency inventory and SBOM
Check:
- whether dependency inventory exists
- whether SBOM exists
- whether third-party versions are tracked
- whether known vulnerabilities are monitored (Dependabot, Snyk, npm audit, pip audit, etc.)
- whether build outputs are traceable to source

Evidence:
- SBOM
- dependency lock files (package-lock.json, Pipfile.lock, Cargo.lock, go.sum)
- SCA reports
- build pipeline logs
- vulnerability monitoring alerts

Priority:
- High

Applicability:
- projects using third-party packages, containers, SDKs

### C2. Open source license compliance
Check:
- whether component licenses are identified
- whether copyleft obligations are understood (links to Domain O for detailed analysis)
- whether attribution or NOTICE obligations are preserved
- whether distribution obligations are handled
- whether SPDX usage exists where appropriate

Evidence:
- license inventory
- NOTICE files
- SPDX headers
- open source policy

Priority:
- Medium to High

Applicability:
- projects using open source components

### C3. Build integrity and provenance
Check:
- whether build provenance is tracked
- whether artifacts are signed if appropriate
- whether dependency sources are trusted (official registries, not mirrors or forks)
- whether package intake is controlled (lockfiles committed, no floating versions)
- whether CI/CD pipeline itself is secured (not modifiable by unauthorized users)

Evidence:
- CI/CD config
- artifact signing records
- package source policy
- supply chain controls
- lockfile presence and commit status

Priority:
- High

Applicability:
- production systems, enterprise software, distributed software

### C4. Development toolchain security
Check:
- whether package registries are verified (npm, PyPI, crates.io — not unofficial mirrors)
- whether typosquatting risk is assessed for critical dependencies (e.g., `lodash` vs `lodahs`)
- whether lockfiles are committed and used for reproducible builds
- whether AI code generation tools (Claude Code, Cursor, Copilot, etc.) are configured with appropriate security settings
- whether IDE extensions and plugins come from verified publishers
- whether pre-commit hooks or CI checks validate dependency integrity

Evidence:
- lockfile presence in repository
- package registry configuration
- AI tool security settings
- IDE extension audit
- pre-commit hook configuration

Priority:
- Medium

Applicability:
- all software projects

### C5. SDK and API provider risk
Check:
- whether third-party SDK data collection terms are understood (what data the SDK sends to the provider)
- whether vendor lock-in is assessed (cost of switching providers)
- whether API provider stability is evaluated (uptime SLA, deprecation policy, pricing stability)
- whether provider terms of service permit the intended use case
- whether fallback or degradation behavior exists if a provider becomes unavailable

Evidence:
- SDK documentation and privacy policy
- provider terms of service
- architecture diagram showing provider dependencies
- fallback implementation
- vendor evaluation records

Priority:
- Medium to High

Applicability:
- projects using third-party APIs or SDKs (OpenAI, Stripe, Firebase, Auth0, Twilio, etc.)

### Midstream Supply Chain

### C6. Service-to-service trust boundaries
Check:
- whether internal service-to-service communication is authenticated (not open/unauthenticated internal APIs)
- whether mTLS or equivalent is used for inter-service transport security
- whether data classification boundaries are respected across services (PII does not flow to services that should not process it)
- whether east-west traffic (lateral movement between services) is controlled
- whether each service follows least-privilege for data access

Evidence:
- service mesh or API gateway configuration
- internal API authentication scheme
- data flow diagram
- network segmentation rules
- service-level access control policies

Priority:
- High

Applicability:
- multi-service architectures, microservices, systems with internal APIs

### C7. Third-party integration security
Check:
- whether inbound webhooks verify sender authenticity (signature validation, shared secret)
- whether OAuth flows use PKCE and state parameters
- whether API keys for integrations are scoped to minimum required permissions
- whether callback/redirect URLs are validated (open redirect prevention)
- whether third-party integration failures are handled gracefully (no data loss, no silent failures)

Evidence:
- webhook handler implementation
- OAuth configuration
- API key permission scopes
- callback URL validation logic
- integration error handling

Priority:
- High

Applicability:
- systems receiving webhooks, using OAuth, or integrating with third-party APIs

### Downstream Supply Chain

### C8. Distribution channel security
Check:
- whether distribution accounts have strong authentication (2FA on npm, PyPI, Docker Hub, App Store, etc.)
- whether published artifacts are signed or verified
- whether CDN-delivered assets have integrity checks (Subresource Integrity hashes)
- whether the publishing process is automated and auditable (not manual uploads from personal machines)
- whether release artifacts match what was built in CI (reproducible builds)

Evidence:
- distribution account security settings
- artifact signing configuration
- CDN SRI hash implementation
- CI/CD publishing pipeline
- release artifact checksums

Priority:
- High

Applicability:
- projects publishing packages, Docker images, browser assets, or mobile apps

### C9. Update and patch delivery
Check:
- whether auto-update mechanisms use code signing to verify authenticity
- whether users can roll back to a previous version if an update causes issues
- whether critical security patches can be delivered on an emergency timeline
- whether update notifications inform users about what changed and why
- whether the update channel itself is secure (HTTPS, certificate pinning)

Evidence:
- auto-update implementation
- code signing configuration
- rollback mechanism
- changelog or release notes process
- update delivery security

Priority:
- Medium

Applicability:
- desktop applications, mobile apps, CLI tools, self-hosted software with update mechanisms
```

### Verification 2

```bash
# Check B5-B9 exist
for i in 5 6 7 8 9; do grep -q "^### B${i}\." compliance-checklist-master.md && echo "PASS: B${i}" || echo "FAIL: B${i}"; done

# Check C4-C9 exist
for i in 4 5 6 7 8 9; do grep -q "^### C${i}\." compliance-checklist-master.md && echo "PASS: C${i}" || echo "FAIL: C${i}"; done

# Check OWASP mapping annotations exist
grep -c "OWASP mapping:" compliance-checklist-master.md | xargs -I{} test {} -ge 4 && echo "PASS: OWASP mappings" || echo "FAIL: OWASP mappings"

# Check supply chain segment headers exist
grep -q "### Upstream Supply Chain" compliance-checklist-master.md && echo "PASS: Upstream" || echo "FAIL: Upstream"
grep -q "### Midstream Supply Chain" compliance-checklist-master.md && echo "PASS: Midstream" || echo "FAIL: Midstream"
grep -q "### Downstream Supply Chain" compliance-checklist-master.md && echo "PASS: Downstream" || echo "FAIL: Downstream"

# Check Domain D still exists and is intact (not accidentally overwritten)
grep -q "^## D\. Privacy and Personal Data Protection" compliance-checklist-master.md && echo "PASS: Domain D intact" || echo "FAIL: Domain D damaged"

# Check total domain count (A through O = 15 domain headers)
DOMAIN_COUNT=$(grep -c "^## [A-O]\." compliance-checklist-master.md)
test "$DOMAIN_COUNT" -eq 15 && echo "PASS: 15 domains (A-O)" || echo "FAIL: Found $DOMAIN_COUNT domains, expected 15"
```

**All checks must print PASS. Do not proceed to Phase 3 if any check fails.**

---

## Phase 3 — `/llll scan` Command + scan-patterns.md

**Goal:** Add a new automated scanning command to LLLL that leverages Claude Code's Bash, Grep, and Glob tools to perform concrete security and hygiene checks. Create the scan pattern reference file.

**Files:** `SKILL.md`, `scan-patterns.md` (new)

### Step 3.1 — Create scan-patterns.md

Create the new file `/Users/vox/LLLL/scan-patterns.md` with the following content:

```markdown
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
[2] /llll scan (re-scan after fixes)
[3] /llll grc (GRC dashboard)
[4] /llll
[5] /llll deep
```
```

### Step 3.2 — Update SKILL.md frontmatter

In `SKILL.md`, find line 6:
```
allowed-tools: Read, Grep, Glob
```

Replace with:
```
allowed-tools: Read, Grep, Glob, Bash
```

### Step 3.3 — Add `/llll scan` to SKILL.md Mode System

Read the Mode System section of SKILL.md (around lines 358-469). Find the end of the `/llll deep` mode definition (the last mode before the Next Steps Menu section). Insert the following three new mode definitions after `/llll deep` and before `## MANDATORY NEXT STEPS MENU`:

```markdown

### /llll scan — Automated Security and Hygiene Scan

Scan patterns reference: `scan-patterns.md`

This mode uses Bash, Grep, and Glob tools to perform concrete, executable security and hygiene checks against the actual codebase. Unlike other modes that reason about compliance posture, `/llll scan` produces findings backed by specific file locations and command outputs.

MUST:
1. Detect tech stack (check for package.json, requirements.txt, Cargo.toml, go.mod, Gemfile, Dockerfile)
2. Run applicable scans from scan-patterns.md in this order:
   a. Git hygiene checks (GIT-001 through GIT-007)
   b. Secret detection (SEC-001 through SEC-008)
   c. OWASP code pattern scan (OWA-001 through OWA-015)
   d. Dependency audit (tech-stack-specific command)
   e. License risk scan (tech-stack-specific command)
   f. Dockerfile security (if Dockerfile exists)
3. Classify each finding by severity (Critical/High/Medium/Low) and map to domain check ID
4. Identify which findings are auto-fixable
5. Produce structured scan report per scan-patterns.md output structure

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

Folding rules: Same as all other modes. Basic folds Medium/Low findings (show 2, fold rest with names). Pro/Team show all.

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
```

### Step 3.4 — Update SKILL.md Required Operating Flow

Find in SKILL.md the section `### Step 2 — Select compliance domains` and its priority order list. Add Layer 0 as priority 0:

Find:
```
Priority order:
1. Universal domains (A-E)
2. Business model domains (F-H)
3. Industry / high-sensitivity activation (M)
4. AI domains (I-K)
5. Mobile domains (L)
```

Replace with:
```
Priority order:
0. Layer 0 — Software Resilience Foundation (N-O) — always first
1. Universal domains (A-E)
2. Business model domains (F-H)
3. Industry / high-sensitivity activation (M)
4. AI domains (I-K)
5. Mobile domains (L)
```

### Step 3.5 — Update SKILL.md Domain Activation

Find in SKILL.md the `#### Always Active` list and add N and O:

Find:
```
#### Always Active
- A (Project Governance) — all projects
- B (Application Security) — all projects with users
- C (Supply Chain) — all projects with dependencies
- D (Privacy) — all projects processing personal data
```

Replace with:
```
#### Always Active
- N (Software Engineering Fundamentals) — all projects (Layer 0)
- O (Open Source & Licensing Risk) — all projects with dependencies or LICENSE file (Layer 0)
- A (Project Governance) — all projects
- B (Application Security) — all projects with users
- C (Supply Chain) — all projects with dependencies
- D (Privacy) — all projects processing personal data
```

### Step 3.6 — Add Foundation Alert to SKILL.md

Find in SKILL.md the text block for `### Step 4 — Perform structured analysis`. Insert a new sub-step before the logic chain. Find:

```
### Step 4 — Perform structured analysis

Follow the logic chain:
```

Replace with:

```
### Step 4 — Perform structured analysis

#### Foundation Alert (Layer 0 pre-check)

Before producing the main analysis, evaluate Layer 0 domains (N, O). If any Layer 0 finding is Critical or High severity, insert at the top of the output (after Output Mode header and registration hint):

```
⚠️ Foundation Alert: Software resilience issues detected that undermine compliance posture.
Resolve Layer 0 findings before investing in Layer 2 compliance work.
```

This alert does not block the full analysis — it provides context that Layer 2 compliance results should be interpreted cautiously until Layer 0 issues are resolved.

#### Analysis logic chain

Follow the logic chain:
```

### Step 3.7 — Update Next Steps Menu in SKILL.md

Find the Next Steps Menu format definitions. Each mode's menu lists 5-6 options. Add the new commands to the menus. Find the first menu example (from `/llll`):

Find:
```
From `/llll`:
```
Next:
[1] Continue
[2] /llll deep
[3] /llll checklist
[4] /llll brief
[5] /llll diff
[6] 🟢 Upgrade to Pro to unlock the full power of Layrix →
```
```

Replace with:
```
From `/llll`:
```
Next:
[1] Continue
[2] /llll deep
[3] /llll checklist
[4] /llll brief
[5] /llll diff
[6] /llll scan
[7] /llll grc
[8] 🟢 Upgrade to Pro to unlock the full power of Layrix →
```
```

**Repeat this pattern** for all 5 existing mode menus (from `/llll`, `/llll deep`, `/llll checklist`, `/llll brief`, `/llll diff`). In each menu, add `[6] /llll scan` and `[7] /llll grc`, and move the upgrade item to `[8]`. The current mode should be replaced with `/llll` as before. Also add menus for the 3 new modes:

```
From `/llll scan`:
```
Next:
[1] /llll fix [highest finding]
[2] /llll scan (re-scan)
[3] /llll grc
[4] /llll
[5] /llll deep
[6] /llll checklist
[7] /llll brief
[8] 🟢 Upgrade to Pro to unlock the full power of Layrix →
```

From `/llll fix`:
```
Next:
[1] /llll scan (verify fix)
[2] /llll fix [next finding]
[3] /llll grc
[4] /llll
[5] /llll deep
[6] 🟢 Upgrade to Pro to unlock the full power of Layrix →
```

From `/llll grc`:
```
Next:
[1] Continue
[2] /llll scan
[3] /llll deep
[4] /llll checklist
[5] /llll brief
[6] /llll diff
[7] 🟢 Upgrade to Pro to unlock the full power of Layrix →
```
```

Also update the Pro/Team menus (no upgrade item) with the same additional commands.

### Verification 3

```bash
# Check scan-patterns.md was created
test -f /Users/vox/LLLL/scan-patterns.md && echo "PASS: scan-patterns.md exists" || echo "FAIL: scan-patterns.md missing"

# Check scan-patterns.md has all sections
grep -q "Secret Detection Patterns" /Users/vox/LLLL/scan-patterns.md && echo "PASS: Secret patterns" || echo "FAIL: Secret patterns"
grep -q "OWASP Code Pattern" /Users/vox/LLLL/scan-patterns.md && echo "PASS: OWASP patterns" || echo "FAIL: OWASP patterns"
grep -q "License Risk Scan" /Users/vox/LLLL/scan-patterns.md && echo "PASS: License patterns" || echo "FAIL: License patterns"
grep -q "Dockerfile Security" /Users/vox/LLLL/scan-patterns.md && echo "PASS: Dockerfile patterns" || echo "FAIL: Dockerfile patterns"

# Check SKILL.md frontmatter updated
grep -q "allowed-tools: Read, Grep, Glob, Bash" /Users/vox/LLLL/SKILL.md && echo "PASS: Bash in allowed-tools" || echo "FAIL: Bash not in allowed-tools"

# Check new modes exist in SKILL.md
grep -q "/llll scan" /Users/vox/LLLL/SKILL.md && echo "PASS: scan mode" || echo "FAIL: scan mode"
grep -q "/llll fix" /Users/vox/LLLL/SKILL.md && echo "PASS: fix mode" || echo "FAIL: fix mode"
grep -q "/llll grc" /Users/vox/LLLL/SKILL.md && echo "PASS: grc mode" || echo "FAIL: grc mode"

# Check Layer 0 priority in domain selection
grep -q "Layer 0" /Users/vox/LLLL/SKILL.md && echo "PASS: Layer 0 in SKILL.md" || echo "FAIL: Layer 0 missing"

# Check N and O in Always Active list
grep -q "N (Software Engineering Fundamentals)" /Users/vox/LLLL/SKILL.md && echo "PASS: N in Always Active" || echo "FAIL: N not in Always Active"
grep -q "O (Open Source" /Users/vox/LLLL/SKILL.md && echo "PASS: O in Always Active" || echo "FAIL: O not in Always Active"

# Check Foundation Alert in SKILL.md
grep -q "Foundation Alert" /Users/vox/LLLL/SKILL.md && echo "PASS: Foundation Alert in SKILL.md" || echo "FAIL: Foundation Alert missing"

# Check updated menus include scan and grc
grep -c "/llll scan" /Users/vox/LLLL/SKILL.md | xargs -I{} test {} -ge 5 && echo "PASS: scan in menus" || echo "FAIL: scan not in enough menus"
grep -c "/llll grc" /Users/vox/LLLL/SKILL.md | xargs -I{} test {} -ge 5 && echo "PASS: grc in menus" || echo "FAIL: grc not in enough menus"
```

**All checks must print PASS. Do not proceed to Phase 4 if any check fails.**

---

## Phase 4 — Update SKILL.md Remaining Sections

**Goal:** Update the Internal Data Model, Completion Standard, and description frontmatter in SKILL.md to reflect the expanded system.

**File:** `SKILL.md`

### Step 4.1 — Update SKILL.md description in frontmatter

Find line 2 of SKILL.md:
```
description: LLLL (Layrix Logic Layer Loop) — Embedded Compliance Layer for AI-built software. Continuously active compliance engine integrated into development workflows — performing feature-to-policy mapping, compliance diagnosis, gap detection, checklist generation, actionable briefs, and design-time governance.
```

Replace with:
```
description: LLLL (Layrix Logic Layer Loop) — Embedded Compliance Layer for AI-built software. Continuously active compliance engine integrated into development workflows — performing software resilience auditing, automated security scanning, feature-to-policy mapping, compliance diagnosis, gap detection, checklist generation, actionable briefs, GRC dashboards, and design-time governance.
```

### Step 4.2 — Update Internal Data Model

Find in SKILL.md the Internal Data Model section. Find:

```
Feature:
- name
- type
- risk_level
- triggered_domains

Policy:
- name
- coverage_scope
- evidence_status (OBSERVED / INFERRED / MISSING EVIDENCE)

Gap:
- feature
- missing_check (checklist master ID, e.g. D2, I1)
- severity (Critical / High / Medium / Low)
- label (NEEDS BUSINESS DECISION / NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT / NEEDS TECHNICAL CONFIRMATION)
```

Replace with:

```
Feature:
- name
- type
- risk_level
- triggered_domains

Policy:
- name
- coverage_scope
- evidence_status (OBSERVED / INFERRED / MISSING EVIDENCE)

Gap:
- feature
- missing_check (checklist master ID, e.g. D2, I1, N6, O2)
- severity (Critical / High / Medium / Low)
- label (NEEDS BUSINESS DECISION / NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT / NEEDS TECHNICAL CONFIRMATION)
- layer (0 = resilience, 1 = security, 2 = compliance)

ScanFinding:
- finding_id (e.g. SEC-001, OWA-003, GIT-002)
- pattern_source (scan-patterns.md reference)
- severity (Critical / High / Medium / Low)
- domain_check (mapped checklist master ID)
- location (file:line or command output)
- auto_fixable (true / false)
- fix_description (remediation steps)
```

### Step 4.3 — Update Completion Standard

Find in SKILL.md the Completion Standard section. Find:

```
User should feel:

- "I understand my system"
- "I know what compliance domains apply to me"
- "I know what I'm missing"
- "I know exactly what to do next"
- "I can hand this to a compliance expert or legal professional and they can act on it"
- "Compliance is continuously tracked as my product evolves"
- "I have confidence in my compliance posture"
```

Replace with:

```
User should feel:

- "I understand my system"
- "I know whether my software engineering foundation is solid"
- "I know what security vulnerabilities exist in my code right now"
- "I know what compliance domains apply to me"
- "I know what I'm missing"
- "I know exactly what to do next — and LLLL can fix some of it for me"
- "I can hand this to a compliance expert or legal professional and they can act on it"
- "Compliance is continuously tracked as my product evolves"
- "I have confidence in my compliance posture from code to governance"
```

### Step 4.4 — Update Compliance Artifacts list

Find in SKILL.md:

```
LLLL can generate these deliverables:

- Compliance requirement lists
- Terms/policy generation guidance
- Structured compliance briefs
- Change tickets
- Checklist inputs
```

Replace with:

```
LLLL can generate these deliverables:

- Compliance requirement lists
- Terms/policy generation guidance
- Structured compliance briefs
- Change tickets
- Checklist inputs
- Automated scan reports with file:line findings
- Auto-fix code changes for security findings
- GRC dashboards aggregating governance, risk, and compliance status
- License risk matrices
- Supply chain security assessments (upstream/midstream/downstream)
```

### Verification 4

```bash
# Check updated description
grep -q "software resilience auditing" /Users/vox/LLLL/SKILL.md && echo "PASS: Updated description" || echo "FAIL: Description not updated"

# Check ScanFinding model exists
grep -q "ScanFinding:" /Users/vox/LLLL/SKILL.md && echo "PASS: ScanFinding model" || echo "FAIL: ScanFinding model missing"

# Check layer field in Gap model
grep -q "layer (0 = resilience" /Users/vox/LLLL/SKILL.md && echo "PASS: Layer field in Gap" || echo "FAIL: Layer field missing"

# Check updated completion standard
grep -q "software engineering foundation is solid" /Users/vox/LLLL/SKILL.md && echo "PASS: Updated completion standard" || echo "FAIL: Completion standard not updated"

# Check updated artifacts list
grep -q "Automated scan reports" /Users/vox/LLLL/SKILL.md && echo "PASS: Scan reports in artifacts" || echo "FAIL: Scan reports missing"
grep -q "GRC dashboards" /Users/vox/LLLL/SKILL.md && echo "PASS: GRC in artifacts" || echo "FAIL: GRC missing"
grep -q "License risk matrices" /Users/vox/LLLL/SKILL.md && echo "PASS: License matrices in artifacts" || echo "FAIL: License matrices missing"
```

**All checks must print PASS. Do not proceed to Phase 5 if any check fails.**

---

## Phase 5 — Update Schema, Templates, Examples, Changelog, TODO, README

**Goal:** Update all supporting files to reflect the v4.0 changes: new domains in schema, new output templates for scan/fix/grc, new examples, and updated project documentation.

**Files:** `checklist-schema.md`, `output-templates.md`, `examples.md`, `CHANGELOG.md`, `TODO.md`, `README.md`

### Step 5.1 — Update checklist-schema.md

Read `checklist-schema.md` fully. Add two new schema categories for Domain N and Domain O, following the exact pattern of existing categories.

Insert after the last numbered category (currently `### 14. Sensitive Sector — Domain M`) and before `## Decision Matrix`:

```markdown
### 15. Software Engineering Fundamentals — Domain N

| Input | Status | Owner |
|-------|--------|-------|
| Version control discipline (branching, commit quality, branch protection) | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| Rollback and recovery capability | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| Knowledge continuity and bus factor | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |
| Testing existence (automated tests, CI gate) | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| CI/CD and release process | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| Repository hygiene (.gitignore, no secrets in history) | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| Development environment security | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |

### 16. Open Source and Licensing Risk — Domain O

| Input | Status | Owner |
|-------|--------|-------|
| Project license selection and business model alignment | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |
| Copyleft contamination (GPL/AGPL in dependencies) | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| License compatibility matrix | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| Contributor license and IP ownership | KNOWN / UNKNOWN / NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT | Compliance expert |
```

Also update the Decision Matrix example table to include one N and one O example row:

Find the Decision Matrix table and add these rows at the end:

```
| Repository hygiene | N6 | NEEDS TECHNICAL CONFIRMATION | Engineering | Check .gitignore and git history for secrets |
| Copyleft contamination | O2 | UNKNOWN | Engineering | No license audit has been performed |
```

### Step 5.2 — Update output-templates.md

Read `output-templates.md` fully. Add three new templates at the end of the file (after Template 8, before the final line):

```markdown
---

## 9. Scan Report Template (`/llll scan`)

```
Output Mode: LLLL [level]
```

### Scan Metadata

| Field | Value |
|-------|-------|
| Target | [repository path] |
| Time | [ISO 8601] |
| Tech stack | [detected] |
| Scan duration | [seconds] |

### Findings Summary

| Severity | Count | Auto-fixable |
|----------|-------|-------------|
| 🔴🔴 Critical | N | N |
| 🔴 High | N | N |
| 🟡 Medium | N | N |
| 🟢 Low | N | N |

### Layer 0 — Software Resilience Findings

[Git hygiene, version control, repo config findings]

### Layer 1 — Security Posture Findings

[Secrets, OWASP patterns, dependency vulnerabilities, license risks]

### Detailed Findings

#### [FINDING-ID]: [Title]
- **Severity:** 🔴🔴 **Critical** / 🔴 **High** / 🟡 **Medium** / 🟢 **Low**
- **Domain:** [N/O/B/C] — Check [ID]
- **Location:** `file:line` or command output
- **Description:** [What was found]
- **Risk:** [What could go wrong]
- **Fix:** [Specific remediation steps]
- **Auto-fixable:** Yes → `/llll fix [FINDING-ID]` / No → manual fix required

**LLLL Basic:** Critical + High findings always shown. Medium/Low: show 2 most severe, fold rest.
```
🔴 (+N hidden: [Finding-001], [Finding-002], ...) 🔴
🟢 Upgrade to Pro to view all items → 🟢
```
**LLLL Pro / Team:** All findings shown.

### Recommended Tools

[For findings requiring ongoing monitoring beyond Claude Code sessions]

| Need | Tool | Setup |
|------|------|-------|
| Dependency monitoring | Dependabot / Snyk / Renovate | [brief setup guidance] |
| Secret scanning | GitHub Secret Scanning / GitLeaks | [brief setup guidance] |
| SAST | SonarQube / Semgrep / CodeQL | [brief setup guidance] |

### Coverage Confidence

[Standard LLLL coverage confidence section]

### Education Insight
- Compliance: [Key insight about the scan findings]
- Business: [Business impact of the security posture]

---
⚠️ Disclaimer:
This content is generated by AI and may be incomplete or inaccurate.
Human compliance expert or legal professional review is recommended.

---

## 10. Fix Template (`/llll fix`)

```
Output Mode: LLLL [level]
```

### Finding

| Field | Value |
|-------|-------|
| Finding ID | [e.g., SEC-003] |
| Severity | 🔴🔴 **Critical** |
| Domain | [B9] — Secrets Management |
| Location | `src/config.js:42` |

### Proposed Fix

**Description:** [What will change and why]

**Files affected:**
1. `src/config.js` — remove hardcoded secret, use env variable
2. `.gitignore` — add .env if missing
3. `.env.example` — add placeholder for the secret

### Before / After

**`src/config.js:42`**
```diff
- const API_KEY = "sk-abc123...";
+ const API_KEY = process.env.API_KEY;
```

### Side Effects

[Any potential breaking changes or required follow-up]
- Deployment must set `API_KEY` environment variable
- Local developers must create `.env` file from `.env.example`

### Verification

After applying this fix, verify with:
```bash
[specific grep or test command to verify the fix]
```

---
⚠️ Disclaimer:
This content is generated by AI and may be incomplete or inaccurate.
Human compliance expert or legal professional review is recommended.

---

## 11. GRC Dashboard Template (`/llll grc`)

```
Output Mode: LLLL [level]
```

### Governance

| Control | Domain | Status | Evidence | Last Checked |
|---------|--------|--------|----------|-------------|
| Branch protection | N1 | ✅ Active / ❌ Missing / ⚠️ Partial | [source] | [date] |
| Code review required | A2 | ✅ / ❌ / ⚠️ | [source] | [date] |
| Release process | N5, A2 | ✅ / ❌ / ⚠️ | [source] | [date] |
| Incident response | A3 | ✅ / ❌ / ⚠️ | [source] | [date] |
| Documentation | N3 | ✅ / ❌ / ⚠️ | [source] | [date] |

**LLLL Basic:** All controls shown (governance is never folded — it is essential context).
**LLLL Pro / Team:** All controls shown with extended detail.

### Risk

| Category | 🔴🔴 Critical | 🔴 High | 🟡 Medium | 🟢 Low | Trend |
|----------|---------|------|--------|-----|-------|
| Vulnerabilities | N | N | N | N | ↑↓→ |
| License risk | N | N | N | N | ↑↓→ |
| Secrets exposure | N | N | N | N | ↑↓→ |
| Supply chain | N | N | N | N | ↑↓→ |

**Trend** is computed only if a previous `/llll scan` or `/llll grc` exists in conversation context. Otherwise show `—` (no baseline).

Data source: If `/llll scan` has been run → use actual findings. If not → use INFERRED estimates and note: `⚠️ Risk data is estimated. Run /llll scan for concrete findings.`

### Compliance

| Domain | Score | Status | Key Gap |
|--------|-------|--------|---------|
| N — SE Fundamentals | N% | 🔴/🟡/🟢 | [top gap] |
| O — License Risk | N% | 🔴/🟡/🟢 | [top gap] |
| B — App Security | N% | 🔴/🟡/🟢 | [top gap] |
| C — Supply Chain | N% | 🔴/🟡/🟢 | [top gap] |
| [other activated domains...] | | | |

Scoring: Same methodology as `/llll checklist` completeness scoring.

### Top 5 Recommended Actions

| # | Action | Category | Domain | Priority | Owner |
|---|--------|----------|--------|----------|-------|
| 1 | [Highest priority across all three GRC categories] | Risk/Governance/Compliance | [X] | 🔴🔴 P1 | [owner] |
| 2 | ... | ... | ... | ... | ... |

### Coverage Confidence

[Standard LLLL coverage confidence section — note if scan data is actual vs inferred]

### Education Insight
- Compliance: [GRC-level insight about organizational compliance posture]
- Business: [How GRC maturity affects partnerships, investment, insurance, market access]

---
⚠️ Disclaimer:
This content is generated by AI and may be incomplete or inaccurate.
Human compliance expert or legal professional review is recommended.
```

### Step 5.3 — Add examples for new modes to examples.md

Read `examples.md` fully. Add three new examples at the end of the file, maintaining the same formatting pattern as existing examples:

**Example 11:** `/llll scan` on a Node.js repo with secrets in code and outdated dependencies
**Example 12:** `/llll grc` dashboard for a solo-dev Python project with no tests, no branch protection, and GPL dependency
**Example 13:** Passive activation triggering Foundation Alert when Layer 0 issues are severe

Write these examples following the exact style of existing examples 1-10. Each example should include:
- User prompt
- Expected behavior
- Full expected output with correct tier annotations, folding rules, color indicators, disclaimer, and next steps menu

**Example 11 content:**

```markdown
---

## Example 11 — Automated Scan (`/llll scan`)

**User:** `/llll scan`
**Context:** Node.js + React project. Has package-lock.json, no .env in .gitignore, hardcoded API key in src/config.js, 3 high-severity npm audit findings, one AGPL dependency.

**Expected behavior:**
1. Detect Node.js tech stack from package.json / package-lock.json
2. Run git hygiene checks → find .env not in .gitignore
3. Run secret detection → find hardcoded API key
4. Run OWASP pattern scan → find dangerouslySetInnerHTML usage
5. Run npm audit → find 3 high vulnerabilities
6. Run license scan → find AGPL dependency
7. Produce structured scan report

**Expected output:**

```
Output Mode: LLLL Basic
```

### Scan Metadata

| Field | Value |
|-------|-------|
| Target | /Users/dev/my-app |
| Time | 2026-03-31T10:30:00Z |
| Tech stack | Node.js (npm), React |
| Scan duration | 12s |

### Findings Summary

| Severity | Count | Auto-fixable |
|----------|-------|-------------|
| 🔴🔴 Critical | 3 | 2 |
| 🔴 High | 5 | 3 |
| 🟡 Medium | 2 | 1 |
| 🟢 Low | 1 | 0 |

### Layer 0 — Software Resilience Findings

| Finding | Severity | Domain | Auto-fix |
|---------|----------|--------|----------|
| GIT-002: .env not in .gitignore | 🔴🔴 **Critical** | N6 | Yes |
| GIT-005: No branch protection on main | 🔴 **High** | N1 | No |

### Layer 1 — Security Posture Findings

| Finding | Severity | Domain | Auto-fix |
|---------|----------|--------|----------|
| SEC-004: OpenAI API key hardcoded in src/config.js:15 | 🔴🔴 **Critical** | B9 | Yes |
| OWA-007: dangerouslySetInnerHTML in src/components/Preview.jsx:42 | 🔴 **High** | B6 | No |
| DEP-001: 3 high-severity npm audit findings | 🔴 **High** | C1 | Yes |
| LIC-001: AGPL-3.0 dependency (mongodb-client@4.2.0) | 🔴🔴 **Critical** | O2 | No |

🔴 (+3 hidden: Permissive CORS config, Missing CSP header, Missing CODEOWNERS) 🔴
🟢 Upgrade to Pro to view all items → 🟢

### Detailed Findings

#### SEC-004: Hardcoded OpenAI API Key
- **Severity:** 🔴🔴 **Critical**
- **Domain:** B9 — Secrets Management
- **Location:** `src/config.js:15`
- **Description:** OpenAI API key `sk-proj-...` found hardcoded in source code
- **Risk:** Key can be extracted from git history even if later removed. Unauthorized usage, billing exposure.
- **Fix:** Move to environment variable `OPENAI_API_KEY`, add `.env` to `.gitignore`, create `.env.example`
- **Auto-fixable:** Yes → `/llll fix SEC-004`

#### LIC-001: AGPL-3.0 Dependency
- **Severity:** 🔴🔴 **Critical**
- **Domain:** O2 — Copyleft Contamination
- **Location:** `package.json` → `mongodb-client@4.2.0`
- **Description:** mongodb-client is licensed under AGPL-3.0. For SaaS/API usage, AGPL requires disclosure of the complete source code of the service.
- **Risk:** If this is a commercial SaaS product, AGPL may require open-sourcing the entire codebase or the network-facing portions.
- **Fix:** Evaluate alternatives (e.g., official `mongodb` driver under Apache 2.0) or obtain a commercial license.
- **Auto-fixable:** No — requires business decision on alternative dependency or license procurement

[Additional findings follow same pattern]

### Recommended Tools

| Need | Tool | Setup |
|------|------|-------|
| Dependency monitoring | Enable Dependabot in GitHub Settings → Security | 2 min |
| Secret scanning | Enable GitHub Secret Scanning in Settings → Security | 1 min |
| SAST | Add Semgrep to CI: `semgrep ci` in GitHub Actions | 15 min |

### Coverage Confidence

| Factor | Score | Detail |
|--------|-------|--------|
| Context inputs | 3/5 | README ✓, docs ✗, policies ✗, code ✓, deps ✓ |
| Evidence basis | 85% observed | 10 observed, 1 inferred, 0 missing |
| Domain coverage | 4/4 | N, O, B, C all scanned |

**Overall: High**

### Education Insight
- Compliance: Hardcoded secrets in source code are the number one cause of credential leakage. Once a secret is committed to git, it exists in the repository history permanently — even deleting the file does not remove it. The AGPL license finding is equally urgent for commercial projects, as AGPL's network clause means even SaaS usage (not just distribution) triggers the source code disclosure obligation.
- Business: A leaked API key can result in thousands of dollars of unauthorized usage within hours. AGPL contamination in a commercial codebase, if discovered during due diligence, can block acquisition or investment deals.

---
⚠️ Disclaimer:
This content is generated by AI and may be incomplete or inaccurate.
Human compliance expert or legal professional review is recommended.

Next:
[1] /llll fix SEC-004
[2] /llll scan (re-scan)
[3] /llll grc
[4] /llll
[5] /llll deep
[6] /llll checklist
[7] /llll brief
[8] 🟢 Upgrade to Pro to unlock the full power of Layrix →
```

**Example 12 content:**

```markdown
---

## Example 12 — GRC Dashboard (`/llll grc`)

**User:** `/llll grc`
**Context:** Solo-developer Python project. No tests, no CI, direct commits to main, GPL dependency detected in previous scan, basic README exists.

**Expected output:**

```
Output Mode: LLLL Pro
```

⚠️ Foundation Alert: Software resilience issues detected that undermine compliance posture.
Resolve Layer 0 findings before investing in Layer 2 compliance work.

### Governance

| Control | Domain | Status | Evidence | Last Checked |
|---------|--------|--------|----------|-------------|
| Branch protection | N1 | ❌ Missing | No branch rules detected | 2026-03-31 |
| Code review required | A2 | ❌ Missing | Solo dev, no PR workflow | 2026-03-31 |
| Release process | N5, A2 | ❌ Missing | No CI/CD, no release tags | 2026-03-31 |
| Incident response | A3 | ❌ Missing | No runbook or escalation path | 2026-03-31 |
| Documentation | N3 | ⚠️ Partial | README exists, no architecture docs | 2026-03-31 |

### Risk

| Category | 🔴🔴 Critical | 🔴 High | 🟡 Medium | 🟢 Low | Trend |
|----------|---------|------|--------|-----|-------|
| Vulnerabilities | 0 | 2 | 4 | 1 | — |
| License risk | 1 | 0 | 0 | 0 | — |
| Secrets exposure | 0 | 0 | 1 | 0 | — |
| Supply chain | 0 | 1 | 2 | 0 | — |

### Compliance

| Domain | Score | Status | Key Gap |
|--------|-------|--------|---------|
| N — SE Fundamentals | 15% | 🔴 Red | No tests, no CI, no branching, no rollback |
| O — License Risk | 25% | 🔴 Red | GPL dependency unresolved |
| A — Governance | 10% | 🔴 Red | No development process exists |
| B — App Security | 40% | 🔴 Red | Input validation gaps |
| C — Supply Chain | 35% | 🔴 Red | No SBOM, no dependency monitoring |
| D — Privacy | 60% | 🟡 Yellow | Basic privacy notice exists but incomplete |

**Overall: 31% — 🔴 Red**

### Top 5 Recommended Actions

| # | Action | Category | Domain | Priority | Owner |
|---|--------|----------|--------|----------|-------|
| 1 | Replace GPL dependency or change project license | Risk | O2 | 🔴🔴 P1 | Engineering |
| 2 | Add `.gitignore` with `.env` and run `git filter-repo` to clean history | Risk | N6, B9 | 🔴🔴 P1 | Engineering |
| 3 | Set up basic CI pipeline with at least one test | Governance | N4, N5 | 🔴 P1 | Engineering |
| 4 | Enable branch protection on main, adopt PR workflow | Governance | N1, A2 | 🔴 P1 | Engineering |
| 5 | Generate SBOM and run dependency audit | Risk | C1 | 🟡 P2 | Engineering |

### Coverage Confidence

| Factor | Score | Detail |
|--------|-------|--------|
| Context inputs | 2/5 | README ✓, docs ✗, policies ✗, code ✓, deps ✗ |
| Evidence basis | 60% observed | 8 observed, 4 inferred, 1 missing |
| Domain coverage | 6/6 | All triggered domains evaluated |

**Overall: Medium**

To increase confidence: Run `/llll scan` for concrete vulnerability data. Add project documentation and dependency manifest.

### Education Insight
- Compliance: A 15% score in Software Engineering Fundamentals means the project lacks the basic infrastructure needed for reliable compliance. Without version control discipline or testing, any compliance artifact (privacy policy, security controls) can be silently broken by the next commit. The GPL dependency finding compounds this — if the project is commercial, the entire codebase may need to be open-sourced or the dependency replaced.
- Business: Solo-developer projects are particularly vulnerable to the "bus factor" problem. If the developer becomes unavailable, no one can maintain, deploy, or recover the system. For any project seeking investment, partnership, or acquisition, a GRC score below 50% is a red flag that typically results in mandatory remediation before deal closure.

---
⚠️ Disclaimer:
This content is generated by AI and may be incomplete or inaccurate.
Human compliance expert or legal professional review is recommended.

Next:
[1] Continue
[2] /llll scan
[3] /llll deep
[4] /llll checklist
[5] /llll brief
[6] /llll diff
```

**Example 13 content:**

```markdown
---

## Example 13 — Foundation Alert with Passive Activation

**User:** I'm planning to add Stripe payments to the app so users can subscribe monthly.

**Expected behavior:**
- LLLL activates passively (design-time mode)
- Evaluates Layer 0 first — detects no tests, secrets in code, no branching
- Inserts Foundation Alert before compliance analysis
- Then performs standard design-time compliance analysis for the payments feature

**Expected output** (appended after the feature discussion):

## ⚖️ Layrix Compliance Layer

```
Output Mode: LLLL Basic
```

⚠️ Foundation Alert: Software resilience issues detected that undermine compliance posture.
Resolve Layer 0 findings before investing in Layer 2 compliance work.

**Layer 0 issues affecting this feature:**
- 🔴🔴 **Critical** — Secrets in code (N6, B9): adding Stripe requires API keys — current codebase has no secrets management
- 🔴 **High** — No tests (N4): payment logic without tests risks billing errors that are hard to detect
- 🔴 **High** — No rollback capability (N2): a broken payment deploy cannot be reversed

Triggered domains:
- N (Software Engineering Fundamentals) — Layer 0 issues affect payment feature safety
- O (Open Source & Licensing Risk) — verify Stripe SDK license compatibility
- F (Payments) — subscription billing logic
- D (Privacy) — payment data handling
- B (Application Security) — payment API security

Potential issues:
- Stripe secret key will be hardcoded if current practices continue (N6, B9)
- No test coverage means billing bugs (double charges, failed cancellations) go undetected (N4)
- No rollback means a broken payment deploy stays broken (N2)
- PCI scope needs assessment (F2)
- Payment data in privacy policy (D2)

What is missing:
- Secrets management solution (before adding any API keys)
- Basic test framework (before implementing payment logic)
- Rollback procedure (before deploying payment features)
- Refund and cancellation terms (F1)

What to do next:

| Action | Owner |
|--------|-------|
| Set up environment variables and secrets manager BEFORE adding Stripe keys | Engineering |
| Add basic test framework and write first payment logic tests | Engineering |
| Define refund and cancellation policy | Product |
| Review Stripe integration for PCI scope | Engineering |

Preventive design suggestions:
- Use Stripe Checkout (hosted) to minimize PCI scope — never handle raw card data
- Store Stripe secret key in environment variable only — never in source code
- Write integration tests for subscription create, cancel, and refund flows before launch
- Set up basic CI to run tests before deploy

Education insight:
- Compliance: Adding payments without secrets management is the single most common cause of financial API key leakage in solo-developer projects. Stripe's documentation explicitly warns against hardcoded keys.
- Business: A leaked Stripe key can result in fraudulent charges to your account within minutes.

Next:
[1] Continue
[2] /llll deep
[3] /llll checklist
[4] /llll brief
[5] /llll diff
[6] /llll scan
[7] /llll grc
[8] 🟢 Upgrade to Pro to unlock the full power of Layrix →

---
⚠️ Disclaimer:
This content is generated by AI and may be incomplete or inaccurate.
Human compliance expert or legal professional review is recommended.
```

### Step 5.4 — Update CHANGELOG.md

Read `CHANGELOG.md`. Add a new entry at the top (after the header):

```markdown
## v4.0.0 — Software Resilience & Compliance Foundation

### Added
- **Domain N: Software Engineering Fundamentals** (N1-N7) — version control discipline, rollback capability, knowledge continuity, testing existence, CI/CD, repository hygiene, dev environment security
- **Domain O: Open Source & Licensing Risk** (O1-O4) — project license selection, copyleft contamination detection, license compatibility matrix, contributor license and IP ownership
- **Domain B expanded: OWASP tactical checks** (B5-B9) — injection defense, XSS/output encoding, sensitive data exposure, security misconfiguration, secrets management. OWASP mapping annotations.
- **Domain C expanded: Full supply chain model** (C4-C9) — upstream (toolchain security, SDK/API provider risk), midstream (service-to-service trust, third-party integration security), downstream (distribution channel security, update/patch delivery)
- **Layer 0 architecture** — Software Resilience Foundation (Domains N, O) evaluated before compliance analysis. Foundation Alert when Layer 0 issues are Critical/High.
- **`/llll scan` command** — automated security and hygiene scanning using Bash, Grep, Glob. Scans secrets, OWASP patterns, git hygiene, dependency vulnerabilities, license risk, Dockerfile security. Produces findings with file:line locations.
- **`/llll fix` command** — generates concrete code fixes for scan findings with before/after comparison. Auto-fixable findings include secrets in code, .gitignore gaps, dependency updates.
- **`/llll grc` command** — Governance, Risk, and Compliance dashboard aggregating all domain scores, vulnerability counts, governance control status, and top 5 prioritized actions.
- **`scan-patterns.md`** — reference data file with grep patterns, shell commands, and finding definitions for `/llll scan`
- 3 new examples (Examples 11-13): scan report, GRC dashboard, Foundation Alert with passive activation
- 3 new output templates: scan report, fix, GRC dashboard
- Schema categories for Domain N and O
- ScanFinding internal data model
- Bash added to allowed-tools for scan execution

### Changed
- Domain selection priority: Layer 0 (N, O) evaluated first, before universal domains (A-E)
- Section numbering in compliance-checklist-master.md: sections 8-12 renumbered to 9-13
- Next steps menus expanded to include `/llll scan` and `/llll grc` across all modes
- Completion standard updated to reflect security scanning and GRC capabilities
- Compliance artifacts list expanded with scan reports, auto-fix, GRC dashboards, license matrices
```

### Step 5.5 — Update TODO.md

Read `TODO.md`. Add new TODO items:

```markdown
## v4.0 — Software Resilience Foundation — DONE

- [x] Domain N: Software Engineering Fundamentals (N1-N7)
- [x] Domain O: Open Source & Licensing Risk (O1-O4)
- [x] Domain B: OWASP tactical checks (B5-B9)
- [x] Domain C: Full supply chain model (C4-C9)
- [x] Layer 0 architecture with Foundation Alert
- [x] `/llll scan` command with scan-patterns.md
- [x] `/llll fix` command
- [x] `/llll grc` command
- [x] Updated schema, templates, examples
- [x] Bash added to allowed-tools

## Scan Enhancements — Deferred (P2)

- [ ] Container image scanning (Trivy/Grype integration if available)
- [ ] DAST via headless browser (basic check for exposed admin panels, default credentials)
- [ ] Scan history persistence across sessions
- [ ] Auto-fix confidence levels (high/medium/low) for each finding
- [ ] Custom scan pattern definitions (user-defined patterns in project config)

## GRC Enhancements — Deferred (P3)

- [ ] GRC trend tracking across sessions (requires state persistence)
- [ ] Export GRC dashboard as PDF or Markdown artifact
- [ ] Compliance evidence auto-collection to structured folder
- [ ] Policy-as-code integration (OPA/Rego for automated compliance checks)
```

### Step 5.6 — Update README.md

Read `README.md`. Update the domain count, command list, and feature description to reflect v4.0 changes. Key updates:

1. Change domain count from 13 to 17 (or "15 domains across 17 check groups" — however the current README phrases it)
2. Add N, O to the domain list
3. Add `/llll scan`, `/llll fix`, `/llll grc` to the command list
4. Mention Layer 0 (Software Resilience Foundation)
5. Mention OWASP tactical checks and full supply chain model
6. Update version reference to v4.0.0

### Verification 5

```bash
# Check checklist-schema.md has Domain N and O categories
grep -q "Software Engineering Fundamentals — Domain N" /Users/vox/LLLL/checklist-schema.md && echo "PASS: Schema N" || echo "FAIL: Schema N"
grep -q "Open Source and Licensing Risk — Domain O" /Users/vox/LLLL/checklist-schema.md && echo "PASS: Schema O" || echo "FAIL: Schema O"

# Check output-templates.md has new templates
grep -q "Scan Report Template" /Users/vox/LLLL/output-templates.md && echo "PASS: Scan template" || echo "FAIL: Scan template"
grep -q "Fix Template" /Users/vox/LLLL/output-templates.md && echo "PASS: Fix template" || echo "FAIL: Fix template"
grep -q "GRC Dashboard Template" /Users/vox/LLLL/output-templates.md && echo "PASS: GRC template" || echo "FAIL: GRC template"

# Check examples.md has new examples
grep -q "Example 11" /Users/vox/LLLL/examples.md && echo "PASS: Example 11" || echo "FAIL: Example 11"
grep -q "Example 12" /Users/vox/LLLL/examples.md && echo "PASS: Example 12" || echo "FAIL: Example 12"
grep -q "Example 13" /Users/vox/LLLL/examples.md && echo "PASS: Example 13" || echo "FAIL: Example 13"

# Check CHANGELOG has v4.0.0 entry
grep -q "v4.0.0" /Users/vox/LLLL/CHANGELOG.md && echo "PASS: CHANGELOG" || echo "FAIL: CHANGELOG"

# Check TODO has v4.0 section
grep -q "v4.0" /Users/vox/LLLL/TODO.md && echo "PASS: TODO" || echo "FAIL: TODO"

# Check README mentions new commands
grep -q "scan" /Users/vox/LLLL/README.md && echo "PASS: README scan" || echo "FAIL: README scan"
grep -q "grc" /Users/vox/LLLL/README.md && echo "PASS: README grc" || echo "FAIL: README grc"

# Final integrity: check all original domains A-M still exist
for letter in A B C D E F G H I J K L M; do
  grep -q "^## ${letter}\." /Users/vox/LLLL/compliance-checklist-master.md && echo "PASS: Domain $letter intact" || echo "FAIL: Domain $letter damaged"
done

# Final count: total check items across all domains
TOTAL_CHECKS=$(grep -c "^### [A-O][0-9]" /Users/vox/LLLL/compliance-checklist-master.md)
test "$TOTAL_CHECKS" -ge 45 && echo "PASS: $TOTAL_CHECKS checks (expected ≥45)" || echo "FAIL: Only $TOTAL_CHECKS checks (expected ≥45)"
```

**All checks must print PASS. If any fail, investigate and fix before considering the work complete.**

---

## Final Verification — Full System Integrity

After all 5 phases are complete, run this comprehensive check:

```bash
echo "=== LLLL v4.0.0 Final Verification ==="

# File existence
for f in compliance-checklist-master.md SKILL.md checklist-schema.md output-templates.md examples.md scan-patterns.md CHANGELOG.md TODO.md README.md; do
  test -f /Users/vox/LLLL/$f && echo "PASS: $f exists" || echo "FAIL: $f missing"
done

# Domain count (A-O = 15 unique domain letters)
DOMAINS=$(grep -o "^## [A-O]\." /Users/vox/LLLL/compliance-checklist-master.md | sort -u | wc -l | tr -d ' ')
echo "Domains found: $DOMAINS (expected 15)"
test "$DOMAINS" -eq 15 && echo "PASS: Domain count" || echo "FAIL: Domain count"

# Check count (should be ≥45 individual checks)
CHECKS=$(grep -c "^### [A-O][0-9]" /Users/vox/LLLL/compliance-checklist-master.md)
echo "Checks found: $CHECKS (expected ≥45)"
test "$CHECKS" -ge 45 && echo "PASS: Check count" || echo "FAIL: Check count"

# Command modes in SKILL.md (should have all 8: llll, checklist, brief, diff, deep, scan, fix, grc)
for mode in "llll —" "llll checklist" "llll brief" "llll diff" "llll deep" "llll scan" "llll fix" "llll grc"; do
  grep -q "/$(echo $mode | head -c 15)" /Users/vox/LLLL/SKILL.md && echo "PASS: Mode /$mode" || echo "FAIL: Mode /$mode"
done

# Templates count (should be ≥11)
TEMPLATES=$(grep -c "^## [0-9]" /Users/vox/LLLL/output-templates.md)
echo "Templates found: $TEMPLATES (expected ≥11)"
test "$TEMPLATES" -ge 11 && echo "PASS: Template count" || echo "FAIL: Template count"

# Examples count (should be ≥13)
EXAMPLES=$(grep -c "^## Example [0-9]" /Users/vox/LLLL/examples.md)
echo "Examples found: $EXAMPLES (expected ≥13)"
test "$EXAMPLES" -ge 13 && echo "PASS: Example count" || echo "FAIL: Example count"

# Key concepts present
grep -q "Layer 0" /Users/vox/LLLL/SKILL.md && echo "PASS: Layer 0 concept" || echo "FAIL: Layer 0 concept"
grep -q "Foundation Alert" /Users/vox/LLLL/SKILL.md && echo "PASS: Foundation Alert" || echo "FAIL: Foundation Alert"
grep -q "ScanFinding" /Users/vox/LLLL/SKILL.md && echo "PASS: ScanFinding model" || echo "FAIL: ScanFinding model"
grep -q "OWASP" /Users/vox/LLLL/compliance-checklist-master.md && echo "PASS: OWASP references" || echo "FAIL: OWASP references"
grep -q "Upstream Supply Chain" /Users/vox/LLLL/compliance-checklist-master.md && echo "PASS: Supply chain model" || echo "FAIL: Supply chain model"
grep -q "copyleft" /Users/vox/LLLL/compliance-checklist-master.md && echo "PASS: Copyleft coverage" || echo "FAIL: Copyleft coverage"

echo "=== Verification complete ==="
```

Report the results. If all pass, the v4.0.0 implementation is complete.
