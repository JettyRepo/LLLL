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

---

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

---

# 9. Industry-Specific and High-Sensitivity Activation Layer

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

# 10. Output Mapping Rules

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

# 11. Decision Labels for Structured Outputs

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

# 12. Domain Selection Guidance

LLLL should:
- select only relevant domains for the current context
- NOT dump the full checklist — surface only triggered checks
- map the analysis chain: system → domains → obligations → gaps → actions → owners
- always evaluate Layer 0 domains (N, O) first — software resilience issues undermine all other compliance work
- when Layer 0 findings are Critical or High, insert Foundation Alert before main analysis

The activation path is always:

```
System context → Domain selection → Triggered checks → Gap detection → Action plan
```

Never reverse this flow. Never start from the checklist and search for applicability.

---

# 13. Final Operating Principle

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
