---
argument-hint: [task-description]
description: Synthesize a self-contained implementation prompt for a fresh coding agent
---

Write a self-contained prompt that delegates this task to a coding agent with an empty context window: $ARGUMENTS

You are writing a prompt file, not executing the task. Include all relevant insights and specifications from our discussion.

Structure the prompt with these sections (use the exact headings):

1. Task

   - One paragraph describing exactly what the agent must do and why.

2. Context & Constraints

   - Concise bullets covering specifications, goals, success criteria, constraints, key assumptions, preferences, and decisions already made.

3. Inputs & Resources

   - Bulleted list of files, data, tools, systems, external links, access requirements, and any other relevant information the agent should use.

4. Execution Guidelines

   - Numbered steps reflecting the approach agreed in this conversation, including edge cases or special considerations.
   - Specify style, formatting, or code standards to follow.

5. Definition of Done
   - Clear bullets describing what a complete, high-quality result looks like.

Write directly to the agent (use "you"). Do not use the word "handoff" and do not mention any prior conversation. Encourage the use of sub-agents for isolated work, while the main agent remains responsible for overall quality and integration. Include domain knowledge, technical background, design rationale, and any insights that materially improve success.

Output:

- Save the prompt to a file `<project-root>/.ai-reference/prompts/<timestamp>-handoff-prompt-to-<task-description>.md`
- Use a filesystem-safe `<task-description>` (kebab-case, no slashes). Use an ISO-like timestamp (e.g., `2026-01-12T133700Z`).
