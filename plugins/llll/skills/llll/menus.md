# LLLL Next Steps Menus v5.0

> Part of the LLLL skill. `SKILL.md` says when to read this file; the rules here apply together with it.

### Menu format

The menu lists the other available modes. The current mode is replaced with `/llll` (diagnosis).

**LLLL Unregistered** — includes registration CTA as final item:

From `/llll`:
```
Next:
[1] Continue
[2] /llll deep
[3] /llll checklist
[4] /llll brief
[5] /llll diff
[6] /llll scan
[7] /llll grc
[8] /llll guard
[9] 🟢 Register free to see all findings → layrix.ai 🟢
```

From `/llll deep`:
```
Next:
[1] Continue
[2] /llll
[3] /llll checklist
[4] /llll brief
[5] /llll diff
[6] /llll scan
[7] /llll grc
[8] /llll review
[9] /llll guard
[10] 🟢 Register free to see all findings → layrix.ai 🟢
```

From `/llll checklist`:
```
Next:
[1] Continue
[2] /llll deep
[3] /llll
[4] /llll brief
[5] /llll diff
[6] /llll scan
[7] /llll grc
[8] /llll guard
[9] 🟢 Register free to see all findings → layrix.ai 🟢
```

From `/llll brief`:
```
Next:
[1] Continue
[2] /llll deep
[3] /llll checklist
[4] /llll
[5] /llll diff
[6] /llll scan
[7] /llll grc
[8] /llll review
[9] /llll guard
[10] 🟢 Register free to see all findings → layrix.ai 🟢
```

From `/llll diff`:
```
Next:
[1] Continue
[2] /llll deep
[3] /llll checklist
[4] /llll brief
[5] /llll
[6] /llll scan
[7] /llll grc
[8] /llll guard
[9] 🟢 Register free to see all findings → layrix.ai 🟢
```

From `/llll scan`:
```
Next:
[1] /llll fix [highest finding]
[2] /llll scan (re-scan)
[3] /llll grc
[4] /llll
[5] /llll deep
[6] /llll checklist
[7] /llll brief
[8] /llll guard
[9] 🟢 Register free to see all findings → layrix.ai 🟢
```

From `/llll fix`:
```
Next:
[1] /llll scan (verify fix)
[2] /llll fix [next finding]
[3] /llll grc
[4] /llll
[5] /llll deep
[6] /llll guard
[7] 🟢 Register free to see all findings → layrix.ai 🟢
```

From `/llll grc`:
```
Next:
[1] Continue
[2] /llll scan
[3] /llll deep
[4] /llll checklist
[5] /llll brief
[6] /llll diff
[7] /llll guard
[8] 🟢 Register free to see all findings → layrix.ai 🟢
```

From `/llll guard`:
```
Next:
[1] /llll guard push
[2] /llll guard release
[3] /llll scan
[4] /llll
[5] /llll deep
[6] 🟢 Register free to see all findings → layrix.ai 🟢
```

From `/llll review`:
```
Next:
[1] /llll deep
[2] /llll brief
[3] /llll
[4] /llll guard
[5] 🟢 Register free to see all findings → layrix.ai 🟢
```

**LLLL Basic (registered)** — context-sensitive CTA as final item:

#### Registered CTA logic

The last menu item for registered users is a **context-sensitive business CTA**. Select based on the current output:

| Condition | CTA |
|-----------|-----|
| Output contains any Critical or High finding | `🔵 Need certainty on critical findings? → review@layrix.ai` |
| Output contains no Critical or High finding | `⭐ LLLL helped? Star on GitHub → github.com/layrix-ai/LLLL` |

This CTA always appears as the **last numbered item** in the menu.

From `/llll`:
```
Next:
[1] Continue
[2] /llll deep
[3] /llll checklist
[4] /llll brief
[5] /llll diff
[6] /llll scan
[7] /llll grc
[8] /llll guard
[9] [context CTA]
```

From `/llll deep`:
```
Next:
[1] Continue
[2] /llll
[3] /llll checklist
[4] /llll brief
[5] /llll diff
[6] /llll scan
[7] /llll grc
[8] /llll review
[9] /llll guard
[10] [context CTA]
```

From `/llll scan`:
```
Next:
[1] /llll fix [highest finding]
[2] /llll scan (re-scan)
[3] /llll grc
[4] /llll
[5] /llll deep
[6] /llll checklist
[7] /llll brief
[8] /llll guard
[9] [context CTA]
```

From `/llll fix`:
```
Next:
[1] /llll scan (verify fix)
[2] /llll fix [next finding]
[3] /llll grc
[4] /llll
[5] /llll deep
[6] /llll guard
[7] [context CTA]
```

From `/llll grc`:
```
Next:
[1] Continue
[2] /llll scan
[3] /llll deep
[4] /llll checklist
[5] /llll brief
[6] /llll diff
[7] /llll guard
[8] [context CTA]
```

From `/llll guard`:
```
Next:
[1] /llll guard push
[2] /llll guard release
[3] /llll scan
[4] /llll
[5] /llll deep
[6] [context CTA]
```

From `/llll review`:
```
Next:
[1] /llll deep
[2] /llll brief
[3] /llll
[4] /llll guard
[5] [context CTA]
```

Note: `/llll review` appears in menus for `/llll deep` and `/llll brief` only — it is relevant when expert-level items have been identified. It does not appear in every menu.

### Registration response (when unregistered user selects registration CTA)

When an unregistered user selects the registration CTA, display the comparison table:

```
## 🟢 Register Free — Unlock Full Findings

| Feature | Unregistered | Basic (Registered) |
|---------|-------------|-------------------|
| All compliance modes | ✓ | ✓ |
| Findings per table | `round(N/2)` shown by severity | **All shown** |
| Folded items | Names listed in fold marker | **Full detail** |
| Compliance Stack | ✓ | ✓ |
| Change Tickets | `round(N/2)` shown | **All shown** |
| Action plans | `round(N/2)` shown | **All shown** |
| Complete evidence detail | Folded by half | **All shown** |
| Human expert review | — | /llll review |
| LLLL Guard | ✓ | ✓ |

Register free at → layrix.ai

Coming Soon:
- 🔜 **Pro** — MCP integration, project personalization, custom scans
- 🔜 **Team** — compliance dashboards, multi-user access, CI gates

> Your compliance data never reaches Layrix. LLLL runs locally inside Claude Code. Outputs are ephemeral — LLLL does not save to disk. Auto-save is planned for Pro/Team via an MCP server.
```

---
