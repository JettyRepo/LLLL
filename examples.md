# LLLL Examples v1.2

## Example — Basic Feature Analysis

**User:** `/llll` We're building a SaaS tool that lets users upload documents and get AI summaries.

**Expected output:**
- System Understanding: SaaS document processing with AI
- Observed Signals: file upload, AI processing, user accounts
- Inferred Signals: PII in documents, AI training concerns, data retention
- Required Stack: ToS, Privacy Policy, AI Disclosure, Data Processing Agreement
- Gaps: No mention of data retention, no AI training opt-out
- Action Plan: P1 — Privacy Policy with AI clause, P2 — Data retention policy

---

## Example — Repo-aware Analysis

**User:** `/llll` analyze this repo

**Expected behavior:**
1. Read README.md for product description
2. Scan docs/ for existing policies
3. Grep for terms, privacy, policy files
4. Infer product scope from codebase
5. Map features to compliance requirements
6. Output full analysis with gaps

---

## Example — Diff Mode

**User:** `/llll diff`
**Context:** Product added AI scoring + payment processing since last review

**Expected output:**

### Coverage Matrix

| Feature | Covered | Missing | Risk |
|---------|---------|---------|------|
| User auth | Yes | — | Low |
| AI scoring | No | AI disclosure, bias audit | High |
| Payments | Partial | Refund policy, PCI reference | Medium |
| Data export | No | Data portability clause | Medium |

### Change Ticket

**Feature Change:** Added AI scoring engine and Stripe payment integration

**Required Policy Update:**
- Add AI Disclosure section to ToS
- Add bias/fairness statement
- Update Privacy Policy for payment data
- Add Refund Policy page

**Risk If Ignored:** Regulatory non-compliance (AI Act, PCI-DSS), user trust erosion

**Owner:** Legal + Product

**Priority:** P1

---

## Example — Deep Mode

**User:** `/llll deep` We handle health data for insurance companies.

**Expected additions:**
- Sensitivity Assessment: **High**
- Why This Matters Now: HIPAA, state health privacy laws, insurance regulations, potential for discrimination claims, upcoming AI health regulations

---

## Example — Brief Mode (Lawyer Handoff)

**User:** `/llll brief`

**Expected output:**
- Project Summary: concise, non-technical
- Functional Scope: bullet list of compliance-relevant features
- Observed Signals: what was found in code/docs
- Inferred Signals: likely requirements
- Missing Inputs: what legal needs from the team
- Business Decisions Needed: choices that block legal work
- Questions for Counsel: specific items for the lawyer

---

## Example — Checklist Mode

**User:** `/llll checklist`

**Expected output:**
- Grouped by category (Product, Data, Legal, Regulatory)
- Each item marked: KNOWN / UNKNOWN / NEEDS DECISION / NEEDS LEGAL INPUT
- Missing items highlighted
- Completeness score with color indicator

---

## Example — Design-time Integration

**User:** I'm planning to add a social sharing feature where users can share their AI-generated reports publicly.

**Expected behavior:**
- Analyze the feature plan
- Append LLLL Compliance Layer:
  - Potential issues: public data exposure, AI attribution, third-party platform ToS
  - Offer next steps menu: [1] Continue [2] /llll deep [3] /llll checklist [4] /llll brief [5] /llll diff
