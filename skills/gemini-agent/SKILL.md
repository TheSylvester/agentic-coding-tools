---
name: gemini-agent
description: Wrapper around gemini CLI for non-interactive runs (prompt via args/file/stdin) with resume support. Outputs session_id for conversation continuation.
allowed-tools: Bash
---

# Gemini Agent (wrapper)

Thin wrapper around `gemini` CLI for non-interactive use:

- Provide prompt via arguments, `PROMPT_FILE`, or stdin
- Model selection via `--model` or `GEMINI_MODEL` env var
- Session resume via `--resume` or `GEMINI_SESSION` env var
- Auto-detects OAuth creds (`~/.gemini/oauth_creds.json`) for authentication
- Clear error messages when auth is missing

## Prerequisites

**Gemini CLI v0.20.0+** required (for `--resume` support):
```bash
npm install -g @google/gemini-cli@latest
gemini --version  # should be 0.20.0 or higher
```

**Authentication** (one of these):
1. Run `gemini` interactively once to complete OAuth login (creates `~/.gemini/oauth_creds.json`)
2. Set `GEMINI_API_KEY` environment variable
3. Set `GOOGLE_GENAI_USE_GCA=true` with existing OAuth creds

## Usage

```bash
# Arguments
~/.claude/skills/gemini-agent/scripts/gemini-agent Your prompt here

# File via env var
PROMPT_FILE=task.md ~/.claude/skills/gemini-agent/scripts/gemini-agent

# Stdin
cat task.md | ~/.claude/skills/gemini-agent/scripts/gemini-agent
```

### Session Resume

```bash
# Resume most recent session
~/.claude/skills/gemini-agent/scripts/gemini-agent --resume latest "Follow-up question"

# Resume by UUID (returned from previous run)
~/.claude/skills/gemini-agent/scripts/gemini-agent --resume c9283e30-910e-442c-b567-48ac9e1fab03 "Continue"

# Resume by index (use `gemini --list-sessions` to see available)
~/.claude/skills/gemini-agent/scripts/gemini-agent --resume 3 "Continue from session 3"

# Via environment variable
GEMINI_SESSION=c9283e30-910e-442c-b567-48ac9e1fab03 ~/.claude/skills/gemini-agent/scripts/gemini-agent "Follow-up"
```

### Model Selection

```bash
# Via flag
~/.claude/skills/gemini-agent/scripts/gemini-agent --model gemini-2.0-flash "Your prompt"

# Via environment variable
GEMINI_MODEL=gemini-2.0-flash ~/.claude/skills/gemini-agent/scripts/gemini-agent "Your prompt"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PROMPT_FILE` | Read prompt from this file |
| `GEMINI_MODEL` | Model to use (passed as `--model`) |
| `GEMINI_SESSION` | Session to resume (`latest`, UUID, or index number) |
| `GEMINI_API_KEY` | API key authentication |
| `GOOGLE_GENAI_USE_GCA` | Set to `true` for Gemini Code Assist auth |

## Output

Returns plain text response followed by the session ID:

```
<response text>

[session_id: <uuid>]
```

Capture the session ID to continue the conversation with `--resume <uuid>`.

## Troubleshooting

**Diagnostics are shown automatically on any failure.** You can also run:
```bash
~/.claude/skills/gemini-agent/scripts/gemini-agent --version
```

Common issues:

1. **No auth configured**: Run `gemini` interactively once to set up OAuth, or set `GEMINI_API_KEY`
2. **gemini not found**: Install with `npm install -g @google/gemini-cli`
3. **--resume not working**: Requires gemini CLI v0.20.0+ (`gemini --version` to check)
4. **Connection errors**: Check network connectivity and auth token expiry

## Notes

- Runs `gemini -y -o json -p <prompt>` in non-interactive YOLO mode with JSON output to capture session_id
- Sessions are project-specific (tied to working directory)
- UUID-based resume requires full UUIDs (e.g., `c9283e30-910e-442c-b567-48ac9e1fab03`), not partial UUIDs
- Use `gemini --list-sessions` to see available sessions for current project
- Stderr is preserved to show auth/connection errors (not suppressed)

### Session File Locations

For reference, session files are stored at:
- Path: `~/.gemini/tmp/{project_hash}/chats/session-*.json`
- `{project_hash}` is the SHA256 hash of the working directory path
- Use `gemini --list-sessions` to list available sessions without needing to navigate the file structure
