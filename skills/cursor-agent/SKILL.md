---
name: cursor-agent
description: Wrapper around cursor-agent CLI for non-interactive runs (prompt via args/file/stdin) with resume support.
allowed-tools: Bash
---

# Cursor Agent (wrapper)

Thin wrapper around `cursor-agent` CLI:

- Provide prompt via arguments, `PROMPT_FILE`, or stdin
- Session resume via `--resume` or `CURSOR_SESSION` env var
- Pass-through flags: `--force`, `--approve-mcps`, `--browser`
- Returns session ID for conversation continuation

## Usage

```bash
# Arguments
.claude/skills/cursor-agent/scripts/cursor-agent Your prompt here

# File via env var
PROMPT_FILE=task.md .claude/skills/cursor-agent/scripts/cursor-agent

# Stdin
cat task.md | .claude/skills/cursor-agent/scripts/cursor-agent
```

### Session Resume

```bash
# Resume by session ID (returned from previous run)
.claude/skills/cursor-agent/scripts/cursor-agent --resume <session-id> "Follow-up question"

# Via environment variable
CURSOR_SESSION=<session-id> .claude/skills/cursor-agent/scripts/cursor-agent "Follow-up"
```

### Model Selection

```bash
# Via environment variable
CURSOR_AGENT_MODEL=gpt-5 .claude/skills/cursor-agent/scripts/cursor-agent "Your prompt"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PROMPT_FILE` | Read prompt from this file |
| `CURSOR_AGENT_MODEL` | Passed as `--model` |
| `CURSOR_SESSION` | Session ID to resume (fallback: `CHAT_ID`, `SESSION_ID`) |

## Output

Returns the response followed by the session ID:

```
<response text>

[session_id: <uuid>]
```

Capture the session ID to continue the conversation in subsequent calls.

## Notes

- Runs `cursor-agent --print --output-format json` in non-interactive mode
- Backwards compatible: `--fork`/`-f` and `CHAT_ID`/`SESSION_ID` still work
