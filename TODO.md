# TODO

## v5.0 — Freemium Pivot + Business Modules — DONE

- [x] Freemium pivot: registration = full visibility gate
- [x] LLLL Unregistered / LLLL Basic naming
- [x] Pro/Team marked "Coming Soon"
- [x] /llll review command (human expert review escalation)
- [x] Layrix Academy CTAs in Education Insight
- [x] LLLL Guard module (push & release compliance gate)
- [x] /llll guard, /llll guard push, /llll guard release commands
- [x] /llll override command
- [x] guard-patterns.md detection rules
- [x] llll-guard/ CLI scaffold (TypeScript + Node.js)
- [x] Updated all tier annotations across SKILL.md, templates, examples
- [x] Registration comparison table (replaces upgrade table)
- [x] Human review CTAs in deep/brief/GRC outputs

## v4.0 — Software Resilience Foundation — DONE

- [x] Domain N: Software Engineering Fundamentals (N1-N7)
- [x] Domain O: Open Source & Licensing Risk (O1-O4)
- [x] Domain B: OWASP tactical checks (B5-B9)
- [x] Domain C: Full supply chain model (C4-C9)
- [x] Layer 0 architecture with Foundation Alert
- [x] /llll scan, /llll fix, /llll grc commands
- [x] scan-patterns.md
- [x] Bash added to allowed-tools

## Color Indicators — DONE

- [x] Emoji color indicators on all risk-leveled items
- [x] Basic tier severity-based folding with item name listing

## Registration & Upgrade — DONE

- [x] Registration hint at output header
- [x] Registration detection via ~/.layrix/config.json
- [x] Subscription level detection from config
- [x] Next menu registration CTA (Unregistered only)
- [x] Registration comparison table

## Phase 0 — Registration MVP (layrix-backend) — DONE

- [x] Cloudflare Worker project + D1 schema (users, magic_links)
- [x] Domain migration: GoDaddy NS → Cloudflare
- [x] Resend account + layrix.ai domain verified (DKIM, SPF, MX)
- [x] Landing page at layrix.ai/
- [x] Registration page at layrix.ai/register
- [x] Magic link flow (Resend): register → verify → activate
- [x] Activation: create ~/.layrix/config.json (curl + manual options)
- [x] Custom domain binding: layrix.ai → Cloudflare Worker
- [ ] Layrix Academy page at layrix.ai/academy
- [ ] Landing/Register page content & design polish
- [ ] Production hardening: rate limiting, CORS, input sanitization

## Phase 1 — MCP + License Validation (Pro, Coming Soon)

- [ ] MCP server on /mcp route (Streamable HTTP)
- [ ] layrix_validate_license tool
- [ ] SKILL.md: MCP detection logic, allowed-tools update
- [ ] Convert LLLL skill → Plugin (MCP auto-config in plugin.json)

## Phase 2 — Stripe + Pro Tier (Coming Soon)

- [ ] Stripe Checkout on /upgrade
- [ ] Webhook handler: subscription update in D1
- [ ] Config auto-refresh: MCP returns "pro" → local config updated
- [ ] Pro-specific features: custom scan patterns, project personalization

## Phase 3 — Pro Content Packs (Coming Soon)

- [ ] GDPR jurisdiction pack
- [ ] Security hardening industry pack
- [ ] Advanced scan patterns (container, infrastructure)
- [ ] R2 storage + MCP delivery tools
- [ ] /llll industry and /llll jurisdiction commands

## Phase 4 — E2E Encrypted State Persistence (Coming Soon)

- [ ] Client-side AES-256-GCM encryption for compliance state
- [ ] layrix_save_compliance_state + layrix_get_compliance_history
- [ ] GRC trending in SKILL.md

## LLLL Guard Enhancements — Deferred

- [ ] Guard: semantic diff analysis (Pro feature)
- [ ] Guard: policy mapping (Pro feature)
- [ ] Guard: CI integration mode (Team feature)
- [ ] Guard: reviewer requirement hooks (Team feature)
- [ ] Guard: override logging with audit trail (Team feature)
- [ ] Guard: custom policy profiles

## Scan Enhancements — Deferred

- [ ] Container image scanning (Trivy/Grype)
- [ ] DAST via headless browser
- [ ] Scan history persistence across sessions
- [ ] Custom scan pattern definitions

## GRC Enhancements — Deferred

- [ ] GRC trend tracking across sessions
- [ ] Export GRC dashboard as PDF or Markdown artifact
- [ ] Compliance evidence auto-collection
- [ ] Policy-as-code integration (OPA/Rego)

## Team Features — Deferred

- [ ] Team compliance dashboards
- [ ] Multi-user role-based access
- [ ] Shared compliance history
- [ ] Centralized evidence repository
