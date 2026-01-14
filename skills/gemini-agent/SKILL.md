---
name: gemini-agent
description: Wrapper around gemini CLI for non-interactive runs (prompt via args/file/stdin) with resume support.
allowed-tools: Bash
---

# Gemini Agent (wrapper)

Thin wrapper around `gemini` CLI:

- Provide prompt via arguments, `PROMPT_FILE`, or stdin
- Model selection via `--model` or `GEMINI_MODEL` env var
- Session resume via `--resume` or `GEMINI_SESSION` env var
- Auto-detects OAuth creds for non-interactive auth
- Returns session ID for conversation continuation

## Usage

```bash
# Arguments
.claude/skills/gemini-agent/scripts/gemini-agent Your prompt here

# File via env var
PROMPT_FILE=task.md .claude/skills/gemini-agent/scripts/gemini-agent

# Stdin
cat task.md | .claude/skills/gemini-agent/scripts/gemini-agent
```

### Session Resume

```bash
# Resume by session ID (returned from previous run)
.claude/skills/gemini-agent/scripts/gemini-agent --resume <session-id> "Follow-up question"

# Via environment variable
GEMINI_SESSION=<session-id> .claude/skills/gemini-agent/scripts/gemini-agent "Follow-up"
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
| `GEMINI_SESSION` | Session ID to resume |

## Output

Returns the response followed by the session ID:

```
<response text>

[session_id: <uuid>]
```

Capture the session ID to continue the conversation in subsequent calls.

## Notes

- Runs `gemini -y --output-format json` in non-interactive mode
- If no auth method set, defaults to `GOOGLE_GENAI_USE_GCA=true` when `~/.gemini/oauth_creds.json` exists
