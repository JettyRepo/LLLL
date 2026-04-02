# Incident Response Plan — Layrix

**Version**: 1.0
**Effective**: April 2, 2026
**Owner**: Engineering + Product

---

## 1. Severity Levels

| Level | Definition | Response Time | Examples |
|-------|-----------|---------------|----------|
| **P0 — Critical** | Service down, data breach, secret exposure | Immediate (< 1 hour) | layrix.ai down, credentials leaked in git, user data exposed |
| **P1 — High** | Major feature broken, security vulnerability | < 4 hours | Registration broken, Guard not blocking secrets, legal pages 404 |
| **P2 — Medium** | Degraded experience, minor bug | < 24 hours | Theme broken on one page, slow response times, typo in legal docs |
| **P3 — Low** | Cosmetic, enhancement | Next sprint | Animation glitch, minor wording improvement |

---

## 2. Contact Chain

| Role | Contact | When |
|------|---------|------|
| Engineering Lead | jeff (primary) | All incidents |
| Legal/Compliance | review@layrix.ai | P0 data breach, legal doc issues |
| Cloudflare Support | Dashboard | Infrastructure issues |

---

## 3. Response Procedures

### P0 — Critical (Service Down / Data Breach)

**Immediate (0-15 min):**
1. Confirm the incident — check from multiple locations / devices
2. If site down: check Cloudflare Dashboard → Workers & Pages → layrix-ai
3. If secret leaked: revoke immediately, rotate credentials

**Contain (15-60 min):**
4. If Worker issue: `cd layrix-backend && wrangler deploy` (redeploy last known good)
5. If Pages issue: `wrangler pages deploy site/ --project-name=layrix-ai` (redeploy)
6. If DNS issue: check Cloudflare DNS → verify CNAME → `layrix-ai.pages.dev`
7. If route issue: check `wrangler.toml` — verify NO `layrix.ai/*` catch-all

**Recover (1-4 hours):**
8. Verify all pages respond: run `site/verify-deploy.sh`
9. If git secret leak: `git filter-branch` or BFG to remove from history
10. Notify affected users if data breach (PIPEDA requires "as soon as feasible")

**Post-incident:**
11. Write incident report (What, When, Why, How fixed, How to prevent)
12. Update controls (add to verify-deploy.sh, .guardignore, or DEPLOY.md)

### P1 — High (Major Feature Broken)

1. Reproduce the issue
2. Check recent deployments: `wrangler pages deployment list --project-name=layrix-ai`
3. If recent deploy caused it: rollback via Cloudflare Dashboard → Deployments → Roll back
4. Fix in code → test locally → deploy
5. Run `site/verify-deploy.sh` to confirm fix

### P2/P3 — Medium/Low

1. Log in TODO.md
2. Fix in next work session
3. Deploy normally

---

## 4. Rollback Procedures

### Cloudflare Pages (landing + legal pages)
```bash
# List recent deployments
wrangler pages deployment list --project-name=layrix-ai

# Rollback: redeploy from local site/ directory
CLOUDFLARE_API_TOKEN="..." npx wrangler pages deploy site/ --project-name=layrix-ai --commit-dirty=true
```

### Cloudflare Worker (register + activate + API)
```bash
# Rollback: redeploy from local source
cd /Users/vox/layrix-backend
CLOUDFLARE_API_TOKEN="..." npx wrangler deploy

# CRITICAL: Verify routes after every Worker deploy
# Must NOT contain layrix.ai/* catch-all
bash verify-routes.sh
```

### Git (code rollback)
```bash
# Revert last commit
git revert HEAD

# Nuclear option (lose recent commits)
git reset --hard <known-good-commit>
git push --force-with-lease
```

---

## 5. Communication Templates

### Site Down (for status page / email)
```
Layrix is currently experiencing service disruption.
We are investigating and working to restore service.
ETA: [X minutes/hours].
Updates at: [channel]
```

### Data Breach (PIPEDA notification)
```
We are writing to inform you of a security incident affecting your account.

What happened: [description]
When: [date/time]
What data was affected: [email, etc.]
What we've done: [steps taken]
What you should do: [if applicable]

Contact: info@layrix.ai
```

---

## 6. Prevention Checklist

| Control | Status |
|---------|--------|
| LLLL Guard pre-push hook | Active |
| .guardignore for self-scan exclusions | Active |
| verify-deploy.sh (theme + footer + WCAG + internal docs) | Active |
| verify-routes.sh (no catch-all Worker route) | Active |
| .gitignore (site/, .local/, internal docs) | Active |
| DEPLOY.md checklist | Active |
| Site heartbeat monitoring | Planned |
| Branch protection | Pending (requires public repo or GitHub Pro) |

---

## 7. Post-Incident Review Template

```
## Incident Report: [Title]

**Date**: [YYYY-MM-DD]
**Severity**: P[0-3]
**Duration**: [start] — [end] ([X] minutes)
**Impact**: [what users experienced]

### Timeline
- [HH:MM] — [event]

### Root Cause
[description]

### Resolution
[what fixed it]

### Prevention
- [ ] [control added to prevent recurrence]

### Lessons Learned
[what we learned]
```
