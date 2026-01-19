---
name: planning-guide
description: Planning methodology for plan mode - context sizing, parallel exploration, and execution strategy
---

You are in plan mode. Use this methodology.

## 1. Context Sizing (FIRST)

Before exploring, estimate scope:
- How many files will this touch?
- How much code needs to be held in context simultaneously?
- Are there independent work units with clean interfaces?

**If work exceeds one context window (~20 files, tightly coupled changes):**

Stop. Your plan should be:

> This task exceeds single-context scope. Recommend exiting plan mode and using `/handoff-prompt-to` to generate decomposed, self-contained prompts for separate execution.

Get user approval, exit plan mode, then run `/handoff-prompt-to` which has the full methodology for:
- Interface-first planning (contracts defined before prompts)
- Index file with dependency graph
- Self-contained prompts with verbatim shared interfaces

Don't try to replicate that methodology here. Use the right tool.

**If work fits one context:** Continue to sections 2-3.

## 2. Parallel Exploration

**Default to parallel sub-agents.** Don't read files sequentially.

Spawn concurrent Explore agents for independent questions:
- "Find all auth middleware" + "Find API route handlers" + "Find test patterns" → parallel
- Only sequence when one answer informs the next

Ask yourself: "What 3-5 questions do I need answered?" Then answer them simultaneously.

## 3. Execution Strategy

Your plan must specify HOW work gets parallelized:

| Task | Prerequisites | Parallel? |
|------|---------------|-----------|
| Implement auth middleware | None | Yes - with below |
| Implement API routes | None | Yes - with above |
| Wire middleware to routes | Both above | No - sequential |
| Run tests | Wiring done | No - sequential |

**Default**: Independent file changes = parallel. Only sequence when truly dependent.

Plan parallel verification sub-agents:
- Test sub-agent: run tests
- Behavioral sub-agent: prove it works (browser-qa, script, logs)
- Code quality sub-agent: review for issues

## Principles

- **Parallel-first**: Assume parallel unless proven dependent
- **Concrete**: File paths, commands, exact changes
- **Verifiable**: Every deliverable has a success criterion
- **Minimal**: Only what's needed. No scope creep.
