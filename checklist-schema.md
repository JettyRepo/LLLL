# LLLL Checklist Schema v1.2

## Categories

### 1. Product Identity
- Product name
- One-line description
- Target audience
- Geographic scope

### 2. Data & Privacy
- What personal data is collected
- How data is stored
- Data retention period
- Third-party data sharing
- Cross-border data transfer

### 3. User Interaction
- Account creation required?
- Payment processing?
- User-generated content?
- Communication features?

### 4. AI / Automation
- AI/ML features present?
- Automated decision-making?
- Training on user data?
- AI output disclosure needed?

### 5. Legal Coverage
- Terms of Service
- Privacy Policy
- Cookie Policy
- Acceptable Use Policy
- AI Disclosure
- DMCA / Copyright Policy

### 6. Regulatory
- GDPR applicability
- CCPA applicability
- COPPA applicability
- Industry-specific regulations
- Export controls

---

## Decision vs Legal Split

Mark each item:

- **KNOWN** — information is available and confirmed
- **NEED BUSINESS DECISION** — product/engineering must decide before legal can act
- **NEED LEGAL INPUT** — requires legal counsel review

### Decision Matrix

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Data retention period | NEED BUSINESS DECISION | Product | Must decide before privacy policy draft |
| GDPR applicability | NEED LEGAL INPUT | Legal | Depends on user geography |
| AI feature disclosure | KNOWN | Engineering | Feature documented in README |

---

## Intake Flow

1. Gather KNOWN items from project context (README, docs, code)
2. Mark items that are UNKNOWN
3. For each UNKNOWN, determine:
   - Is this a BUSINESS DECISION? -> route to product owner
   - Is this a LEGAL question? -> route to counsel
4. Generate checklist with status markers
5. Output prioritized action items

---

## Completeness Scoring

- **Green (>80%)**: Most items KNOWN, ready for legal review
- **Yellow (50-80%)**: Significant gaps, need business decisions
- **Red (<50%)**: Major gaps, need discovery phase
