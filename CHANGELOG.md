# Changelog

All notable changes to LLLL (Layrix Logic Layer Loop) are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/).
Versioning follows [Semantic Versioning](https://semver.org/).

## [5.0.0] - 2026-04-01

### Added
- **Freemium pivot** — registration (free) unlocks full content visibility; Pro/Team deferred to "Coming Soon"
- **`/llll review` command** — human expert review escalation with on-demand pricing (review@layrix.ai)
- **Layrix Academy integration** — AIGP training CTAs in Education Insight sections when AI domains triggered (layrix.ai/academy)
- **LLLL Guard module** — push and release compliance gates
- **`/llll guard` command** — general compliance gate entry point
- **`/llll guard push`** — pre-push diff scanning for secrets, credentials, policy-relevant changes
- **`/llll guard release`** — pre-release artifact scanning for source maps, internal assets, whitelist violations
- **`/llll override`** — override SOFT_BLOCK findings with justification logging
- **guard-patterns.md** — detection rules for push and release gates (PG-H/S/W, RG-H/S patterns)
- **llll-guard/ CLI** — Node.js + TypeScript CLI tool for git hook integration
- Human review CTAs (🔵) in deep, brief, and GRC outputs
- Academy reference (📚) in Education Insight when AI governance domains active

### Changed
- Visibility model: registration replaces paid tiers as the content gate
- `LLLL Basic` (old partial visibility) → `LLLL Unregistered`
- `LLLL Pro` (old full visibility) → `LLLL Basic` (registered, free)
- Pro and Team marked "Coming Soon" — reserved for MCP, personalization, team features
- All fold markers: "Register free" replaces "Upgrade to Pro"
- Registration hint updated: "Register free at layrix.ai — unlock all findings in 30 seconds"
- Next steps menus expanded with /llll review, /llll guard
- Three Engine Model updated to reference real services (human review, Layrix Academy)
- SKILL.md version header updated to v5.0
- Human Expert Escalation section enhanced with review CTAs

### Removed
- Pro/Team as active paid tiers (deferred to future release)
- Upgrade comparison table (replaced with registration comparison)

## [4.0.0] - 2026-04-01

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

## [3.0.1] - 2026-03-28

### Fixed
- Added folding sort rule (show more severe items, fold least severe)
- Added Critical risk level to checklist schema

## [3.0.0] - 2026-03-28

### Added
- Three Engine Model (AI Compliance, Human Expert Layer, Enablement Layer)
- Tiered visibility architecture (Basic / Pro / Team)
- Content folding algorithm for Basic level
- Critical risk level (urgent + important, never folded)
- Five command modes: `/llll`, `/llll checklist`, `/llll diff`, `/llll brief`, `/llll deep`
- Passive activation (Design-Time Mode) during feature planning and code generation
- Continuous compliance with drift detection and re-evaluation
- Human expert escalation framework
- Education Insight section with adaptive length
- Mandatory disclaimer on all outputs
- Compliance checklist master (domains A-M)
- Checklist schema, output templates, usage examples

### Changed
- Complete rewrite from v1.2 skill to Layrix Embedded Compliance Layer architecture

## [1.2.0] - 2026-03-28

### Added
- Initial LLLL skill
