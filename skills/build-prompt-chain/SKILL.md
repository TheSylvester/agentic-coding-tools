---
name: build-prompt-chain
description: Build a phased prompt chain with orchestration file from a monolithic implementation prompt
argument-hint: [path-to-prompt.md or "above"]
---

Transform an implementation prompt into a phased execution chain: $ARGUMENTS

## Purpose

This skill transforms monolithic implementation prompts (typically from `/handoff-prompt-to`) into a sequence of phases designed for **sustained-context execution via `/super-agent`**.

The output is:
- An **orchestration prompt** (`00-orchestrate.md`) that a fresh Claude instance follows
- **Phase files** (`01-*.md`, `02-*.md`, etc.) that the orchestrator feeds to a `/super-agent` worker session

**Why chain?** Complex tasks benefit from checkpoints. Discovery before implementation. Review before verification. The orchestrator uses `/super-agent` session-resume to maintain full context across phases while giving you control between each checkpoint.

## Input Resolution

- **File path provided**: Read the prompt from that file
- **"above" or empty**: Look for the most recent implementation prompt in this conversation:
  1. If `/handoff-prompt-to` just ran and announced "Saved to [path]" → read that file
  2. If a prompt was displayed inline → use that content
  3. If a file path was mentioned → read that file

If no recognizable prompt is found, ask: "I don't see a structured implementation prompt in this conversation. Please provide a file path or run `/handoff-prompt-to` first."

---

## Analysis Phase

Before generating, analyze the source prompt:

### 1. Size Check
If the source prompt is small (single focused task, <50 lines of actionable content), respond:
> "This prompt is compact enough to run monolithically. Decomposition would add overhead without benefit."

Only proceed if decomposition adds value.

### 2. Ambiguity Resolution

Scan for phrases that introduce optionality:
- "Optionally...", "If time permits...", "Consider adding...", "You may want to..."

**First**: Check if the source prompt itself resolves the ambiguity:

| Pattern in Source | Resolution |
|-------------------|------------|
| "Optionally (but recommended)" | **Include** — recommended means do it |
| "optional... off by default" or "behind a flag" | **Skip** — low priority, not core |
| "If X, then Y" | Check if X is true in context |
| "Consider adding... for [benefit]" | Include if benefit aligns with stated goals |
| Detailed spec follows the "optional" mention | **Include** — effort was spent specifying it |
| Mentioned in Definition of Done | **Include** — it's a success criterion |

**Only ask the user** if genuinely unresolvable after checking the source. Most well-written prompts contain their own answers.

Document any scope decisions (resolved or asked) in the orchestration file's "Scope Decisions" section.

### 3. Phase Detection
Identify natural breakpoints in the work:

| Signal in Source | Suggests Phase |
|------------------|----------------|
| "Read/understand/map" language | Discovery phase |
| Multiple distinct file groups | Separate implementation phases |
| "Then wire up / connect / integrate" | Integration phase |
| Test commands, verification steps | Verification phase |
| Migration + cleanup | Two-phase implementation |
| Sub-agent spawning instructions | Integrate into relevant phase |

Determine the right number and type of phases (typically 2-4). Don't force a fixed structure.

### 4. Coverage Balance Check

Compare detail levels across sections. If one area (e.g., backend) has 3x more detail than another (e.g., frontend), flag it:
> "Note: Backend has detailed specs; frontend section is sparse. The generated phases will reflect this imbalance."

### 5. Extract Critical Details

Before writing phases, extract and set aside:
- **Code snippets/skeletons** — preserve exactly, don't paraphrase
- **Protocol specs** — headers, formats, event structures
- **Exact commands** — test commands, build commands
- **Exceptions/nuances** — "keep this one", "don't do X here", edge cases

These MUST appear verbatim in the relevant phase, not summarized.

---

## Output Structure

Directory: `.ai-reference/prompts/<task-name>-chain/`

Derive `<task-name>` from the source prompt's title or main goal (e.g., "add-auth-flow", "refactor-parser"). Use kebab-case, keep it short.

```
00-orchestrate.md       # THE prompt to paste into fresh agent
01-<phase-name>.md      # First phase (e.g., 01-discovery.md)
02-<phase-name>.md      # Second phase (e.g., 02-implement-backend.md)
...
```

