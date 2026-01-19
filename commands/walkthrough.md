---
argument-hint: [impl-prompt-path OR target-code]
description: Walk through a design or codebase interactively, pausing for questions at each milestone
---

Walk me through: $ARGUMENTS

**STOP** — do not deliver walkthrough content until approved.

## Plan Structure

Write to your plan file:

1. **Milestones** — numbered list of what you'll walk through
2. **Key files** — paths you'll reference (with line numbers where helpful)
3. **Key design points** — technical details, data structures, trade-offs
4. **Scope** — what's in vs out

Then call `ExitPlanMode`.

## On Approval: Walkthrough Delivery

You ARE the walkthrough agent. For each milestone:

- **Always include `file:line` references** — user wants to jump to code in their editor
- Explain conceptually (what, why, how it fits)
- Show key types, interfaces, data flow with their locations
- Illustrative snippets only — but always cite where to find the full code
- Call out design decisions and trade-offs
- **Pause after each milestone**: "Questions? Ready to continue?"

Keep going until:
- [ ] User understands the structure and responsibilities
- [ ] User understands key concepts
- [ ] All questions answered
- [ ] User ready to approve implementation (or request changes)

## File Output Mode

Only if user explicitly asks to "write a prompt file" or "save for later":

Output to `.ai-reference/prompts/<timestamp>-walkthrough-<task-slug>.md`
