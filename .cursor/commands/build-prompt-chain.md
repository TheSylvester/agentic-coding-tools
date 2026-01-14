---
argument-hint: [path-to-prompt.md or "above"]
description: Transform an implementation prompt into a phased prompt chain with an orchestration file
---

Transform an implementation prompt into a phased execution chain: $ARGUMENTS

## Purpose

You are **not** implementing the task. You are generating a prompt chain (files on disk) that someone can execute step-by-step.

The output must be:

- An orchestration prompt: `.ai-reference/prompts/<task-name>-chain/00-orchestrate.md`
- Phase prompts: `.ai-reference/prompts/<task-name>-chain/01-*.md`, `02-*.md`, ...

Why chain? Complex tasks benefit from checkpoints: discovery before implementation, review before verification.

## Input Resolution

Resolve the source implementation prompt:

- If `$ARGUMENTS` is a **file path**: read that file.
- If `$ARGUMENTS` is `"above"` or empty: find the most recent **structured implementation prompt** in the conversation:
  - If a command just said "Saved to ..." → read that file
  - Else if a full prompt was pasted inline → use it

If you cannot find a clear source prompt, ask the user:
> "I don't see a structured implementation prompt. Please provide a file path or paste the prompt."

## Analysis Phase (before generating files)

Analyze the source prompt first:

### 1) Size Check

If the source prompt is small (single focused task, <50 lines of actionable content), respond:
> "This prompt is compact enough to run monolithically. Decomposition would add overhead without benefit."

Only proceed if decomposition adds value.

### 2) Ambiguity Resolution

Scan for optionality phrases: "Optionally...", "If time permits...", "Consider adding...", "You may want to..."

First, try to resolve from the prompt itself:

| Pattern in Source | Resolution |
|-------------------|------------|
| "Optionally (but recommended)" | Include — recommended means do it |
| "optional... off by default" / "behind a flag" | Skip — not core |
| "If X, then Y" | Check if X is true in context |
| Detailed spec follows the "optional" mention | Include — spec is detailed |
| Mentioned in Definition of Done | Include — it's a success criterion |

Only ask the user if genuinely unresolvable. Record decisions in `00-orchestrate.md` under "Scope Decisions".

### 3) Phase Detection

Identify natural breakpoints (typically 2–4 phases):

| Signal in Source | Suggests Phase |
|------------------|----------------|
| "Read/understand/map" language | Discovery |
| Multiple distinct file groups | Separate implementation phases |
| "Then wire up / integrate" | Integration |
| Tests / verification | Verification |

### 4) Extract Critical Details (must be preserved verbatim)

Before writing phases, extract and ensure these appear verbatim in the relevant phase file:

- Code snippets / skeletons
- Protocol specs (headers, formats, payload shapes)
- Exact commands (build/test)
- Exceptions/nuances ("keep this one", "don't do X here")

## Output Structure

Directory: `.ai-reference/prompts/<task-name>-chain/`

Derive `<task-name>` from the source prompt's main goal. Use kebab-case, keep it short.

Files:

- `00-orchestrate.md`
- `01-<phase-name>.md` (e.g., `01-discovery.md`)
- `02-<phase-name>.md`
- `03-<phase-name>.md` (optional)
- `04-<phase-name>.md` (optional)

## Orchestration Prompt (00-orchestrate.md)

Write `00-orchestrate.md` as a self-contained runbook that:

- Lists phases in a table: Phase / File / Goal / Done When
- Contains cross-cutting constraints from the source prompt
- Explains how to execute phases **in a single ongoing agent session** (so context persists)
- Instructs the executor to read the next phase file before running it, and to pause after each phase for review

If your workflow includes Claude Code’s `/super-agent`, you MAY include an optional subsection showing those exact invocations, but the orchestration must remain executable even without that tool (i.e., “paste the next phase into the same agent session”).
If you include that optional subsection, use plain ASCII quotes.

## Phase File Guidelines

Each phase file must have:

- `# Phase N: <Name>`
- `## Goal` (one clear goal)
- `## Scope` (what to touch / not touch)
- `## Technical Spec` (include verbatim details from the source)
- `## Exceptions & Nuances`
- `## Checkpoint` (what to output and that it must stop)

Discovery phases must end with “Do not implement yet.”
Use plain ASCII quotes (") in all generated files.

## After Generating

Create the directory and write all files. Then output:

- The absolute paths created
- A short “To Execute” section telling the user to paste `00-orchestrate.md` into their agent session and proceed phase-by-phase.
