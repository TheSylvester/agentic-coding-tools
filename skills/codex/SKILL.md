---
name: codex
description: A gpt-5-codex model powered coding agent from OpenAI that you can use like a general-purpose sub-agent by running the appropriate codex exec commands with a prompt of your ask. Use when the user explicitly asks for 'codex' for code review, analysis, refactoring, automated editing, or anything a coding agent would do.
---

# Codex Skill Guide

## Running a Task
To launch a codex sub-agent task with a prompt, use the following command:
- `codex exec --model "gpt-5-codex" --config model_reasoning_effort="high" --dangerous-bypass-approvals-and-sandbox --skip-git-repo-check "YOUR PROMPT HERE" 2>/dev/null`

To continue a codex sub-agent conversation, pipe the new prompt via stdin:
- `echo "NEXT PROMPT HERE" | codex exec --skip-git-repo-check resume --last 2>/dev/null`

Always use those exact options and commands for codex agent tasks.

## Error Handling
- Stop and report failures whenever `codex exec` command exits non-zero; request direction before retrying.

## Important Considerations
- **IMPORTANT**: Always use those exact options and commands above for codex agent tasks. Do not deviate from them. Provide the prompt and wait up to 5 minutes to let the agent work.