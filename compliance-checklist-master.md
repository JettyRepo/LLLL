# Layrix Compliance Checklist Master
Version: v2.0

This file is the master compliance rule library for LLLL.

Its purpose is to define:
- what should be checked
- when it should be checked
- what evidence should be requested
- how to prioritize findings
- which checks are universal vs scenario-specific

This file is NOT a final user-facing answer template.
It is the underlying compliance knowledge base used by LLLL.

---

# 1. Master Use Rule

LLLL should use this checklist master as its default compliance framework.

When analyzing any product, feature, repository, PRD, workflow, or policy set, LLLL should:

1. identify the relevant product type and feature set
2. select the applicable compliance domains from this master checklist
3. prioritize universal software checks first
4. then layer business-model-specific checks
5. then layer industry-specific checks
6. then layer AI-specific checks where applicable
7. produce a structured diagnosis, checklist, brief, or diff based on the selected domains
8. assign owners (product / compliance expert / legal professional / engineering) to each gap

LLLL should not dump the entire checklist unless explicitly requested.
LLLL should surface only the relevant domains and checks for the current context.

---

# 2. Risk Priority Model

Use the following four-level priority model:

## Critical
Issues that are urgent AND important — not fixing them causes immediate serious consequences:
- active regulatory or legal violation happening now
- security vulnerability being exploited or immediately exploitable
- personal data being processed without required notice or consent
- consequential decisions being made without required human review
- payment processing without required controls or disclosures

Critical items generate P1 actions and are NEVER folded in Basic.

## High
Issues that are important but not immediately urgent:
- material regulatory or legal exposure if left unresolved
- security architecture weaknesses not yet exploited
- privacy controls needed but not yet in active violation
- payment or AI governance gaps requiring attention
- operational or reputational harm that accumulates over time

High items generate P1 actions and are NEVER folded in Basic.

## Medium
Issues that:
- weaken compliance posture
- create incomplete disclosures
- create operational inconsistency
- are unlikely to be immediately catastrophic but should be fixed

Medium items generate P2 actions and may be folded in Basic.

## Low
Issues that:
- improve maturity
- improve clarity
- improve governance hygiene
- are useful but not urgent

Low items generate P3 actions and may be folded in Basic.

---

# 3. Evidence Model

For each check, request evidence where possible.

Evidence may include:
- README
- PRD
- system architecture notes
- feature plan
- codebase structure
- API documentation
- existing Terms of Service
- Privacy Policy
- Cookie Notice
- AI Disclosure
- moderation rules
- billing / refund terms
- data flow diagram
- vendor list
- SBOM
- internal policies
- incident response runbooks
- training records

If evidence is unavailable, LLLL should mark the item as:
- OBSERVED
- INFERRED
- MISSING EVIDENCE

---

# 4. Universal Compliance Domains

These domains should be considered for nearly all software products.

---

## A. Project Governance and Development Process

### A1. Secure development governance
Check:
- whether a secure development policy exists
- whether roles and responsibilities are defined
- whether security or compliance requirements are included in planning, design, development, testing, and release
- whether vulnerability handling and remediation ownership exist

Evidence:
- SSDLC / SDLC documentation
- engineering process documents
- policy documents
- role matrix
- vulnerability management process

Priority:
- High

Applicability:
- all software projects

### A2. Change and release management
Check:
- whether code review exists
- whether release approval exists
- whether rollback planning exists
- whether major changes are recorded
- whether emergency changes are handled differently

Evidence:
- PR workflow
- release checklist
- change log
- rollback runbook
- deployment approval records

Priority:
- High

Applicability:
- all software projects

### A3. Incident and remediation readiness
Check:
- whether incident ownership is defined
- whether security or privacy incident escalation exists
- whether customer communication process exists
- whether post-incident review exists

Evidence:
- incident response runbook
- escalation matrix
- postmortem template
- support / trust process

Priority:
- High

Applicability:
- all software projects

---

## B. Application Security

### B1. Authentication and session control
Check:
- whether authentication is securely designed
- whether session expiration exists
- whether session revocation exists
- whether privileged access is separated
- whether admin access is controlled

