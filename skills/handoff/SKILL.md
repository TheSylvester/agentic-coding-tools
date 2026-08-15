---
name: handoff
description: Synthesize self-contained implementation prompt(s) that hand a task to a fresh coding agent with an empty context window, decomposing into a phased chain or parallel set when the task is too large for one. Use when the user says "write a handoff prompt", "generate a prompt", "distill this for a fresh agent", or asks to compose a handoff.
license: MIT
---

# Handoff

Write self-contained prompt(s) to delegate this task to a coding agent with an empty context window.

Cover all relevant insights and specifications from the discussion.

## 1. Scope Analysis

Before generating, analyze what benefits from shared context:

1. **Identify coupling** — tightly coupled code (same files, shared patterns, mutual dependencies)? Challenge phase boundaries — are they correctly scoped?
2. **Find natural boundaries** — where can work separate cleanly?
3. **Check context fit** — will grouped work fit in one context window (~20 files max)?

**Decision:**

| Signal                                            | Format          |
| ------------------------------------------------- | --------------- |
| Single focused task, <=3 files, one clear goal    | Single prompt   |
| Multiple distinct file groups or components       | Chain           |
| Discovery + implementation + verification pattern | Chain           |
| Multiple sequential dependencies                  | Chain           |
| Independent work units, no sequencing needed      | Parallel        |

If decomposing, announce: "Task splits into [N] units. Generating [N] prompt files."

## 2. Pre-Generation

**Ambiguity resolution** — scan for optionality before generating:

| Pattern                                      | Resolution                              |
| -------------------------------------------- | --------------------------------------- |
| "Optionally (but recommended)"               | **Include** — recommended means do it   |
| "optional... off by default"                 | **Skip** — low priority                 |
| "If X, then Y"                               | Check if X is true in context           |
| Detailed spec follows the "optional" mention  | **Include** — effort was spent on it    |
| Mentioned in Definition of Done              | **Include** — success criterion         |

Only ask the user if genuinely unresolvable.

**Extract for verbatim preservation:** code snippets, protocol specs, exact commands, file paths (absolute), exceptions and nuances. These appear verbatim, never summarized.

**Coverage balance** — if one area has significantly more detail than another, flag it before generating.

---

## Prompt Structure (Every Generated Prompt)

