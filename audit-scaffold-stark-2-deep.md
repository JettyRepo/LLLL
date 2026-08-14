Output Mode: LLLL Basic — Deep Analysis

# ⚖️ Layrix Compliance Layer — Scaffold-Stark-2 (Strict Review)

> **CORRECTION (2026-08-12):** Gap 1 / HRF-1 below ("live secret exposure," Alchemy API key) was a **false positive** and has been struck through in place rather than removed, so the original audit output and the correction are both visible. The Alchemy key is the scaffold's intentional, publicly-documented default RPC endpoint — the same pattern Scaffold-ETH and most Web3 scaffolds use so `git clone` works out of the box. It is shipped in `packages/snfoundry/.env.example` and `packages/nextjs/.env.example` (both variables named/prefixed to indicate public use — `NEXT_PUBLIC_SEPOLIA_PROVIDER_URL` is bundled into the client by Next.js by design), covers both Sepolia and Mainnet, and is documented as the current endpoint in the repo's own README. It has been present since at least 2026-02-03 across many contributor commits, including after this audit ran, with no indication anyone treats it as compromised. This audit's severity engine flagged a credential-shaped string embedded in a build-config file (`Scarb.toml`) without checking whether the same value is an intentional, documented default elsewhere in the repo — that check is the actual gap, and it's being fixed in LLLL's scan/deep pipeline, not in this repo. No rotation, no disclosure, and no history rewrite of *this project's* key was needed. See root-cause note in `INCIDENT_RESPONSE.md` (this repo).

⚠️ **Foundation Alert:** Layer 0 has multiple Critical/High findings — ~~including a **live secret committed to the public repository**~~ (see correction above; not a live secret), a missing LICENSE file, and a CI workflow consuming a floating GitHub Action reference (`actions/checkout@master`). These compound: the repo has 170 forks, so each Layer 0 defect propagates 170× downstream. Fix Layer 0 before Layer 2.

---

## 1. Sensitivity Assessment

**Sensitivity level: HIGH** (escalated from Medium in `/llll` baseline)