Evidence:
- auth design documents
- RBAC / ABAC model
- session configuration
- security test reports

Priority:
- High

Applicability:
- products with user accounts or admin systems

### B2. Authorization and least privilege
Check:
- whether user roles are defined
- whether access rules are enforced server-side
- whether sensitive actions require stronger controls
- whether role escalation paths are controlled

Evidence:
- access control matrix
- backend authorization logic
- API documentation
- test cases

Priority:
- High

Applicability:
- products with multi-user or role-based access

### B3. Input, output, and API security
Check:
- whether inputs are validated
- whether outputs are safely handled
- whether APIs are authenticated and authorized
- whether file uploads are controlled
- whether unsafe business logic can be abused
- whether error handling leaks sensitive information

Evidence:
- API spec
- code scan results
- pen test reports
- security test cases

Priority:
- High

Applicability:
- web apps, APIs, SaaS, platforms

### B4. Logging and monitoring
Check:
- whether important actions are logged
- whether logs avoid exposing secrets or excessive personal data
- whether monitoring and alerting exist
- whether audit-relevant events are retained appropriately

Evidence:
- logging policy
- sample logs
- monitoring dashboards
- incident alerts

Priority:
- Medium to High

Applicability:
- most software systems

---

## C. Software Supply Chain and Component Transparency

### C1. Dependency inventory and SBOM
Check:
- whether dependency inventory exists
- whether SBOM exists
- whether third-party versions are tracked
- whether vulnerabilities are monitored
- whether build outputs are traceable

Evidence:
- SBOM
- dependency lock files
- SCA reports
- build pipeline logs

Priority:
- High

Applicability:
- projects using third-party packages, containers, SDKs

### C2. Open source license compliance
Check:
- whether component licenses are identified
- whether copyleft obligations are understood
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
- whether dependency sources are trusted
- whether package intake is controlled

Evidence:
- CI/CD config
- artifact signing records
- package source policy
- supply chain controls

Priority:
- High

Applicability:
- production systems, enterprise software, distributed software

---

## D. Privacy and Personal Data Protection

### D1. Data minimization and default protection
Check:
- whether only necessary data is collected
- whether privacy-protective defaults exist
- whether data visibility is appropriately limited
- whether retention rules exist
- whether deletion or correction workflows exist

Evidence:
- data inventory
- data flow map
- retention rules
- privacy policy
- DSAR process

Priority:
- High

Applicability:
- any system processing personal data

### D2. Notice, consent, and lawful processing logic
Check:
- whether users are informed of relevant data practices
- whether consent is used where appropriate
- whether data use purposes are defined
- whether processing logic matches disclosures
- whether cookies or tracking are disclosed where needed

Evidence:
- privacy notice
- cookie notice
- consent records
- analytics configuration
- product UX flows

Priority:
- High

Applicability:
- consumer products, tracked services, personal data systems

### D3. Data subject rights and operational handling
Check:
- whether access, deletion, correction, or export requests can be handled
- whether timelines and responsibility are defined
- whether data is spread across vendors in ways that complicate response

Evidence:
- DSAR workflow
- vendor map
- support playbook
- deletion implementation details

Priority:
- High

Applicability:
- systems processing personal data

### D4. Vendor and processor controls
Check:
- whether third-party processors are known
- whether privacy/security responsibilities are defined
- whether cross-border transfer issues are tracked
- whether subprocessors can be listed if needed

Evidence:
- vendor list
- DPAs
- subprocessors page
- security review notes

Priority:
- High

Applicability:
- systems using third-party processors

---

## E. Accessibility and Inclusive Design

### E1. Accessibility baseline
Check:
- whether accessibility is considered in design and testing
- whether major user flows are keyboard accessible
- whether contrast, labels, and semantic structure are handled
- whether assistive technology compatibility is tested

Evidence:
- accessibility review
- QA checklist
- design system guidance
- test results

Priority:
- Medium

Applicability:
- public-facing websites and apps

### E2. Accessibility issue handling
Check:
- whether accessibility defects are tracked
- whether an accessibility contact or support path exists
- whether fixes are prioritized in release planning

