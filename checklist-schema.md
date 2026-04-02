# Layrix Checklist Schema v4.0

Aligned with the Embedded Compliance Layer architecture and compliance-checklist-master.md domains.

LLLL is the core skill of the Layrix Compliance OS — an Embedded Compliance Layer.
Checklists are structured as: **Domain → Inputs → Status → Owner**.
This schema supports continuous compliance, not static one-time validation.

---

## Decision Labels

Mark each item with one of:

- **KNOWN** — information confirmed from evidence
- **OBSERVED** — seen in code/docs but not formally confirmed
- **INFERRED** — likely true based on product type/context
- **UNKNOWN** — no information available
- **NEEDS BUSINESS DECISION** — product/engineering must decide before compliance can proceed
- **NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT** — requires compliance expert or legal professional review
- **NEEDS TECHNICAL CONFIRMATION** — requires engineering verification
- **MISSING EVIDENCE** — check is relevant but no supporting evidence found

---

## Risk Levels

Gaps and findings are assigned one of four risk levels:

| Level | Meaning | Folded in Unregistered? |
|-------|---------|-----------------|
| **Critical** | Urgent + important — not fixing this causes immediate serious consequences | Never |
| **High** | Important but not urgent — significant risk if left unresolved | Never |
| **Medium** | Weakens compliance posture — should be fixed but not immediately catastrophic | Yes |
| **Low** | Improves maturity — useful but not urgent | Yes |

Critical vs High distinction: Critical means the issue is actively causing harm or violation RIGHT NOW. High means the issue is significant but consequences are not yet materializing.

---

## Escalation Routing

| Label | Routes To |
|-------|-----------|
| NEEDS BUSINESS DECISION | Product owner / business stakeholder |
| NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT | Compliance expert or legal professional |
| NEEDS TECHNICAL CONFIRMATION | Engineering / technical lead |
| MISSING EVIDENCE | Investigation — engineering or product |

This routing applies across all modes: diagnosis, checklist, brief, diff, deep, scan, fix, and grc.

---

## Categories

Categories are aligned with the compliance checklist master domains.
Only activated categories should appear in output.
All categories use the **Domain → Inputs → Status → Owner** structure.

### 1. Product Identity (always active)

| Input | Status | Owner |
|-------|--------|-------|
| Product name and description | KNOWN / UNKNOWN | Product |
| Target audience | KNOWN / UNKNOWN | Product |
| Geographic scope | KNOWN / UNKNOWN | Product |
| Business model (SaaS, marketplace, B2B, consumer, etc.) | KNOWN / UNKNOWN | Product |
| Tech stack summary | KNOWN / UNKNOWN | Engineering |

### 2. Project Governance — Domain A

| Input | Status | Owner |
|-------|--------|-------|
| Secure development process | KNOWN / UNKNOWN / NEEDS DECISION | Engineering |
| Code review and release management | KNOWN / UNKNOWN / NEEDS DECISION | Engineering |
| Incident response readiness | KNOWN / UNKNOWN / NEEDS DECISION | Engineering |
| Vulnerability handling | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |

### 3. Application Security — Domain B

| Input | Status | Owner |
|-------|--------|-------|
| Authentication model | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| Authorization and access control | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| Input/output/API security | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| Logging and monitoring | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |

### 4. Supply Chain — Domain C

| Input | Status | Owner |
|-------|--------|-------|
| Dependency inventory / SBOM | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| Open source license compliance | KNOWN / UNKNOWN / MISSING EVIDENCE | Engineering |
| Build integrity and provenance | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |

### 5. Privacy and Data Protection — Domain D

| Input | Status | Owner |
|-------|--------|-------|
| Personal data types collected | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |
| Data storage and retention | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |
| Notice, consent, and lawful processing | KNOWN / UNKNOWN / NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT | Compliance expert |
| Data subject rights handling | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |
| Third-party processors and cross-border transfers | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |

### 6. Accessibility — Domain E

| Input | Status | Owner |
|-------|--------|-------|
| Accessibility baseline (keyboard, contrast, semantic HTML) | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| Accessibility defect tracking | KNOWN / UNKNOWN / NEEDS DECISION | Engineering |

### 7. Payments and Commerce — Domain F