Phase names should be descriptive: `01-discovery`, `02-implement-api`, `03-wire-frontend`, `04-verify`.

---

## Orchestration Prompt Format (00-orchestrate.md)

The orchestration file is a **prompt for an orchestrator** — paste it into a fresh Claude window. That Claude instance will use `/super-agent` to spawn a worker session and drive it through each phase, maintaining context across the entire chain.

**Execution model**:
```
Fresh Claude (orchestrator)
    ↓ reads 00-orchestrate.md
    ↓ reads 01-discovery.md (to understand it)
    ↓ runs: /super-agent "Execute <path>/01-discovery.md"
    ↓ captures session-id
    ↓ worker reads file, executes, returns results
    ↓ orchestrator reviews results
    ↓ reads 02-backend.md, optionally edits based on Phase 1 findings
    ↓ runs: /super-agent --resume <session-id> "Execute <path>/02-backend.md"
    ↓ worker continues with full context
    ↓ ... repeat, reviewing and adjusting files between phases
```

```markdown
# [Task Name] — Phased Implementation

You are the **orchestrator**. Use `/super-agent` to execute this implementation as a sequence of phases, maintaining a single worker session across all phases.

## Overview
[One sentence: what we're building and why]

## Scope Decisions
[If any ambiguous items were resolved, document the decisions here]

## Phase Sequence

| Phase | File | Goal | Done When |
|-------|------|------|-----------|
| 1 | `01-discovery.md` | Map code, create plan | Plan output |
| 2 | `02-implement.md` | Execute the plan | Files changed |
| 3 | `03-verify.md` | Prove correctness | Tests pass |

All phase files are in: `.ai-reference/prompts/<task-name>-chain/`

## Key Constraints
[Critical constraints that apply across all phases — preserve from source]

## Execution Instructions

### Phase 1: Start the Chain

1. Read `01-discovery.md` to understand what it asks
2. Run `/super-agent` with the file path:

```
/super-agent "Execute .ai-reference/prompts/<task-name>-chain/01-discovery.md"
```

3. **Save the session-id** from the response

### Subsequent Phases

When a phase completes:

1. **Review** the super-agent's output
2. **Read** the next phase file (e.g., `02-backend.md`)
3. **Edit the file** if needed based on prior phase results
4. **Resume** with the file path:

```
/super-agent --resume <session-id> "Execute .ai-reference/prompts/<task-name>-chain/02-backend.md"
```

The worker retains full context — it knows what happened in prior phases.

### If a Phase Fails

Resume the same session to fix:
```
/super-agent --resume <session-id> "The previous phase had issues: [describe]. Fix them and re-verify."
```

Do NOT start a new session — context is critical for correct fixes.

## Begin

Read `01-discovery.md`, then run `/super-agent` with its path.
```

The orchestration prompt is **self-contained** — the orchestrator Claude knows:
- How to spawn and resume the worker session
- What files to pass for each phase
- When to pause for review
- How to recover from failures while preserving context

---

## Phase Design Principles

### 1. Sustained Context
Each phase assumes the agent remembers everything from prior phases.
- Do NOT repeat file contents or patterns already loaded
- Reference prior work: "Using the plan from Phase 1..."
- Keep phases lean - they're continuations, not fresh starts

### 2. Checkpoints
Every phase except the last ends with:
```markdown
## Checkpoint
[What to output/confirm before proceeding]
Do not continue to the next phase. Wait for the next prompt.
```

### 3. Clear Scope
Each phase has ONE clear goal. If you're combining "understand + implement + test" in one phase, it's too big.

### 4. Observable Completion
Each phase must produce observable output so the orchestrator knows it's done:
- Discovery → outputs a plan
- Implementation → outputs file changes summary
- Verification → outputs test results

### 5. Preserve Technical Fidelity
**Critical**: Do not summarize away technical details. If the source has:
- Protocol specs (headers, formats) → include verbatim in relevant phase
- Code skeletons → include verbatim, not paraphrased
- Exact error handling patterns → preserve exactly
- Exceptions ("keep this refresh call") → call out explicitly

---

## Phase Content Guidelines

