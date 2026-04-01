# TODO

## Color Indicators — DONE

- [x] Add emoji color indicators to all LLLL output modes
  - 🔴🔴 Critical / P1
  - 🔴 High / Gap
  - 🟡 Medium / Partial / P2
  - 🟢 Low / Covered / P3
  - Applied to: SKILL.md (mandatory rule), output-templates.md (all example tables)

## Basic Tier — Severity-Based Folding & Conversion — DONE

- [x] Rewrite SKILL.md folding rules to severity-based model
- [x] Rewrite output-templates.md folding annotations to match
- [x] All hidden markers use red: `🔴 (+N hidden: ...) 🔴`
- [x] All hidden markers followed by: `🟢 Upgrade to Pro to view all items → 🟢`
- [x] Fold markers list hidden item names
- [x] Deep mode: Human Review Flags — show Critical+High, fold Medium/Low (option B)

## Registration & Upgrade — DONE

- [x] Registration hint at output header (unregistered users)
- [x] Registration detection via `~/.layrix/config.json`
- [x] Subscription level detection from config (`basic` / `pro` / `team`, default: `basic`)
- [x] Next menu [6] upgrade item (Basic only)
- [x] Upgrade [6] response: Pro vs Basic comparison table + URL
- [x] Mandatory Next steps menu (HARD RULE, all modes)
- [ ] **TODO: Upgrade purchase flow** — actual payment/activation at layrix.ai/upgrade (backend, not LLLL scope)

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

## Team Features — Deferred (P3)

- [ ] Define Team-specific features (team-level compliance tracking, shared history, multi-user dashboards, role-based access)
