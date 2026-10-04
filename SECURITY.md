# Security Policy

LLLL Guard is a tool that decides whether code may leave a machine, so a bug that makes it pass something it should block (or crash into a pass) is a security issue.

## Reporting a vulnerability

Please **do not open a public issue** for a vulnerability.

Report it privately through GitHub: open the **Security** tab of this repository and choose **Report a vulnerability**
(<https://github.com/layrix-ai/LLLL/security/advisories/new>).

Useful in a report: the version (`llll-guard --version`), the command, a minimal repository or input that shows the problem, what you expected and what happened (exit code and output). Use obviously fake secrets in examples.

## What counts

- A leaked secret, private key or personal-data pattern that the push or release gate lets through.
- The gate exiting `0` when it could not look (the contract is: `0` passed, `1` blocked, `2` the guard could not run).
- A way to switch the gate off from inside a push (policy, `.guardignore`, overrides).
- Code execution through file names, branch names, policy files or package contents.
- A supply-chain problem in the published package.

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.3.x   | Yes (requires Node.js 22.12 or newer) |
| 0.2.x   | No: upgrade to 0.3.x (0.2.x runs on Node.js 20, which is end of life) |
| < 0.2   | No (the bash-only Guard has known fail-open bugs; upgrade) |

## What to expect

We aim to acknowledge a report within 5 working days and to tell you what we decided. Fixes ship as a new version of `@layrix.ai/llll-guard`, with the problem described in the release notes once users have had a chance to update.