Phase files may be leaner (reference prior phases, don't repeat).

````markdown
<!-- EXECUTION DIRECTIVE: This is a pre-validated implementation prompt. Execute immediately without entering plan mode. -->

## 1. Task
One paragraph: what the agent must do and why.

## 2. Context & Constraints
- Specifications, goals, success criteria
- Constraints, key assumptions, decisions already made

### Prerequisites (chain only)
- [ ] Phase [X] completed (if applicable)

### Shared Interfaces (multi-prompt only, CRITICAL)
[Exact interface definitions — copy, don't summarize]

## 3. Inputs & Resources

### Files to Create/Modify
- Absolute paths

### Files to Reference (Read-Only)
- Absolute paths

### Key Code Patterns
- Inline code snippets (VERBATIM)

### Build & Test Commands
- Exact commands

## 4. Execution Guidelines
- Numbered implementation steps
- Style and code standards

### Edge Cases
- Boundary conditions and handling

## 5. Assumptions
| Assumption | Reasoning |
|------------|-----------|

## 6. Verification Plan

Launch verification sub-agents in parallel:

1. **Test Sub-Agent**: Run `[test command]`. All tests must pass.
2. **Behavioral Sub-Agent**: Prove it works end-to-end.
3. **Code Quality Sub-Agent**: Review for complexity, duplication, security.

If any fails, fix and re-run. Retry up to 3 times.

## 7. Definition of Done
- [ ] Implementation matches spec
- [ ] All verification steps passed
- [ ] Assumptions documented (if any)
- [ ] No debug code or comments left behind
````

Use sub-agents liberally for parallel work within each prompt.

---

## Where generated prompts go

Prompts are written under `.ai-reference/` in the project root — a scratch
directory for agent-facing documents that are not part of the shipped codebase.
Create it if it does not exist. Suggest adding it to `.gitignore` unless the
user wants these prompts committed. If the project already has an established
location for this kind of document, use that instead.

## Single Prompt Output

Save to: `.ai-reference/prompts/YYYYMMDD-HHMMSS-<task-description>.md`
(`<task-description>` = a short imperative kebab of the work itself, e.g. `add-oauth-login` — not the artifact type.)

No title header — start with the execution directive (per Requirement 8).

---

## Multi-Prompt Output (Chain or Parallel)

Directory: `.ai-reference/prompts/<task-name>/`

```
00-<task-name>.md       # Orchestrator — named after the task
01-<phase-name>.md
02-<phase-name>.md
...
```

### Orchestrator (00-<task-name>.md)

The orchestrator is an **executable prompt** — it IS the project manager. When
handed to a fresh agent, it autonomously runs each phase, verifies
completeness, synthesizes inter-phase context, and adapts.

**Before writing the orchestrator, resolve the runner command and inline it
literally.** The orchestrator is executed later by a different agent in a
different environment, so it cannot rely on a variable being set for it:

- If the `claude-agent` skill is installed, the runner is
  `node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs"`. Check that
  the file exists and write the **absolute** resolved path into the generated
  file — do not leave a `~`.
- If it is not installed, fall back to `claude -p --permission-mode bypassPermissions`
  and say so in the orchestrator. Both read the phase prompt from stdin.

````markdown
<!-- EXECUTION DIRECTIVE: This is a pre-validated orchestration prompt. Execute immediately without entering plan mode. You are the project manager for a phased implementation. -->

# [Imperative name of the work itself — e.g. "Add OAuth Login", "Migrate Sessions to Postgres". NEVER name the document type or pipeline stage: not "Handoff Prompt", "Implementation Orchestrator", "Phased Implementation", or "Discovery Phase".]

You are the orchestrator for a [N]-phase implementation. Execute each phase sequentially, verify between phases, synthesize findings, and adapt.

## What You're Building
[One paragraph: what and why]

## Phases

| Phase | File              | Goal                  | Done When        |
| ----- | ----------------- | --------------------- | ---------------- |
| 1     | `01-phase.md`     | [Goal]                | [Criteria]       |
| 2     | `02-phase.md`     | [Goal]                | [Criteria]       |

## Global Constraints
[Constraints from source]

## Execution Protocol

The phase runner is `[RESOLVED ABSOLUTE COMMAND]`. For each phase:

### Step 1: Run the phase
```bash
PROMPT_FILE=.ai-reference/prompts/<task-name>/{phase-file} [RUNNER]
```

If NOT the first phase, prepend inter-phase context via stdin
(`cat <inter-phase-context-file> <phase-file> | [RUNNER]` — stdin is byte-exact; use it instead of `PROMPT_FILE` when prepending context).

### Step 2: Verify and synthesize
Launch a verification sub-agent to inspect code on disk:
1. Check "Done When" criteria
2. Identify deviations
3. Synthesize context for next phase (what changed, test results, anything next phase needs)

### Step 3: Gate decision
- **Pass** → proceed with synthesized context
- **Minor issues** → fix directly, re-verify, proceed
- **Major issues** → re-run phase with corrective preamble (max 2 retries)

### Step 4: Repeat for next phase.

## Final Report
After all phases: files modified, key metrics, deviations, remaining debt.
````

**For parallel prompts:** replace the execution protocol with parallel runner launches (in the background) and a post-completion integration check.

### Phase Detection (chain only)

| Signal in Plan                    | Suggests Phase                 |
| --------------------------------- | ------------------------------ |
| "Read/understand/map" language    | Discovery                      |
| Multiple distinct file groups     | Separate implementation phases |
| "Wire up / connect / integrate"   | Integration                    |
| Test commands, verification steps | Verification                   |

2-4 phases. Don't force a fixed structure.

### Delegation Analysis (chain only)

After generating phase files, analyze each for sub-agent parallelization. Spawn parallel sub-agents — one per phase — reading actual source files to map dependencies. Each identifies:

1. Independent tasks that could run as parallel sub-agents
2. Blocking dependencies and critical path
3. Sub-agent team suggestions

Integrate into each phase's Execution Guidelines as spawn instructions. Phases with no parallelization opportunities get none — don't force it.

### Interface Contracts (multi-prompt)

When prompts produce/consume shared interfaces:
- Define exact interfaces before generating
- Include identical definitions in ALL prompts that produce or consume them
- Add to Definition of Done: "Shared interfaces implemented exactly as defined"

---

## Requirements

1. **Self-contained**: Every prompt includes ALL context a fresh agent needs. Chain phases have execution-level dependencies (code on disk), but document-level independence.
2. **Interface consistency**: Shared interfaces IDENTICAL across all prompts. Copy-paste, don't summarize.
3. **Technical fidelity**: Code snippets, specs, commands preserved verbatim.
4. **Explicit file boundaries**: "Files to Modify" and "Files to Reference (Read-Only)" per prompt.
5. **Verification built-in**: Every prompt includes verification sub-agents.
6. **Execution directives**: Every prompt begins with the directive.
7. **Lean phases** (chain): Each phase <= 40% of original plan length. Reference, don't repeat.
8. **Titles name the work, not the artifact**: The only heading any generated file may carry is the orchestrator's H1, and it must be a short imperative naming the actual task (e.g. `# Add OAuth Login`) — NEVER the document genre or pipeline stage (`Handoff Prompt`, `Orchestration Prompt`, `Discovery Phase`). Single prompts and phase files carry NO title header; they start with the execution directive.

Write directly to the new agent (use "you"). Do not mention the originating conversation. Include all domain knowledge, technical background, and design rationale.
