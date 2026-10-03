# LLLL Observation Storage Details v5.0

> Part of the LLLL skill. `SKILL.md` says when to read this file; the rules here apply together with it.

### Why no auto-save in v5.0

Earlier design iterations explored auto-save with pre-save redaction gates and opt-in flags. Both were abandoned because plaintext persistence of `/llll scan` findings — even with redaction — creates an aggregated on-disk record of secrets and vulnerabilities that is itself a high-value target. The cleanest defense is not to persist at all in the free tier. Persistence is a product feature that belongs in a paid tier where it can be done properly (server-side redaction, encryption at rest, retention policies, integrity guarantees) — see the Pro/Team roadmap below.

### Recommended workflow if you want to keep an analysis

You have three options, all **manual**, all **user-controlled**:

1. **Copy-paste**: the analysis is rendered in your Claude Code conversation — copy it to wherever you want
2. **Shell redirect**: pipe terminal output to a file outside of LLLL itself (your shell, not the skill)
3. **Manual scratch directory**: save to the designated local-only `.llll/scratch/` directory (see below)

LLLL plays no role in any of these — the skill never uses the `Write` tool and is not granted write permission in `allowed-tools`.

### `.llll/scratch/` — the designated do-not-upload directory

If you manually archive LLLL analyses, the recommended path is `.llll/scratch/` in your project root. This path is:

- **Gitignored**: the `.llll/` entry in this repo's `.gitignore` covers it (verify your own project's `.gitignore` has `.llll/` too)
- **Hidden**: leading dot reduces accidental discovery, indexing, and cloud-sync agent visibility
- **Consistent with `.llll/logs/guard-log.jsonl`**: one hidden root for all LLLL local artifacts
- **Never touched by LLLL itself**: files only exist because **you** put them there

**You are responsible for:**

- Creating the directory yourself (LLLL does not)
- Setting owner-only permissions (`0700` dir, `0600` files)
- Dropping in a `DO_NOT_UPLOAD.txt` marker so the directory's purpose is visible at a glance
- Verifying your project root is NOT inside iCloud Drive / Dropbox / OneDrive / Google Drive / `~/Documents` (macOS with iCloud Desktop+Documents enabled), AND not automatically indexed by system backup tools (Time Machine, Backblaze, Arq, rsync.net) unless you explicitly want those backups
- Enabling full-disk encryption on your machine (macOS FileVault, Linux LUKS, Windows BitLocker)
- Redacting any sensitive content **before** saving — LLLL provides no runtime redaction in v5.0. For `/llll scan` and `/llll fix` outputs, check your content against the SEC-001..SEC-008 regex patterns defined in `mode-scan.md` (Scan Patterns, also `scan-patterns.md`) (the same list LLLL uses for secret detection) before placing the file in `.llll/scratch/`
- Cleaning up files you no longer need
- **Treating files in `.llll/scratch/` as controlled personal data when applicable** — see the Personal Data subsection below

**Personal data in saved files (GDPR / CCPA / equivalent regimes)**

If you save LLLL analyses that reference or contain personal data — user emails, customer identifiers, test-account data, data-flow diagrams naming real users, compliance briefs for a project that processes personal data, or `/llll brief` outputs for regulated-sector products — **you become the data controller** for those files under GDPR Art. 4(7) and equivalent regimes (CCPA, PIPL, LGPD, UK GDPR). The compliance implications that attach:

- **Storage limitation (GDPR Art. 5(1)(e))** — you need a retention policy aligned with the purpose for which the data was saved. The 90-day cleanup reminder is a nudge, not compliance — decide your own retention window
- **Data minimization (GDPR Art. 5(1)(c))** — only save what you actually need; redact before saving
- **Data subject rights (GDPR Arts. 15–22)** — if a subject exercises access / rectification / erasure rights, you must be able to locate and honor them against `.llll/scratch/` content. If you can't remember what you saved, you can't honor those rights
- **Security of processing (GDPR Art. 32)** — the `0700` / `0600` permissions and gitignored location are baseline; full-disk encryption and backup-tool exclusion are additional layers **you** control

LLLL (the tool) is **not** a data processor or controller for scratch contents — it never writes scratch files, never reads their contents, and never transmits them. The moment you manually save a file to `.llll/scratch/`, the responsibility is entirely yours. This is the trade-off the opt-in manual design makes: maximum user control, maximum user responsibility.

For **regulated sectors** (health, finance, lending, insurance, education, employment, children, biometric, public sector — Domain M in the LLLL checklist), this responsibility is more consequential. Consider whether the scratch workflow is appropriate for your project at all, or whether you should wait for the Pro/Team MCP tier (which will handle retention, encryption, and data subject rights server-side).

### Setup (run once per project, if you choose to use scratch)

```bash
install -d -m 0700 .llll/scratch
cat > .llll/scratch/DO_NOT_UPLOAD.txt <<'EOF'
This directory contains local-only LLLL analysis records.

DO NOT upload, share, sync, or commit any file in this directory.
- .llll/ must be in .gitignore (verify with: git check-ignore .llll/)
- Verify this project is NOT inside iCloud, Dropbox, OneDrive, Google Drive
- Files may contain sensitive compliance findings, vulnerability details,
  or dependency inventories. Treat as confidential local-only artifacts.
EOF
chmod 0600 .llll/scratch/DO_NOT_UPLOAD.txt
```

The `DO_NOT_UPLOAD.txt` marker is the **visible tag** — anyone opening the directory sees the purpose declaration immediately. Combined with the hidden path and the `.gitignore` coverage, this gives the directory multiple redundant "do-not-upload" signals: the path itself, the marker file, the gitignore entry, and this spec.

LLLL does not run these commands for you. Copy-paste them into your shell once per project.

### `/llll guard` has its own persistence — not affected by this section

`/llll guard` writes to `.llll/logs/guard-log.jsonl` — an append-only JSONL audit log for override tracking. That persistence is **part of Guard's own mechanism** and is unaffected by this section. Guard logs are:

- Always written when Guard is invoked (not opt-in, not user-controlled — Guard's job is override accountability, so its log is a required side effect of using Guard)
- Structured JSONL, not markdown
- Intended for override accountability and compliance audit, not user-facing record-keeping
- Written by Guard-specific logic, not by this Observation Storage spec

This section is specifically about **analysis output** (from `/llll`, `/llll deep`, `/llll scan`, etc.). Guard's own behavior is defined in `mode-guard-review.md` (the `/llll guard` section) and is independent.

### Auto-save roadmap (Pro/Team tier, via MCP)

Automatic observation persistence is planned for **Pro/Team tiers** and will be delivered through an **MCP (Model Context Protocol) server** rather than bolted into the free-tier skill. The MCP approach enables what the free tier cannot do safely:

- **Server-side redaction** — secrets never touch the client at all
- **Encryption at rest** — not plaintext markdown
- **Retention policies** — automatic rotation, not user-managed
- **Cross-session state** — project compliance history, trend tracking, diff detection over time
- **Integrity guarantees** — append-only logs with hash chains for compliance evidence
- **Team workflows** — role-based access, reviewer handoff, shared observation history
- **GRC feed integration** — structured storage optimized for dashboard queries

Until the MCP layer ships, v5.0 LLLL remains deliberately stateless. `.llll/scratch/` is a **user-managed workaround**, not a LLLL feature — the product answer for persistence is the MCP server.

---