### Discovery Phase (when needed)
```markdown
# Phase 1: Discovery

## Goal
[Understand X / Map Y / Create plan for Z]

## Read These Files
[List - be specific]

## Sub-Agent Tasks (if applicable)
[Spawn Explore agents for specific discovery tasks - be explicit about what to spawn]

## Output Required
[Plan format / Analysis format / etc.]

## Checkpoint
Output your [plan/analysis]. Do not implement yet. Wait for the next prompt.
```

### Implementation Phase(s)
```markdown
# Phase N: [Specific Implementation Goal]

## Goal
[What to build/change - reference prior phases]

## Scope
[Specific files/components - NOT everything]

## Technical Spec
[Include any protocol details, code skeletons, exact formats from source - VERBATIM]

## Exceptions & Nuances
[Call out any "keep this", "don't change that", edge cases]

## Guidelines
[Patterns, constraints relevant to THIS phase]

## Checkpoint
Summarize changes made. Do not proceed to [next thing]. Wait for the next prompt.
```

### Verification Phase (when needed)
```markdown
# Phase N: Verification

## Goal
Prove the implementation is correct.

## Steps
1. [Build/compile command - exact]
2. [Test command - exact]
3. [Behavioral verification - specific scenario]

## Sub-Agent Tasks
[If source specifies browser-qa or other verification agents, include explicit spawn instructions]

Example:
Spawn a `browser-qa` agent with this prompt:
> Navigate to http://localhost:8765. Verify [specific behavior]. Capture screenshot.

## Success Criteria
[What "done" looks like]

## If Issues Found
Fix and re-verify. Document what you fixed.
```

---

## Transformation Heuristics

### What goes where:

| Source Content | Target |
|----------------|--------|
| Task description, context, "why" | Orchestrate overview + Phase 1 |
| Files to read/reference | Phase 1 (Discovery) |
| Files to create/modify | Implementation phase(s) |
| Execution steps 1-N | Split across implementation phases by natural grouping |
| **Code snippets/skeletons** | **Relevant implementation phase — VERBATIM** |
| **Protocol specs** | **Relevant implementation phase — VERBATIM** |
| Edge cases / exceptions | Relevant implementation phase (explicit section) |
| Sub-agent strategy | Integrate as spawn instructions in relevant phases |
| Test commands, verification | Final phase |
| Definition of done | Runbook "Done When" + final phase |

### Splitting implementation:
- By component (backend → frontend)
- By operation (create → wire up → configure)
- By risk (core logic → integration → polish)

Choose the split that minimizes cross-phase dependencies.

### Handling Sub-Agent Instructions

If the source prompt has a "Sub-Agent Strategy" or similar section:
1. **Don't** put it in a separate advisory section
2. **Do** integrate spawn instructions directly into the phases where they apply
3. Use explicit Task tool syntax:

```markdown
## Sub-Agent Tasks

Spawn these agents in parallel:

1. **Explore agent**: "Find all calls to refresh() and map the call graph"
2. **Explore agent**: "Identify threading patterns (locks, events, conditions)"

Wait for results before proceeding.
```

---

## Requirements

1. **Lean phases**: Each phase ≤40% of original prompt length
2. **No redundancy**: Trust sustained context - reference, don't repeat
3. **Executable runbook**: Someone unfamiliar can follow it
4. **Observable checkpoints**: Each phase produces confirmable output
5. **Technical fidelity**: Code snippets, specs, commands preserved verbatim
6. **Explicit scope**: Ambiguities resolved before generation
7. **Integrated sub-agents**: Spawn instructions woven into phases, not advisory

---

## After Generating: Provide Next Steps

After writing all chain files, output:

```
Created prompt chain in `.ai-reference/prompts/<task-name>-chain/`:

  00-orchestrate.md  ← Paste into a fresh Claude window to start
  01-discovery.md
  02-implement.md
  03-verify.md

## To Execute

Paste `00-orchestrate.md` into a fresh Claude Code window. It will:
1. Use /super-agent to spawn a worker session
2. Pass each phase file to the worker in sequence
3. Maintain context across all phases via session-id resume

The orchestrator controls pacing — review results between phases.

Scope decisions made:
- [any ambiguity resolutions]

Technical specs preserved:
- [list of verbatim sections carried forward]
```

Keep it simple. The orchestration file IS the deliverable — it contains the `/super-agent` invocations needed to execute the chain.
