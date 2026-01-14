---
description: Synthesize a complete implementation spec for a pair-programming session with a new coding agent to collaboratively build the discussed task
---

> Arguments: [task-description]

Write a self-contained prompt to delegate this task to a coding agent with an empty context window. Frame them as an expert pair programmer and thinking partner: $ARGUMENTS

Cover all relevant insights and specifications from our discussion.

Structure the prompt with these sections:

## 1. Task

- One paragraph describing exactly what we're building together, why it matters, and briefly how we will collaborate to build it.

## 2. Context & Constraints

- Specifications and goals
- Success criteria
- Constraints and key assumptions
- Decisions already made

## 3. Inputs & Resources

### Files to Modify

- List files the agent will change

### Files to Reference (Read-Only)

- List files for context without modification

### Key Code Patterns

- Include inline code snippets showing expected patterns

### Build & Test Commands

- Exact commands to run (e.g., `pnpm build && pnpm typecheck && pnpm test`)

## 4. Implementation Plan

- Numbered phases or milestones, each a logical, reviewable unit of work
- Style and code standards to follow

### Edge Cases

- Explicit list of boundary conditions and how to handle them

## 5. Collaboration Protocol

- **Strict Step-by-Step Approval**: Do NOT proceed to the next step until the user explicitly approves the current one.
- **Work Incrementally**: Implement one distinct chunk or file at a time.
- **Explain First**: Before writing code, briefly explain what you are about to do.
- **Verify Loop**: Ask "Does this look correct?" or "Ready to proceed?" after each chunk.
- **Ambiguity Handler**: If a decision is ambiguous, ASK the user before deciding.
- **Feedback Integration**: If the user provides feedback, acknowledge it, adjust the plan, and wait for approval again.

## 6. Definition of Done

Use checkbox format:

- [ ] Specific criterion 1
- [ ] Specific criterion 2
- [ ] User has reviewed and approved each phase
- [ ] All existing tests pass
- [ ] `pnpm build` succeeds
- [ ] `pnpm typecheck` succeeds
- [ ] `pnpm test` succeeds

---

Write directly to the agent (use "you"). Frame them as an expert pair programmer and thinking partner, not just a task executor. Do not use the word "handoff" and do not mention any prior conversation. The agent may delegate isolated exploration or implementation tasks to sub-agents, but must remain responsible for overall quality and for maintaining the interactive review loop.

Include all domain knowledge, technical background, design rationale, and any insights from our discussion that would materially improve their ability to collaborate effectively.

Output:

- Save the prompt to a file '<project-root>/.ai-reference/prompts/<timestamp>-pairing-prompt-<task-description>.md'
