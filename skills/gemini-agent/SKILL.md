---
name: gemini-agent
description: Wrapper around gemini CLI for non-interactive runs (prompt via args/file/stdin).
allowed-tools: Bash
---

# Gemini Agent (wrapper)

Thin wrapper around `gemini` CLI:

- Provide prompt via arguments, `PROMPT_FILE`, or stdin
- Model selection via `--model` or `GEMINI_MODEL` env var
- Auto-detects OAuth creds for non-interactive auth

## Usage

```bash
# Arguments
.claude/skills/gemini-agent/scripts/gemini-agent Your prompt here

# File via env var
PROMPT_FILE=task.md .claude/skills/gemini-agent/scripts/gemini-agent

# Stdin
cat task.md | .claude/skills/gemini-agent/scripts/gemini-agent
```

### Model Selection

```bash
# Via flag
.claude/skills/gemini-agent/scripts/gemini-agent --model gemini-2.0-flash-exp "Your prompt"

# Via environment variable
GEMINI_MODEL=gemini-2.0-flash-exp .claude/skills/gemini-agent/scripts/gemini-agent "Your prompt"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PROMPT_FILE` | Read prompt from this file |
| `GEMINI_MODEL` | Passed as `--model` to gemini |

## Notes

- Runs `gemini -y --prompt <prompt>` in non-interactive mode
- If no auth method set, defaults to `GOOGLE_GENAI_USE_GCA=true` when `~/.gemini/oauth_creds.json` exists
