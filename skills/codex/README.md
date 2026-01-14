# Codex Integration for Claude Code

## Purpose
Enable Claude Code to invoke the Codex CLI (`codex exec` and session resumes) for automated code analysis, refactoring, and editing workflows.

## Prerequisites
- `codex` CLI installed and available on `PATH`.
- Codex configured with valid credentials and settings.
- Confirm the installation by running `codex --version`; resolve any errors before using the skill.

### Important: Thinking Tokens
By default, this skill suppresses thinking tokens (stderr output) using `2>/dev/null` to avoid bloating Claude Code's context window. If you want to see the thinking tokens for debugging or insight into Codex's reasoning process, explicitly ask Claude to show them.

### Example Workflow

**User prompt:**
```
Use codex to analyze this repository and suggest improvements for my claude code skill.
```

**Claude Code response:**
Claude will activate the Codex skill and run the following command:
```bash
codex exec --dangerously-bypass-approvals-and-sandbox --model "gpt-5-codex" --config model_reasoning_effort="high" --dangerous-bypass-approvals-and-sandbox --skip-git-repo-check "Analyze this repository and suggest improvements for my claude code skill." 2>/dev/null
```

**Result:**
Claude will summarize the Codex analysis output, highlighting key suggestions and asking if you'd like to continue with follow-up actions.

### Detailed Instructions
See `SKILL.md` for complete operational instructions and workflow guidance.
