# LLLL Output Standards: Expert Escalation and Coverage Confidence v5.0

> Part of the LLLL skill. `SKILL.md` says when to read this file; the rules here apply together with it.

## HUMAN EXPERT ESCALATION

When analysis identifies:
- High-risk gaps in sensitive domains (Domain M)
- Complex regulatory questions requiring jurisdiction-specific expertise
- Items labeled NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT

Include escalation suggestion:

> This may require a compliance expert or legal professional review.

Then add the human review CTA:

> 🔵 Human expert review available — senior compliance lawyers review your specific findings
> → `/llll review` to generate a review request

Escalation is:
- Optional
- Value-added
- A higher confidence layer
- Available on-demand from experienced senior compliance lawyers

Never force escalation. Position it as additional assurance.

The review CTA appears:
- After Human Review Flags section in `/llll deep`
- After Open Compliance / Legal Questions in `/llll brief`
- After any gap table with 2+ items labeled NEEDS COMPLIANCE EXPERT OR LEGAL PROFESSIONAL INPUT
- In the GRC dashboard when any domain scores below 30%

---

## COVERAGE CONFIDENCE INDICATOR

Every LLLL output includes a Coverage Confidence section. It appears after the Action Plan and before Education Insight.

Purpose: give users a transparent signal of how much to trust this specific analysis. Prevent false confidence from a clean-looking report that was based on thin evidence.

### Three Factors

| Factor | What it measures | How to compute |
|--------|-----------------|----------------|
| **Context Inputs** | How many expected input sources were available | Count found vs expected: README, docs/PRD, policies/terms, code, dependencies. Express as `N/5 found` |
| **Evidence Basis** | Ratio of observed vs inferred vs missing signals | Count all signals across the analysis. Express as `N observed, N inferred, N missing` |
| **Domain Coverage** | Whether all triggered domains were fully evaluated | Count triggered domains with at least one check evaluated vs total triggered. Express as `N/N domains evaluated` |

### Overall Rating

Compute from the three factors:

| Rating | Condition |
|--------|-----------|
| **High** | Context ≥ 4/5 AND evidence ≥ 70% observed AND all triggered domains evaluated |
| **Medium** | Context ≥ 2/5 AND evidence ≥ 40% observed |
| **Low** | Context < 2/5 OR evidence < 40% observed OR any triggered domain not evaluated |

### Output Format

```
### Coverage Confidence

| Factor | Score | Detail |
|--------|-------|--------|
| Context inputs | N/5 | README ✓, docs ✗, policies ✗, code ✓, deps ✓ |
| Evidence basis | N% observed | N observed, N inferred, N missing |
| Domain coverage | N/N | All triggered domains evaluated / [list unevaluated] |

**Overall: High / Medium / Low**

To increase confidence: [list specific missing inputs or evidence that would raise the rating]
```

The "To increase confidence" line is actionable — it tells the user exactly what to provide for a stronger analysis.

### Interaction with Registration Status

Coverage Confidence is shown for ALL users (Unregistered and Basic). It is never folded.

---