| Input | Status | Owner |
|-------|--------|-------|
| Pricing and subscription logic | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |
| Cancellation and refund process | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |
| Payment security boundary (PCI scoping) | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |

### 8. User Content and Moderation — Domain G

| Input | Status | Owner |
|-------|--------|-------|
| User-generated content rules | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |
| Content ownership and licensing | KNOWN / UNKNOWN / NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT | Compliance expert |
| Moderation and enforcement operations | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |

### 9. Enterprise and B2B — Domain H

| Input | Status | Owner |
|-------|--------|-------|
| Customer trust materials | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |
| Security and privacy claims support | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| Governance documentation readiness | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |

### 10. AI Transparency — Domain I

| Input | Status | Owner |
|-------|--------|-------|
| AI feature disclosure | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |
| AI output handling and guardrails | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |

### 11. Automated Decisions — Domain J

| Input | Status | Owner |
|-------|--------|-------|
| Decision significance assessment | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |
| Human review and contestability | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |

### 12. AI Safety Operations — Domain K

| Input | Status | Owner |
|-------|--------|-------|
| Prompt and output security | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| Model lifecycle and provider dependency | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |

### 13. Mobile — Domain L

| Input | Status | Owner |
|-------|--------|-------|
| Local storage and device exposure | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |
| Permissions and network handling | KNOWN / UNKNOWN / NEEDS TECHNICAL CONFIRMATION | Engineering |

### 14. Sensitive Sector — Domain M

| Input | Status | Owner |
|-------|--------|-------|
| Sector identification (health, finance, education, etc.) | KNOWN / UNKNOWN / NEEDS BUSINESS DECISION | Product |
| Heightened review triggers | KNOWN / UNKNOWN / NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT | Compliance expert |

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

---

## Decision Matrix

| Item | Domain | Status | Owner | Notes |
|------|--------|--------|-------|-------|
| Data retention period | D1 | NEEDS BUSINESS DECISION | Product | Must decide before privacy policy draft |
| GDPR applicability | D2 | NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT | Compliance expert | Depends on user geography |
| AI feature disclosure | I1 | KNOWN | Engineering | Feature documented in README |
| Payment PCI scope | F2 | NEEDS TECHNICAL CONFIRMATION | Engineering | Verify what data touches the system |
| Open source licenses | C2 | MISSING EVIDENCE | Engineering | No license inventory found |
| Repository hygiene | N6 | NEEDS TECHNICAL CONFIRMATION | Engineering | Check .gitignore and git history for secrets |
| Copyleft contamination | O2 | UNKNOWN | Engineering | No license audit has been performed |

---

## Intake Flow

1. Gather KNOWN items from project context (README, docs, code)
2. Run domain selection (from SKILL.md Required Operating Flow, Steps 2-3)
3. For each activated domain, check each item:
   - Is this KNOWN or OBSERVED? → record with evidence source
   - Is this UNKNOWN? → determine:
     - Is this a BUSINESS DECISION? → route to product owner
     - Is this a COMPLIANCE question? → route to compliance expert or legal professional
     - Is this a TECHNICAL question? → route to engineering
     - Is this MISSING EVIDENCE? → flag for investigation
4. Generate inputs required by domain with status markers, domain references, and owner
5. Output prioritized action items with owner assignments

---

## Completeness Scoring

Score is calculated per activated domain, then aggregated.

- **Green (>80%)**: Most items KNOWN or OBSERVED, ready for compliance review
- **Yellow (50-80%)**: Significant gaps, need business decisions or evidence gathering
- **Red (<50%)**: Major gaps, need discovery phase

Per-domain breakdown:

| Domain | Items | Known | Gaps | Score | Status |
|--------|-------|-------|------|-------|--------|
| D — Privacy | 8 | 5 | 3 | 62% | Yellow |
| B — Security | 6 | 6 | 0 | 100% | Green |
| I — AI | 4 | 1 | 3 | 25% | Red |

**Overall: 60% — Yellow**

---

## Continuous Compliance

This schema supports ongoing compliance — not a one-time audit:

- Re-run `/llll checklist` after business decisions are made
- Re-run `/llll diff` after feature changes
- Completeness scores should improve over time
- Items that move from UNKNOWN to KNOWN represent measurable progress
- LLLL tracks domain activation changes as the product evolves