Evidence:
- issue tracker
- support process
- accessibility statement if any

Priority:
- Medium

Applicability:
- public-facing products

---

# 5. Business Model Specific Domains

These should be activated based on the product's revenue model or interaction model.

---

## F. Payments, Billing, and Commerce

### F1. Subscription and billing logic
Check:
- whether pricing logic is clear
- whether renewal logic is defined
- whether cancellation is implemented
- whether billing disclosures match actual behavior
- whether refund policy exists

Evidence:
- pricing page
- billing terms
- subscription flow
- payment settings
- support docs

Priority:
- High

Applicability:
- paid software, SaaS, subscription products

### F2. Payment security boundary
Check:
- whether payment data touches the system directly
- whether third-party payment processors are used
- whether responsibility boundaries are clearly understood
- whether sensitive payment data is unnecessarily handled

Evidence:
- payment architecture
- processor agreements
- integration docs
- PCI scoping notes

Priority:
- High

Applicability:
- products involving payments

---

## G. User Content, Moderation, and Platform Operations

### G1. User-generated content
Check:
- whether users can upload, post, or publish content
- whether ownership and license terms are defined
- whether prohibited content categories are defined
- whether removal and complaint process exists

Evidence:
- terms
- community rules
- moderation guidelines
- product flows

Priority:
- High

Applicability:
- social, community, marketplace, creator, forum, media products

### G2. Moderation and enforcement operations
Check:
- whether moderation model exists
- whether escalation path exists
- whether repeat abuse handling exists
- whether enforcement is documented enough to be operationalized

Evidence:
- moderation playbook
- trust and safety process
- admin tools
- enforcement records

Priority:
- High

Applicability:
- UGC or community platforms

---

## H. Enterprise, B2B, and Procurement Readiness

### H1. Customer trust and enterprise controls
Check:
- whether security or privacy claims can be supported
- whether incident response exists
- whether customer diligence questions can be answered
- whether governance materials are organized

Evidence:
- security overview
- privacy docs
- architecture summary
- trust center materials
- questionnaires

Priority:
- Medium to High

Applicability:
- B2B SaaS, enterprise-facing software

---

# 6. AI-Specific Domains

These should be activated whenever the product uses AI, ML, ranking, scoring, recommendation, automation, or model-generated output.

---

## I. AI Transparency and User Disclosure

### I1. AI disclosure
Check:
- whether the user is informed that AI is used
- whether the role of AI in outputs, recommendations, or decisions is described
- whether limitations or uncertainty are disclosed where appropriate

Evidence:
- AI disclosure
- user-facing UX copy
- onboarding flow
- help docs

Priority:
- High

Applicability:
- products using AI outputs, ranking, or recommendations

### I2. AI output handling
Check:
- whether unsafe or misleading outputs are handled
- whether review, guardrails, or moderation exist
- whether the system distinguishes between generated content and verified information when needed

Evidence:
- system prompt rules
- moderation docs
- product behavior specs
- escalation rules

Priority:
- High

Applicability:
- generative AI systems

---

## J. Automated Decision, Ranking, Scoring, and Profiling

### J1. Decision significance
Check:
- whether the system makes or strongly influences meaningful user outcomes
- whether ranking, scoring, or profiling could materially affect users
- whether users can challenge or understand outcomes where appropriate

Evidence:
- PRD
- scoring logic docs
- user flow
- support process

Priority:
- High

Applicability:
- ranking, lending, hiring, education, insurance, eligibility, recommendation systems

### J2. Human review and contestability
Check:
- whether human review exists where needed
- whether appeal or override exists
- whether edge cases are escalated
- whether high-impact uses are separated from lower-risk uses

Evidence:
- review workflow
- escalation path
- support scripts
- admin interface

Priority:
- High

Applicability:
- systems with consequential AI or automated decisions

---

## K. Model, Prompt, and AI Safety Operations

### K1. Prompt and output security
Check:
- whether prompt injection risks are considered
- whether output handling could trigger unsafe downstream behavior
- whether system prompt boundaries exist
- whether the application trusts model output too easily

Evidence:
- prompt architecture
- safety tests
- output validation rules
- model integration docs

