---
argument-hint: [topic, files, or impl-prompt-path to review]
description: Generate a walkthrough prompt and have an agent actively review it step-by-step
allowed-tools: Task, Read, Glob, Grep, Write
---

Automated walkthrough + active agent review for: $ARGUMENTS

## Phase 1: Generate the walkthrough prompt

You will generate the walkthrough prompt yourself. Do NOT delegate this
to a sub-agent — you have the tools to explore and write.

### 1a. Explore the topic

Use Read, Grep, and Glob to understand the codebase area:
- Find the relevant files and entry points
- Identify key types, interfaces, and data structures
- Trace data flow between components
- Note design decisions, edge cases, and trade-offs

### 1b. Write the walkthrough prompt

Write a structured walkthrough prompt to:
`.ai-reference/prompts/<YYYYMMDD>-walkthrough-<slug>.md`

(Create the `.ai-reference/prompts/` directory if it doesn't exist.)

The prompt must follow this structure:

```markdown
# Walkthrough: <topic>

## Task

You are a patient technical educator. Walk through <topic> step by step,
covering N milestones in order. After each milestone, stop and ask:
"Questions about this? Ready for the next milestone?" Wait for the user
to respond before continuing.

The goal is to ensure the user deeply understands the architecture,
data flow, and design decisions. You are not writing code — you are
reading existing code and explaining it, citing file:line references
so the user can jump to code in their editor.

## What to Explain Per Milestone

For each milestone, cover:
- Files involved (with absolute paths and line references)
- Key types, interfaces, and data structures
- Data flow between components
- Design decisions and trade-offs
- Edge cases and how they're handled

## Milestones

### Milestone 1: <title>
- Files: <paths with line ranges>
- Focus: <what to explain>
- Key types: <interfaces, classes, functions>

### Milestone 2: <title>
...

(Continue for all milestones)

## Key Design Points

- <technical details needing explanation>
- <data structures, algorithms, protocols>
- <naming conventions, constants, thresholds>

## Scope

- **IN scope**: <what this walkthrough covers>
- **OUT of scope**: <what's deferred>

## Collaboration Protocol

- **Walkthrough mode**: Explain conceptually, don't write implementation code
- **Pause after each milestone**: Ask "Questions? Ready to continue?"
- **Illustrative snippets only**: Short code to clarify patterns, always cite file:line
- **Call out ambiguities**: If something is unclear, discuss options
```

Populate every section with real data from your exploration — file paths,
line numbers, type names, architectural observations. The richer the
prompt, the better the walkthrough will be.

### 1c. Confirm the file

Read back the file you wrote to verify it looks correct. Note the
absolute path — you'll pass it to the reviewer.

## Phase 2: Launch the reviewer agent

Invoke the `walkthrough-reviewer` agent via the Skill tool, passing
the absolute file path from Phase 1:

```
Skill: walkthrough-reviewer <absolute-path-to-walkthrough-prompt.md>
```

The reviewer agent will:
1. Read the walkthrough prompt
2. Spawn a super-agent to deliver the walkthrough step by step
3. Engage with each milestone — reading files, verifying claims, giving feedback
4. Loop until the walkthrough is complete
5. Return a structured review summary

## Phase 3: Return results

Present the reviewer's summary to the user. Include:
- The walkthrough prompt file path (so they can reuse or edit it)
- The full review summary (milestones, corrections, insights, concerns, verdict)
