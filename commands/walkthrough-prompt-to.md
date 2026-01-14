---
argument-hint: [impl-prompt-path OR task-description]
description: Generate a design walkthrough prompt so you can review the architecture before approving execution
---

Generate a **walkthrough prompt** for: $ARGUMENTS

The walkthrough prompt should guide a fresh agent to explain the design and architecture — milestone by milestone — so I can understand and ask questions before any code is written.

This is for **design review before implementation**, not implementation itself.

## Output Structure

### 1. Task

- "Walk me through the design and architecture of [X]. This is a design review before implementation — explain each component conceptually, one milestone at a time, so I can understand the approach and ask questions before any code is written."
- Reference any implementation prompts or spec files

### 2. What I Want to Understand

For each milestone, the agent should explain:
- What files would be created/modified
- Key types, interfaces, and data structures
- How the code would be structured (pseudocode or illustrative snippets only)
- Data flow between components
- Design decisions and trade-offs
- Edge cases and how they'd be handled

### 3. Milestones to Walk Through

- Numbered list of implementation milestones
- Key details for each (file paths, APIs, data structures)
- Line number references to legacy/reference code where available

### 4. Key Design Points to Clarify

- Technical details that need explanation
- Data structures, algorithms, protocols
- Constants, thresholds, naming conventions

### 5. Scope Boundaries

- **IN scope** — what will be implemented
- **OUT of scope** — what's deferred

### 6. Collaboration Protocol

- **Walkthrough mode**: Explain conceptually, don't write implementation code
- **Pause after each milestone**: Ask "Any questions? Ready to continue?"
- **Illustrative snippets only**: Short code to clarify patterns, not full implementations
- **Call out ambiguities**: If the spec is unclear, discuss options before deciding

### 7. Definition of Done

Checkboxes for understanding, not code delivery:
- [ ] I understand the file structure and module responsibilities
- [ ] I understand [key concepts from the task]
- [ ] I understand what's in scope vs deferred
- [ ] All my questions have been answered
- [ ] Ready to approve implementation (or request changes)

---

Frame the walkthrough agent as a **design reviewer and explainer**. Include all relevant domain knowledge, technical background, and design rationale.

Output: `.ai-reference/prompts/<timestamp>-walkthrough-<task-slug>.md`
