# LLLL — Layrix Compliance Layer for Claude Code

LLLL (Layrix Logic Layer Loop) is an embedded compliance layer for AI-built software. It adds a skill to Claude Code that reviews features, PRDs, code and repositories against a 15-domain compliance framework, runs read-only security scans, maps features to policies, and prepares expert-ready briefs. It is analysis only: it never edits your files.

LLLL is not legal advice. Every output carries a disclaimer and suggests review by a compliance or legal professional where it matters.

## What you get

- **Design-time review** — after you plan a feature or generate code, LLLL appends the compliance domains it triggers, the gaps, and what to do next.
- **Commands** — diagnosis, deep analysis, checklist, brief, feature-versus-policy diff, scan, fix guidance, GRC dashboard, expert review hand-off, and push and release gates.
- **How to invoke it** — Claude Code namespaces plugin skills, so when LLLL is installed as a plugin you type /layrix:llll followed by the mode, for example /layrix:llll scan or /layrix:llll guard push. LLLL also activates on its own when your request matches it. The shorter /llll form is what you get when you install from the repository clone instead. The menus and next-step suggestions LLLL prints use whichever form matches how it was installed.
- **Guard** — a push and release compliance gate. It needs the separate Guard engine (below); without it LLLL only gives advisory output and says so.

## Install the Guard engine (optional, recommended)

The plugin contains only the skill. The Guard engine is a separate Node.js program (Node.js 22.12 or newer), published on npm as @layrix.ai/llll-guard:

    npm install -g @layrix.ai/llll-guard
    llll-guard --version

Source: https://github.com/layrix-ai/LLLL (folder llll-guard). Without the engine, guard commands run in advisory mode and are labelled "Advisory only, not the Guard gate".

## What it runs, reads and sends

The plugin and the Guard engine make no network requests of their own, and nothing is collected or sent to Layrix. Your code is never uploaded by default. Layrix's separate paid services may offer an optional connection that uploads code you choose, only when you ask for it; this plugin does not include one. The one thing to know about is the dependency audit tools below: Claude may run them in scan mode, and they use the network themselves.

- **Skill instructions only.** The plugin has no hooks, no MCP servers and no bundled executables. It tells Claude what to read and which commands it may run.
- **Tools Claude may use without asking first:** Read, Grep and Glob; read-only git commands (diff, log, status, ls-files, check-ignore, rev-parse); the Guard engine's push and release commands (also through the launcher in a repository clone); and a dry-run npm pack with scripts disabled. Everything else, including writing or editing files, find, test and any other shell command, is not pre-approved, so Claude Code asks before it runs.
- **Dependency audit tools (scan mode):** npm, yarn and pnpm audit send your project's dependency names and versions to the package registry. pip-audit runs only with --no-deps: it checks the exact versions written in a requirements file against a vulnerability database and installs nothing (a file with unpinned entries is reported as not checkable). cargo audit, govulncheck and bundle audit query their advisory databases. This traffic comes from those tools running on your machine as you, not from LLLL.
- **Files read outside your project:** the skill's own reference documents, and an optional file at ~/.layrix/config.json that records whether you registered with Layrix. That file can also hold your Layrix license key, so the skill never reads its contents: it runs a search that only counts whether "registered": true appears, and decides how many findings to show from that number. The key and the email never enter the conversation. The Guard engine, which runs on your machine and not in the conversation, reads the email in it to name you in the override log. Nothing from this file is uploaded.
- **Files written:** none by the skill. The Guard engine writes an override log under .llll/logs/ in the project, and only when you run llll-guard override yourself. If you run Guard from the repository clone instead of npm, its launcher also leaves a not-run note in .llll/logs/ when a pre-push hook cannot find Node or the engine. If you ask LLLL to keep an analysis, it can save it under .llll/scratch/ (opt-in; marked do-not-upload).
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
