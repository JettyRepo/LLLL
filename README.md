# LLLL — Compliance OS for Claude Code

A project-aware Compliance Operating System that runs as a Claude Code skill. LLLL analyzes product features, codebases, and documentation to detect compliance gaps and generate actionable guidance.

## Features

- **Context-aware analysis** — automatically reads README, PRD, and policy files
- **Feature-to-policy mapping** — maps product features to required compliance coverage
- **Diff detection** — identifies gaps between features and existing policies
- **Lawyer-ready briefs** — generates structured handoff documents for legal counsel
- **Design-time governance** — catches compliance issues during feature planning

## Commands

| Command | Description |
|---------|-------------|
| `/llll` | Full compliance analysis |
| `/llll deep` | Deep analysis with sensitivity assessment |
| `/llll brief` | Lawyer handoff brief |
| `/llll checklist` | Structured intake checklist |
| `/llll diff` | Feature vs policy coverage matrix |

## Installation

Symlink into Claude Code skills directory:

```bash
ln -s /Users/vox/LLLL ~/.claude/skills/llll
```

## File Structure

```
SKILL.md              — Core skill definition and reasoning engine
checklist-schema.md   — Checklist categories and decision/legal split
output-templates.md   — Output format templates for all modes
examples.md           — Usage examples and expected outputs
```

## Version

v1.2 — Engineering Mode with diff engine, context awareness, and API pre-structure.