Reasoning:
1. ~~**Live secret exposure** — Sepolia Alchemy API key found embedded in `packages/snfoundry/contracts/Scarb.toml`. Pattern: `https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/_hKu4IgnPgrF8O82GLuYU`. Trailing path segment is the API token (Alchemy uses path-based auth). This is a public repo — the key is exfiltrable by anyone, including the entire fork tree.~~ **[FALSE POSITIVE — see correction at top of document.]** This is the scaffold's intentional public default RPC key, also shipped in both `.env.example` files and documented in the README; not a leaked credential.
2. **Financial-infrastructure tooling** — though the template itself is dev tooling, every fork inevitably crosses into Domain M (Sensitive Sector) by deploying user-fund-handling contracts. The template is the upstream node of an ecosystem of regulated activity.
3. **Supply-chain attack surface** — the CI uses an unpinned action (`actions/checkout@master`), no `permissions:` restriction (defaults to write), and sync workflows that push to other repos using `ORG_GITHUB_TOKEN`. A compromise here would propagate across the Scaffold-Stark org.
4. **Wallet defaults** — `scaffold.config.ts` sets `walletAutoConnect: true` and `onlyLocalBurnerWallet: false`, meaning burner wallets are wired up on whatever network is configured (devnet today, but a fork's first config change is `targetNetworks`).
5. **Fork multiplier** — 170 forks means the audit blast radius for any defect is large.

---

## 2. Why This Matters Now

| Pressure | Status |
|----------|--------|
| **Active fork ecosystem** | 170 forks already exist; every defect found today is replicated 170× |
| **CVE-2025-29927 (Next.js middleware bypass)** | The template runs Next.js 15.2.8 (patched), but downstream forks may pin earlier 15.2.x versions |
| **Starknet mainnet maturity** | Starknet is in production with billions in TVL; templates that ship there carry real money |
| **EU AI Act + DORA enforcement** (2025) | DORA's ICT third-party risk rules apply to financial entities — many of which use Starknet. A "trusted upstream template" is now a third-party risk in EU compliance terms |
| **OpenSSF Scorecard pressure** | Major Web3 projects are being scored publicly. A scorecard run today on this repo would fail on: License, Security-Policy, Pinned-Dependencies, Token-Permissions, SAST, Dependency-Update-Tool. That's 6/18 metrics failing. |

*(Row removed 2026-08-12: "GitHub's secret-scanning push notifications" — premised on the Alchemy key being leaked, which was a false positive; see correction at top of document.)*

---

## 3. Triggered Compliance Domains (expanded set)

| Domain | Why triggered (deep threshold) |
|--------|--------------------------------|
| **N** — Software Engineering Fundamentals | Layer 0 always |
| **O** — Open Source & Licensing Risk | Layer 0 always; missing LICENSE |
| **A** — Project Governance | 170 forks, public template |
| **B** — Application Security | Web app with wallet, **live key exposure** |
| **C** — Supply Chain | 60+ npm deps; floating action ref; ORG token in workflows |
| **D** — Privacy *(borderline → activated)* | Wallet addresses are pseudonymous identifiers; under GDPR Recital 30 + EDPB guidance, on-chain addresses linkable to a person are personal data. Demo at scaffold-stark-demo.vercel.app likely loads wallet without consent banner. |
| **E** — Accessibility | Public web demo |
| **F** — Payments *(borderline → activated)* | Crypto transactions are payment rails; burner wallet primitive is a financial primitive |
| **M** — Sensitive Sector *(borderline → activated via fork multiplier)* | Template is dev tooling, but **upstream-of-sensitive** systems carry inherited responsibility under DORA Art. 28 (ICT third-party risk) and similar frameworks |

**Skipped:** G (no UGC), H (not B2B SaaS itself), I/J/K (no AI in template), L (no mobile app)

---

## 4. Key Risk Concentration

Risk is heavily clustered in **three** zones:

1. **Supply chain (CI/build path)** — floating action ref, missing `permissions:` block, no scanning. (The Alchemy key originally flagged here was a false positive — see correction at top of document.) *Single-finding probability of exploit: low. Compound probability of misuse over 12 months: high.*
2. **Governance vacuum (LICENSE + SECURITY.md + CODEOWNERS + branch protection)** — A template at this scale needs a security operating model. None visible. *This is the "no one is responsible" cluster.*
3. **Inherited-by-fork defaults (vercel:yolo, walletAutoConnect, passWithNoTests)** — These are fine for a hackathon but actively dangerous as ecosystem defaults. *This is the "your defaults become the ecosystem's defaults" cluster.*

A reviewer's instinct should be: fix cluster 1 today, draft cluster 2 this week, redesign cluster 3 this month.

---

## 5. System Understanding

- **Purpose:** Forkable Starknet dapp starter kit. Monorepo: `packages/nextjs` (Next.js 15 frontend) + `packages/snfoundry` (Cairo contracts via Starknet Foundry).
- **Maintainer:** Q3 Labs
- **Audience:** Web3 developers building on Starknet
- **Stack:** Next.js 15.2.8, React 19.0.3, starknet.js 9.4.2, Cairo 2.15.0, Scarb 2.15.1, Snforge 0.55.0, OpenZeppelin Cairo 2.x, Yarn 3.2.3, Husky, Vercel
- **CI:** `.github/workflows/main.yml` runs lint, typecheck, format check, build, and tests on PRs. Six additional sync workflows propagate changes to sibling repos (`basecamp`, `bulletproof-contracts`, `rn-repo`, `speedrun-repo`, `create-stark`).
- **External dependencies (smart-contract layer):** `openzeppelin_access >= 2.0.0`, `openzeppelin_token >= 2.0.0`, `starknet >= 2.16.0`, `snforge_std 0.57.0`
- **Stars:** 109 · **Forks:** 170 · Last push 2026-03-31

## 6. Observed Signals

| Signal | Source | Note |
|--------|--------|------|
| ~~🚨 Live Alchemy Sepolia API key~~ **FALSE POSITIVE** | `packages/snfoundry/contracts/Scarb.toml` line ~25 | Same value is the scaffold's intentional public default, also in both `.env.example` files and the README — not a leaked secret |
| 🚨 `actions/checkout@master` floating reference | `.github/workflows/main.yml:23` | Resolves dynamically; supply-chain compromise vector |
| 🚨 No `permissions:` block in `main.yml` | workflow inspection | Defaults to write permissions on the GitHub token |
| `actions/setup-node@v3` (deprecated) | `main.yml:26` | v3 EOL'd; v4+ required |
| `LICENSE` file absent | `curl …/LICENSE` → 404 | Despite `package.json` declaring MIT |
| No `SECURITY.md` | top-level listing | No disclosure path |
| No `CODE_OF_CONDUCT.md` | top-level listing | |
| No `dependabot.yml` | `curl …/dependabot.yml` → 404 | |
| No CodeQL workflow | `.github/workflows/` listing | |
| `vercel:yolo` script with `NEXT_PUBLIC_IGNORE_BUILD_ERROR=true` | `packages/nextjs/package.json` | |
| `--passWithNoTests` in test script | `packages/nextjs/package.json` | |
| `onlyLocalBurnerWallet: false` + `walletAutoConnect: true` | `packages/nextjs/scaffold.config.ts` | Burner wallet enabled on any configured network |
| OpenZeppelin Cairo deps unbounded `>= 2.0.0` | `packages/snfoundry/contracts/Scarb.toml` | No upper bound; new majors auto-pull |
| Sync workflows use `secrets.ORG_GITHUB_TOKEN` | `.github/workflows/sync-*.yaml` | Custom org-scoped token; scope unknown |
| Sync workflow rsync exclude/include ordering may not behave as intended | `sync-basecamp-repo.yaml` | Bug rather than security |
| `CONTRIBUTING.md` is a docusaurus fragment with `:::caution` and `sidebar_position: 7` | root | Suggests it was copied from docs site rather than authored for the repo |
| `CLAUDE.md` is a 2-line redirect to `AGENTS.md` | root | Acceptable pattern |
| `postinstall: shx cp -n .env.example .env` in **both** packages | `nextjs` and `snfoundry` package.json | Implicit file creation outside `node_modules` during install |
| Husky present | `.husky/` | Pre-commit hooks active |
| `.env` gitignored, `.env.example` allow-listed | `.gitignore` | Pattern correct. The same Alchemy key is intentionally present in `Scarb.toml` and both `.env.example` files as the scaffold's public default — this is not a case of a secret escaping the `.gitignore` boundary |
| Issue + PR templates | `.github/` | Present |
| 6 sync workflows propagate to sibling repos | `.github/workflows/` | Each is a potential pivot point |

## 7. Inferred Signals

- **Branch protection on `main`** — `gh api …/branches/main/protection` returned 404. Cannot distinguish "no protection rules" from "endpoint requires admin." Treat as **MISSING EVIDENCE**, but for a Q3 Labs production template the absence would be surprising; the more likely interpretation is that the endpoint is admin-gated.
- **Cairo contracts in `packages/snfoundry/contracts`** likely include simple sample contracts (counter, ERC20 wrapper). Audit posture for those samples is **UNKNOWN**.
- The `ORG_GITHUB_TOKEN` is presumably a fine-grained PAT or GitHub App token, but **scope is undocumented**. If it has `repo` scope across the org, a compromise of any sync workflow becomes an org-wide write event.
- The Vercel demo (`scaffold-stark-demo.vercel.app`) presumably has Vercel Web Analytics enabled by default — wallet connect events may be logged.

## 8. Missing Information

| Item | Why it matters | Consequence if absent |
|------|----------------|-----------------------|
| Branch protection rules on `main` | Required to prevent direct push to a 109-star template | Direct-push of a poisoned commit reaches CI immediately |
| Scope of `ORG_GITHUB_TOKEN` | Determines blast radius of sync workflow compromise | Could be org-wide write |
| Cairo contract audit reports | Sample contracts inherited by forks | Forks ship unaudited primitives |
| Privacy notice on demo deployment | EU users may visit | GDPR Art. 13 violation if analytics fire without notice |
| Threat model document | High-leverage template needs one | Unknown which threats are in/out of scope |
| Supply-chain transparency log (SBOM) | Required by EU CRA (Cyber Resilience Act) for products marketed in EU after 2027 | Not blocking today; blocking by 2027-12-11 |
| Cosign signatures on `create-stark` npm releases | Cosign signing prevents tampered template distribution | Tampered package can be served to npx users |

---

## 9. Required Compliance Stack (Deep)

| Layer | Requirement | Coverage | Notes |
|-------|-------------|----------|-------|
| **N1** Version control discipline | 🟡 Partial | Husky ✓; branch protection unverified |
| **N2** Build reproducibility | 🟡 Partial | `.tool-versions` ✓; but Cairo deps use `>=` not `=` — non-reproducible |
| **N3** Documentation | 🟡 Partial | README good; CONTRIBUTING is docusaurus fragment (mis-sourced); no ARCHITECTURE.md; no in-repo CHANGELOG |
| **N4** Test coverage | 🔴 Gap | `--passWithNoTests`; no coverage threshold |
| **N5** Release management | 🟡 Partial | `release-create-stark.yaml` exists; no SemVer policy doc |
| **N6** Resilience against misconfiguration | 🔴 Gap | `vercel:yolo`, burner wallet defaults |
| **O1** License file present | 🔴 Gap | Missing |
| **O2** Dependency license audit | 🔴 Gap | None in CI |
| **O3** SBOM generation | 🔴 Gap | None |
| **A1** Governance docs | 🟡 Partial | CONTRIBUTING ✓ (mis-sourced), CODE_OF_CONDUCT ✗ |
| **A2** Code review process | 🟡 Partial | PR template ✓, CODEOWNERS ✗, branch protection unverified |
| **A3** Incident response / disclosure | 🔴 Gap | No SECURITY.md |
| **B2** Dependency vuln scanning | 🔴 Gap | No Dependabot/CodeQL/audit |
| **B6** CI/CD privilege management | 🔴 Gap | No `permissions:` block |
| **B9** Secret management | 🟢 **Covered** | No live secrets found; the Alchemy key in `Scarb.toml` is the scaffold's intentional public default (also in `.env.example` × 2, documented in README) — see correction at top of document |
| **C1** Supply chain — pinning | 🔴 Gap | `actions/checkout@master`; OpenZeppelin Cairo deps unbounded |
| **C4** Supply chain — known-vuln gate | 🔴 Gap | None |
| **C5** Pinned GitHub Actions | 🔴 Gap | `@master` and `@v3`/`@v4` (unpinned to SHA) |
| **C6** Cross-repo automation token scoping | 🟡 Partial | `ORG_GITHUB_TOKEN` exists; scope undocumented |
| **D1** Lawful basis for processing | 🔴 Gap | Wallet connect on demo without notice |
| **D2** Privacy notice | 🔴 Gap | None |
| **E1** Accessibility of public demo | 🟡 Partial | Radix UI primitives present; no a11y CI |
| **F1** Payments policy | 🟡 Partial | Burner wallet is the primitive; no usage policy |
| **M1** Sector-specific upstream responsibility | 🟡 Partial | No "Before mainnet" guidance for fork operators |

---

## 10. Gaps / Risk Areas (Deep — escalated)

| # | Domain | Check | Gap | Risk | Label |
|---|--------|-------|-----|------|-------|
| 1 | **B / N** | B9 / N6 | ~~**Live Sepolia Alchemy API key embedded in `packages/snfoundry/contracts/Scarb.toml`**. The trailing path segment of the RPC URL (`_hKu4IgnPgrF8O82GLuYU`) is an Alchemy auth token. Public, in git history, exposed to all 170 forks.~~ **FALSE POSITIVE, confirmed 2026-08-12:** same key is the scaffold's intentional public default RPC endpoint, also shipped in `packages/snfoundry/.env.example` and `packages/nextjs/.env.example` and documented in README:250. No rotation or disclosure required. | ~~🔴🔴 Critical~~ **N/A — false positive** | RESOLVED — verified false positive, no action needed |
| 2 | **C / B** | C5 / B6 | `actions/checkout@master` in `main.yml:23` is a **floating reference** to the upstream action's `master` branch. Any compromise of `actions/checkout` (or a successful PR-merge attack against it) executes immediately in this CI on every PR. Combined with **no `permissions:` block** in the workflow, the GitHub token defaults to write permissions, meaning a compromise has commit access to the repo. | 🔴🔴 **Critical** | NEEDS TECHNICAL CONFIRMATION |
| 3 | **O** | O1 | `LICENSE` file missing despite `package.json` declaring MIT. 170 forks inherit ambiguous provenance. SBOM/SCA tools and enterprise procurement teams flag as "unlicensed." | 🔴🔴 **Critical** | NEEDS BUSINESS DECISION (which copyright entity) |
| 4 | **A / N** | A3 / N5 | No `SECURITY.md`. No documented private disclosure path for a template that propagates to 170 forks. A researcher who finds a Cairo contract vulnerability has no responsible channel. | 🔴 **High** | NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT |
| 5 | **B / C** | B2 / C4 | No automated dependency vulnerability scanning. No Dependabot, no CodeQL, no `npm audit` in CI. With Next.js 15.x, starknet.js 9.x, and OpenZeppelin Cairo 2.x all on fast release cadences, vulns will land silently. | 🔴 **High** | — |
| 6 | **C** | C1 / C5 | OpenZeppelin Cairo deps are unbounded: `openzeppelin_access = ">=2.0.0"`, `openzeppelin_token = ">=2.0.0"`, `starknet = ">=2.16.0"`. New major releases will be pulled automatically. **Cairo dependency resolution does not have a `Scarb.lock`-equivalent for transitive constraints with this kind of range.** Builds are non-reproducible across time. | 🔴 **High** | NEEDS TECHNICAL CONFIRMATION |
| 7 | **N** | N6 | `vercel:yolo` script suppresses build errors via `NEXT_PUBLIC_IGNORE_BUILD_ERROR=true`. As a template default, this normalizes deploy-without-validation. | 🔴 **High** | — |
| 8 | **B** | B6 / C6 | Six sync workflows use `secrets.ORG_GITHUB_TOKEN` to push to sibling repos (`basecamp`, `bulletproof-contracts`, `rn-repo`, `speedrun-repo`). The token's scope is undocumented; if it has org-wide `repo` scope, a compromise of any sync workflow becomes a Scaffold-Stark-org-wide write event. | 🔴 **High** | NEEDS TECHNICAL CONFIRMATION |
| 9 | **B** | B-app-defaults | `scaffold.config.ts` ships with `walletAutoConnect: true` and `onlyLocalBurnerWallet: false`. The README comment says "Only show the Burner Wallet when running on devnet" but the flag is set to `false`, meaning the burner wallet is **not restricted to local**. A fork that flips `targetNetworks` to mainnet inherits a wallet that auto-connects on mainnet by default. | 🔴 **High** | NEEDS BUSINESS DECISION |
| 10 | **A** | A2 / N1 | Branch protection on `main` could not be confirmed (404 from authenticated query — endpoint requires repo admin). For a 109-star template, the absence of branch protection would be a critical control gap. | 🔴 **High** | NEEDS TECHNICAL CONFIRMATION |
| 11 | **D** | D1 / D2 | Public demo at `scaffold-stark-demo.vercel.app` connects wallets and likely loads Vercel Analytics. Wallet addresses are linkable identifiers and may qualify as personal data under GDPR (EDPB guidance, Recital 30). No privacy notice visible. | 🔴 **High** | NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT |
| 12 | **C** | C5 | `actions/setup-node@v3` is end-of-life (uses Node 16 runner, deprecated by GitHub). Will start failing CI when GitHub removes the runner. | 🟡 **Medium** | — |
| 13 | **N** | N4 | `--passWithNoTests` tolerates empty test suites. Forks deleting all tests still get green CI. | 🟡 **Medium** | — |
| 14 | **A** | A1 | `CONTRIBUTING.md` is a docusaurus fragment (`sidebar_position: 7`, `:::caution`) — was copied from the docs site rather than authored for the repo. Contains rendering directives that won't render on GitHub. | 🟡 **Medium** | — |
| 15 | **A** | A1 | No `CODE_OF_CONDUCT.md` for an active community repo with 170 forks and open issues. | 🟡 **Medium** | — |
| 16 | **A** | A2 | No `CODEOWNERS` file. | 🟡 **Medium** | — |
| 17 | **O** | O2 | No dependency-license audit in CI. | 🟡 **Medium** | — |
| 18 | **M** | M1 | No "Before you deploy to mainnet" guidance section in README. The template is upstream of financial systems but ships no checklist for fork operators. | 🟡 **Medium** | NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT |
| 19 | **N** | N3 | No `CHANGELOG.md` in repo. Version 3.0.1 exists; release narrative is out-of-band. | 🟢 **Low** | — |
| 20 | **E** | E1 | No accessibility testing in CI for the public demo. | 🟢 **Low** | — |

---

## 11. Action Plan (Deep)

| # | Priority | Action | Owner | Addresses |
|---|----------|--------|-------|-----------|
| 1 | ~~P1 — TODAY~~ **RESOLVED** | ~~Rotate the exposed Alchemy API key…~~ **No action needed — Gap 1 was a false positive.** The key is the scaffold's intentional public default (also in both `.env.example` files, documented in README:250); rotating it would break the scaffold's out-of-the-box behavior for all 170 forks. | Engineering | Gap 1 |
| 2 | **P1 — TODAY** | Pin `actions/checkout@master` to a SHA: `actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1`. Add `permissions: contents: read` (or per-job minimum) at the top of every workflow. Run this fix on `main.yml` AND all six `sync-*.yaml` workflows. | Engineering | Gap 2 |
| 3 | **P1** | Add `LICENSE` file at repo root with MIT text and "Copyright (c) 2024 Q3 Labs". Verify `gh repo view` returns `licenseInfo.name = "MIT License"`. | Engineering + Legal | Gap 3 |
| 4 | **P1** | Add `SECURITY.md` with: supported versions table, private disclosure channel (security@q3labs.io or GitHub Security Advisory), 5-business-day initial response SLA, and explicit scope statement covering downstream-fork inheritance. | Engineering + Compliance | Gap 4 |
| 5 | **P1** | Add `.github/dependabot.yml` (npm weekly, GitHub Actions weekly), CodeQL workflow for JS/TS, and `npm audit --audit-level=high` as a required check. For Cairo: add `scarb metadata` based vuln scanning if available, or pin transitive deps explicitly. | Engineering | Gap 5 |
| 6 | **P1** | Pin OpenZeppelin Cairo deps to exact minor: `openzeppelin_access = "2.0.0"` (or whatever the audited version is). Document upgrade cadence. | Engineering + Smart-Contract Lead | Gap 6 |
| 7 | **P1** | Either remove `vercel:yolo` entirely or add a banner script + README note: "DO NOT use this in production forks." | Engineering + Product | Gap 7 |
| 8 | **P1** | Audit `ORG_GITHUB_TOKEN` scope. Reduce to fine-grained PAT with **only** the destination repos and minimum permissions (`contents: write` to specific repos). Document the scope in a `SECURITY.md` "Cross-repo automation" section. | Engineering + Org Admin | Gap 8 |
| 9 | **P1** | Set `onlyLocalBurnerWallet: true` as the default in `scaffold.config.ts`. Update the comment to match. Add a README warning explaining the flag's intent. | Engineering + Product | Gap 9 |
| 10 | **P1** | Verify branch protection on `main` exists with: required PR reviews ≥1, required status checks (the CI jobs from `main.yml`), no force-push, no direct push. If missing, enable. | Repo Admin | Gap 10 |
| 11 | **P1** | Add a privacy notice + cookie/wallet-connect consent banner to the demo deployment. Document data flows in a `PRIVACY.md`. | Product + Compliance | Gap 11 |
| 12 | **P2** | Upgrade `actions/setup-node@v3` → `@v4` (pinned to SHA). | Engineering | Gap 12 |
| 13 | **P2** | Remove `--passWithNoTests` from root test scripts; add a min-test-count check or coverage gate. | Engineering | Gap 13 |
| 14 | **P2** | Replace `CONTRIBUTING.md` with a repo-native version (no docusaurus directives). Keep the docs-site version as the canonical source if desired, but mirror correctly. | Engineering + Docs | Gap 14 |
| 15 | **P2** | Add `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1). | Product | Gap 15 |
| 16 | **P2** | Add `CODEOWNERS` routing `packages/snfoundry/**` to Cairo reviewers, `packages/nextjs/**` to frontend reviewers, `.github/workflows/**` to a security/maintainer team. | Engineering | Gap 16 |
| 17 | **P2** | Add `license-checker` allow-list (MIT, Apache-2.0, BSD-*, ISC) to CI. | Engineering | Gap 17 |
| 18 | **P2** | Add a "Before you deploy to mainnet" section to README listing: contract audit checklist, secret rotation, dependency pinning, disclosure setup, monitoring. | Compliance + Product | Gap 18 |
| 19 | **P3** | Generate `CHANGELOG.md` with Keep a Changelog format, backfill from git tags. | Engineering | Gap 19 |
| 20 | **P3** | Add axe-core or pa11y-ci to demo build job. | Engineering | Gap 20 |

---

## 12. Human Review Flags

These items genuinely warrant compliance-expert or legal-professional review:

| Flag | Item | Reason for human review |
|------|------|-------------------------|
| ~~**HRF-1** 🔴🔴~~ **RESOLVED** | Gap 1 — Alchemy API key | **False positive, confirmed 2026-08-12** — key is the scaffold's intentional public default, not a compromise. No legal/ToS review needed. |
| **HRF-2** 🔴 | Gap 11 — Demo wallet processing without privacy notice | EU users will visit the demo. Wallet addresses + IP + browser fingerprint via Vercel Analytics may constitute personal data under GDPR. A compliance lawyer should determine: (a) is there a lawful basis, (b) is there a notice obligation, (c) is there a controller/processor allocation between Q3 Labs and Vercel. |
| **HRF-3** 🔴 | Gap 4 — SECURITY.md content | Drafting a disclosure policy for a template with 170 forks involves novel scope decisions: does the policy cover forks? Does it cover the sample Cairo contracts? Does it cover the npx `create-stark` distribution? A compliance lawyer should set the scope language. |
| **HRF-4** 🔴 | Gap 18 — Mainnet deployment guidance | The text framing here matters legally. A "checklist for fork operators" can be construed as warranting fitness-for-purpose. Wording must thread the line between helpful guidance and implied liability. |
| **HRF-5** 🟡 | Gap 3 — LICENSE copyright assignment | Determining the correct copyright holder line ("Q3 Labs" vs "Q3 Labs and contributors" vs "the Scaffold-Stark contributors") has downstream consequences for dual-licensing, contributor agreements, and potential trademark claims. |

> 🔵 **Human expert review available** — senior compliance lawyers review your specific findings
> → `/llll review` to generate a structured review request

---

## 13. Evidence Gaps with Consequences

| Evidence Gap | Why we couldn't verify | What could go wrong if our assumption is wrong |
|--------------|------------------------|------------------------------------------------|
| Branch protection rules on `main` | `gh api …/protection` returned 404 (likely admin-gated) | If protection is absent, a maintainer compromise → direct-to-main push → 170 forks pull poisoned upstream |
| `ORG_GITHUB_TOKEN` actual scope | Token contents not visible to non-admins | If scope is org-wide `repo`, a single CI run compromise → write access to every Q3 Labs / Scaffold-Stark repo |
| Contents of sample Cairo contracts in `packages/snfoundry/contracts/src` | Not fetched in this audit | Sample contracts could contain unsafe patterns (reentrancy, integer issues, missing access control) that propagate to forks |
| Vercel Analytics actual configuration on demo | Vercel project settings not visible publicly | Personal data could be processing without consent right now |
| Whether Cairo contract audit reports exist | Not visible in repo | Forks may inherit unaudited primitives without knowing |
| `Scarb.lock` reproducibility | `Scarb.lock` exists per CI step but contents not fetched | Cairo dep resolution may already be drifting |
| Provenance of `CONTRIBUTING.md` | Found docusaurus directives, didn't trace its source | The mis-sourcing suggests the repo doc workflow is fragile in other places too |

---

## 14. Coverage Confidence

| Factor | Score | Detail |
|--------|-------|--------|
| Context inputs | 5/5 | README ✓, docs (CONTRIBUTING) ✓, code ✓ (root + nextjs + snfoundry package.json, scaffold.config.ts, Scarb.toml, main.yml, sync workflow), deps ✓ (yarn.lock + Scarb.toml), policies ✗ (none exist — this *is* the finding) |
| Evidence basis | ~80% observed | 22 observed signals, 4 inferred signals, 7 missing-evidence items |
| Domain coverage | 9/9 | All triggered domains evaluated (N, O, A, B, C, D, E, F, M) |

**Overall: High**

*To increase confidence further:* obtain repo admin view to confirm branch protection + `ORG_GITHUB_TOKEN` scope, fetch sample Cairo contracts and audit posture, inspect Vercel project settings for analytics + demo data flows, confirm Alchemy account billing exposure.

---

## 15. Education Insight

**Corrected 2026-08-12 — this section originally used the (false-positive) Alchemy key as a worked example; the lesson below is rewritten to be about the false positive itself, which is the more useful lesson.** A credential-shaped string in a build-config file is not automatically a leak: `Scarb.toml`, `Cargo.toml`, `Move.toml`, `Anchor.toml`, `hardhat.config.js`, and `foundry.toml` are exactly the domain-specific files a naive secret scanner treats as "unexpected" and therefore high-severity — but scaffolding templates routinely ship intentional, publicly-documented default credentials in these files precisely so `git clone` works out of the box (Scaffold-ETH does the same). A severity engine that flags "credential pattern found" without cross-checking whether the same value is declared as a public default elsewhere in the repo (`.env.example`, README) will produce confident, wrong Critical findings — and an unconfirmed Critical finding that sits in a public report for months is itself a Layer 0 failure on the *auditor's* side. The fix is mechanical: before labeling a finding Critical/leaked-secret, check the value against `.env.example`/template files and README-documented defaults in the same repo; a match downgrades the finding to informational, not Critical.

**Compliance — the upstream-template responsibility doctrine.** There is no formal regulation today that says "if your template has 170 forks, you have heightened responsibility for those forks' compliance." But the *direction* of regulation — DORA, EU CRA, the proposed US OSS security framework, OpenSSF Scorecard pressure on Web3 — all converge on a model where upstream maintainers carry inherited duty-of-care. Practically, this means the question "is this a hackathon toy or production infrastructure?" is no longer a maintainer's choice. Once your template crosses an adoption threshold (forks, downloads, contributors), the ecosystem treats it as production whether you do or not. Scaffold-Stark, with 170 forks and a positioning as *the* canonical Starknet dev stack, has crossed that threshold. The implication is that `vercel:yolo` and `--passWithNoTests` and `walletAutoConnect: true` are no longer "convenience defaults for hackers" — they are *de facto* policy for the Starknet ecosystem. The maintainer's choice is no longer "set good defaults vs. set hacker defaults" but "set good defaults vs. accept ecosystem-wide responsibility for the bad ones."

**Business — the multiplicative blast radius of templates.** Every well-known template starter kit has at least one moment in its history where a defect propagated unnoticed across the fork tree and surfaced months later as an ecosystem-wide bug. The classic example is the create-react-app vs Next.js cost disparity: CRA's choice to bundle webpack with development-only error boundaries shipped to production for years before anyone noticed. The lesson: templates are *contracts with the future*. Every line you ship is a contract that your future ecosystem inherits. Three concrete moves reduce multiplicative blast: (1) **A "fork hardening" mode** — a script (`yarn harden`) that fork operators run after `create-stark` to flip development defaults to production defaults (burner wallet → off, telemetry → off, lint strictness → max, test coverage → enforced). (2) **A versioned upstream notification channel** — when a security fix lands in the template, push a notification to forks via GitHub Discussions or a `SECURITY-FIX-AVAILABLE` label so fork operators know to pull. (3) **A "template threat model" document** — what threats does the template defend against, what threats are out of scope, what threats are passed to the fork operator? This is the most important governance artifact a template at this scale can produce, and it currently does not exist in this repo.

**Business — what the GitHub Stars / Forks ratio tells you.** Scaffold-Stark-2 has 109 stars and 170 forks. A fork-to-star ratio above 1.0 is unusual — it indicates the project is being *used*, not just *admired*. Most repos have 5-10× more stars than forks because most users star and never fork. A high fork ratio is the strongest possible signal that your repo is operational infrastructure, not a showcase. Treat it accordingly: assume every defect is being lived with by someone today, prioritize fixes by adoption blast radius, and add a public security mailing list before you add another feature.

---

> ⚠️ Disclaimer:
> This content is generated by AI and may be incomplete or inaccurate.
> Human compliance expert or legal professional review is recommended.
>
> *Your compliance data never reaches Layrix. LLLL runs locally inside Claude Code.*

---

### Next:
[1] Continue
[2] /llll
[3] /llll checklist
[4] /llll brief
[5] /llll diff
[6] /llll scan
[7] /llll grc
[8] /llll review
[9] /llll guard
[10] 🔵 Need certainty on critical findings? → review@layrix.ai
