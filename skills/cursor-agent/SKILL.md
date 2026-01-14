---
name: cursor-agent
description: Wrapper around cursor-agent CLI for non-interactive runs (prompt via args/file/stdin) with resume support.
allowed-tools: Bash
---

# Cursor Agent (wrapper)

Thin wrapper around `cursor-agent` CLI:

- Provide prompt via arguments, `PROMPT_FILE`, or stdin
- Resume existing chats via `--fork` / `-f`
- Pass-through flags: `--force`, `--approve-mcps`, `--browser`

## Usage

```bash
# Arguments
.claude/skills/cursor-agent/scripts/cursor-agent Your prompt here

# File via env var
PROMPT_FILE=task.md .claude/skills/cursor-agent/scripts/cursor-agent

# Stdin
cat task.md | .claude/skills/cursor-agent/scripts/cursor-agent
```

### Resume Mode

```bash
# Resume an existing chat
CHAT_ID="your-chat-id" .claude/skills/cursor-agent/scripts/cursor-agent --fork "Continue the work"

# SESSION_ID also works
SESSION_ID="your-chat-id" .claude/skills/cursor-agent/scripts/cursor-agent -f "Continue"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PROMPT_FILE` | Read prompt from this file |
| `CURSOR_AGENT_MODEL` | Passed as `--model` |
| `CHAT_ID` | Chat id for `--fork` (fallback: `SESSION_ID`) |
