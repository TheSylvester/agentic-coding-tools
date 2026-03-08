---
argument-hint: [topic, files, diff, module, plan, or any subject]
description: Walk through anything — code, changes, designs, plans — chunk by chunk, pausing for the user to steer
---

Walk me through: $ARGUMENTS

## Determine the subject

Figure out what's being walked through. The subject could be anything:

- **Uncommitted changes / a diff** — run `git diff` (or `git diff --staged`) and chunk the changes
- **A set of files or a module** — read the files, chunk by logical boundary
- **A plan, design, or prompt file** — read it, chunk by section
- **A codebase topic** (e.g. "how does session management work") — explore with Read/Grep/Glob, then chunk your findings
- **Whatever the user described** — interpret $ARGUMENTS and start

**Do not enter plan mode. Do not pre-plan milestones. Just start.**

Quickly orient yourself (read files, check the diff, grep for context), then
begin delivering the first chunk. If the scope is ambiguous, state your
interpretation in one sentence and start — the user will redirect if needed.

## Chunking

Break the subject into **succinct, logical chunks**. Go sequentially —
front to back, top to bottom, or in whatever linear order makes sense
for the subject.

Each chunk should be small enough to absorb in one read. Err on the side
of too small — the user will say "continue" quickly if they want more.

## Per-chunk delivery

### Code-first rule (MANDATORY)

**Read actual source files before referencing them.** Present what's really
in the code — not what you assume or remember. If something has changed,
trust the code and say so.

### Format

- **Be succinct.** Explain what this chunk does, why, and how it fits.
- **Always include `file:line` references** so the user can jump to code.
- Show key types, interfaces, data flow with their locations.
- Illustrative snippets only — cite where to find the full code.
- Call out design decisions, trade-offs, or anything that smells off.

### Pause

After each chunk, **just stop.** Do not ask "Questions? Ready to continue?"
or any variation. Simply end your message after the chunk content.

The user drives the flow. They will say things like:
- "continue" / "next" / "keep going" → deliver the next chunk
- "note that as an action item and continue" → log it, move on
- "focus more on X" → go deeper on X before continuing
- "skip to Y" → jump ahead
- specific questions → answer, then wait again

## Action items

If the user notes corrections, issues, or action items during the
walkthrough, keep a running mental list. If they ask for a summary
at the end, present all accumulated action items.

## File output mode

Only if user explicitly asks to "write a prompt file" or "save for later":

Output to `.ai-reference/prompts/<timestamp>-walkthrough-<task-slug>.md`
