# LLLL — Layrix Compliance Layer for Claude Code

LLLL (Layrix Logic Layer Loop) is an embedded compliance layer for AI-built software. It adds a skill to Claude Code that reviews features, PRDs, code and repositories against a 15-domain compliance framework, runs read-only security scans, maps features to policies, and prepares expert-ready briefs. It is analysis only: it never edits your files.

LLLL is not legal advice. Every output carries a disclaimer and suggests review by a compliance or legal professional where it matters.

## What you get

- **Design-time review** — after you plan a feature or generate code, LLLL appends the compliance domains it triggers, the gaps, and what to do next.
- **Commands** — diagnosis, deep analysis, checklist, brief, feature-versus-policy diff, scan, fix guidance, GRC dashboard, expert review hand-off, and push and release gates.
- **How to invoke it** — Claude Code namespaces plugin skills, so when LLLL is installed as a plugin you type /llll:llll followed by the mode, for example /llll:llll scan or /llll:llll guard push. LLLL also activates on its own when your request matches it. The shorter /llll form is what you get when you install from the repository clone instead.
- **Guard** — a push and release compliance gate. It needs the separate Guard engine (below); without it LLLL only gives advisory output and says so.

## Install the Guard engine (optional, recommended)

The plugin contains only the skill. The Guard engine is a separate Node.js program (Node.js 22.12 or newer), published on npm as @layrix.ai/llll-guard:

    npm install -g @layrix.ai/llll-guard
    llll-guard --version

Source: https://github.com/layrix-ai/LLLL (folder llll-guard). Without the engine, guard commands run in advisory mode and are labelled "Advisory only, not the Guard gate".

## What it runs, reads and sends

Nothing in this plugin makes network requests of its own, and nothing is collected or sent to Layrix.

- **Skill instructions only.** The plugin has no hooks, no MCP servers and no bundled executables. It tells Claude what to read and which commands it may run.
- **Commands Claude may run, without asking first:** read-only git commands (diff, log, status, ls-files, check-ignore, rev-parse), the Guard engine's push and release commands, a dry-run npm pack, and the dependency audit tools for scan mode: npm, yarn, pnpm, pip-audit, cargo audit, govulncheck and bundle audit. The audit tools contact the public advisory data their ecosystems use; that traffic comes from those tools, not from LLLL. Writing or editing files and unrestricted shell access are not pre-approved, so Claude Code asks before any of them.
- **Files read outside your project:** the skill's own reference documents, and an optional file at ~/.layrix/config.json that records whether you registered with Layrix. The skill reads it to decide how many findings to show, and the Guard engine reads the email in it to name you in the override log. It is read locally and never uploaded.
- **Files written:** none by the skill. The Guard engine, when you run it, writes an override log and a not-run log under .llll/logs/ in the project. If you ask LLLL to keep an analysis, it can save it under .llll/scratch/ (opt-in; marked do-not-upload).
- **Git hooks:** installed only when you run llll-guard install-hook yourself, per project. An existing pre-push hook is kept and still runs; uninstall with llll-guard uninstall-hook.
- **Personal data:** code and documents you point LLLL at are processed by Claude in your session under your Claude plan. LLLL does not store them.

## Free tier and registration

LLLL is MIT licensed and free to use. Without a Layrix registration, each findings table shows about half of its rows, highest severity first, and names the folded ones. Registering is free at https://layrix.ai and shows every finding. The check is local, and the Guard engine's blocking behaviour does not depend on it. Human expert review is a separate per-engagement service that you request yourself at review@layrix.ai; LLLL only prepares the brief.

## Support, privacy and terms

- Issues: https://github.com/layrix-ai/LLLL/issues
- Security reports: see SECURITY.md in the repository
- Privacy policy: https://layrix.ai/privacy
- Terms of service: https://layrix.ai/terms

Published by Caerus Enterprises Inc. under the Layrix name. Licensed under the MIT License.
