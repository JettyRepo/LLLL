# Contributing

Thanks for helping. LLLL is a compliance skill (`SKILL.md` and the reference `.md` files, in `plugins/llll/skills/llll/`) plus the Guard engine in `llll-guard/` (TypeScript).

## Ground rules

- Open an issue first for anything bigger than a small fix, so the direction is agreed before you write it.
- Changes go through a pull request. `main` requires the CI checks to pass.
- Keep a change focused: every changed line should trace to the issue it fixes.
- **Do not paste third-party text** (standards, textbooks, competitors' content, official exam questions) into the repository. Reference material is for understanding; what you write must be your own wording.
- Security problems: do not open an issue; follow [SECURITY.md](SECURITY.md).

## Working on the engine

```bash
cd llll-guard
npm ci
npm run lint     # type-check source and tests
npm test         # unit and end-to-end tests (they run real git and the real CLI)
npm run build
```

- Needs Node.js 22.12 or newer. The end-to-end tests also run the launcher under the system `/bin/bash` (3.2 on macOS), so keep `guard` bash 3.2 safe: no associative arrays.
- Write the test first. A bug fix needs a test that fails without it.
- Contract to keep: exit `0` passed, `1` blocked, `2` the guard could not run. "Could not run" is never a pass.
- Rules live in the engine; `plugins/llll/skills/llll/guard-patterns.md` documents them and a test checks that the rule ids match. Adding or changing a rule means updating both.

## Working on the skill and reference files

- Run `./verify.sh` from the repository root. It checks structure, the version in `VERSION`, `allowed-tools`, and that scripts parse.
- Unregistered folding is `round(N/2)` rows per finding table, by severity descending. Do not describe it any other way.
- Legal and regulatory statements need a source and, for anything non-trivial, review by a qualified person.

## Commits and pull requests

- Commit messages: `type: description` (`feat`, `fix`, `docs`, `test`, `chore`, `ci`, ...), with a body saying why.
- Rebase your branch on the latest `main` before opening the PR; PRs are squash-merged.