Priority:
- High

Applicability:
- LLM-based systems

### K2. Model lifecycle and provider dependency
Check:
- whether model provider dependencies are known
- whether prompt/output retention is understood
- whether training or fine-tuning use is understood
- whether fallback behavior exists if model behavior changes

Evidence:
- provider docs
- vendor agreements
- architecture notes
- product assumptions

Priority:
- Medium to High

Applicability:
- systems using third-party AI providers or foundation models

---

# 7. Mobile-Specific Domains

These should be activated for mobile apps.

---

## L. Mobile Application Security

### L1. Local storage and device exposure
Check:
- whether sensitive data is stored locally
- whether secrets are exposed in app packages
- whether local caches are protected
- whether device compromise assumptions are considered

Evidence:
- mobile architecture
- app storage design
- security testing
- mobile scan results

Priority:
- High

Applicability:
- iOS / Android apps

### L2. Mobile permissions and network handling
Check:
- whether permissions are minimized
- whether network traffic is protected
- whether WebView use is controlled
- whether authentication tokens are safely handled

Evidence:
- permission manifest
- mobile networking config
- test reports
- auth implementation

Priority:
- High

Applicability:
- mobile apps

---

# 8. Industry-Specific and High-Sensitivity Activation Layer

Activate these only when the product clearly enters these spaces.

---

## M. Sensitive Sector Activation

Trigger heightened review if the system touches:
- health
- finance
- lending
- insurance
- education
- employment
- public sector
- children or minors
- biometric or identity-sensitive workflows
- safety-critical operations

When triggered, LLLL should:
1. increase scrutiny
2. raise more items to High priority
3. require stronger evidence
4. strongly prefer `/llll deep`
5. strongly surface human review, contestability, disclosure, and governance questions
6. suggest compliance expert or legal professional escalation

---

# 9. Output Mapping Rules

Use this master checklist differently depending on the command.

All commands are available at every subscription level (Basic / Pro / Team).
Basic folds Medium/Low items (Critical + High always shown). Pro and Team show full content identically.
Deep (`/llll deep`) is a command mode, not a subscription level.

## `/llll`
Use:
- top-level relevant domains
Output:
- diagnosis
- required compliance stack
- priority issues with owners

## `/llll checklist`
Use:
- relevant second-level checks
Output:
- structured intake checklist
- known / unknown / needs decision / needs compliance expert or legal professional input

## `/llll brief`
Use:
- relevant domains + evidence gaps
Output:
- compliance-expert-ready brief

## `/llll diff`
Use:
- current features vs existing policies
Output:
- coverage matrix
- change tickets
- policy update priorities

## `/llll deep`
Use:
- all relevant domains with stricter scrutiny
Output:
- sensitivity assessment
- why this matters now
- stronger prioritization
- human review flags where appropriate
- escalation suggestions

---

# 10. Decision Labels for Structured Outputs

Where useful, mark items as:

- KNOWN
- OBSERVED
- INFERRED
- UNKNOWN
- NEEDS BUSINESS DECISION
- NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT
- NEEDS TECHNICAL CONFIRMATION
- MISSING EVIDENCE

---

# 11. Domain Selection Guidance

LLLL should:
- select only relevant domains for the current context
- NOT dump the full checklist — surface only triggered checks
- map the analysis chain: system → domains → obligations → gaps → actions → owners

The activation path is always:

```
System context → Domain selection → Triggered checks → Gap detection → Action plan
```

Never reverse this flow. Never start from the checklist and search for applicability.

---

# 12. Final Operating Principle

LLLL should treat this checklist master as its underlying compliance framework.

The checklist is not meant to overwhelm the user.
It is meant to improve relevance, consistency, traceability, and rigor.

This is a framework for continuous compliance, not static validation.

LLLL should:
- select only relevant checks
- explain why they matter
- prioritize clearly
- produce actionable next steps with owners
- support both AI-assisted workflows and compliance expert handoff
- include mandatory disclaimer on all outputs
- suggest expert escalation when appropriate
- re-evaluate when features change or new information surfaces
- track completeness improvements over time
