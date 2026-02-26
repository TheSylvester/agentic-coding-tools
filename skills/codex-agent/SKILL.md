---
name: codex-agent
description: Wrapper around codex CLI for non-interactive runs (prompt via args/file/stdin) with resume support. Outputs session_id for conversation continuation.
allowed-tools: Bash
---

# Codex Agent (wrapper)

## IMPORTANT: Execution Instructions

**This script runs synchronously and returns output directly. Do NOT run it in the background.**

When invoking via Bash, you MUST:
1. Use `timeout: 600000` (10 minutes) — codex runs can take several minutes
2. Run it as a **foreground** command (do NOT use `run_in_background`)
3. Read the output directly from the Bash result — no need to poll or check later

Example Bash invocation:
```
Bash(command: "~/.claude/skills/codex-agent/scripts/codex-agent Your prompt here", timeout: 600000)
```

---

Thin wrapper around `codex` CLI (OpenAI Codex) for non-interactive use:

- Provide prompt via arguments, `PROMPT_FILE`, or stdin
- Model selection via `--model` or `CODEX_MODEL` env var
- Session resume via `--resume` or `CODEX_SESSION` env var
- Auto-detects OAuth login (`~/.codex/auth.json`) or API keys
- Clear error messages with diagnostics on failure

## Prerequisites

**Codex CLI v0.80.0+** required:
```bash
npm install -g @openai/codex@latest
codex --version  # should be 0.80.0 or higher
```

**Authentication** (one of these):
1. Run `codex login` for ChatGPT OAuth (creates `~/.codex/auth.json`)
2. Set `OPENAI_API_KEY` environment variable
3. Set `CODEX_API_KEY` environment variable (exec mode only)

## Usage

```bash
# Arguments
~/.claude/skills/codex-agent/scripts/codex-agent Your prompt here

# File via env var
PROMPT_FILE=task.md ~/.claude/skills/codex-agent/scripts/codex-agent

# Stdin
cat task.md | ~/.claude/skills/codex-agent/scripts/codex-agent
```

### Session Resume

```bash
# Resume most recent session
~/.claude/skills/codex-agent/scripts/codex-agent --resume latest "Follow-up question"

# Resume by UUID (find in ~/.codex/sessions/)
~/.claude/skills/codex-agent/scripts/codex-agent --resume 019bf3a2-40ce-7923-b501-3d4ebd00aed3 "Continue"

# Via environment variable
CODEX_SESSION=latest ~/.claude/skills/codex-agent/scripts/codex-agent "Follow-up"
```

### Model Selection

```bash
# Via flag
~/.claude/skills/codex-agent/scripts/codex-agent --model gpt-5.2-codex "Your prompt"

# Via environment variable
CODEX_MODEL=gpt-5.2-codex ~/.claude/skills/codex-agent/scripts/codex-agent "Your prompt"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PROMPT_FILE` | Read prompt from this file |
| `CODEX_MODEL` | Model to use (passed as `--model`) |
| `CODEX_SESSION` | Session to resume (`latest` or UUID) |
| `OPENAI_API_KEY` | API key authentication |
| `CODEX_API_KEY` | API key for exec mode |

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
~/.claude/skills/codex-agent/scripts/codex-agent --version
```

Common issues:

1. **No auth configured**: Run `codex login` to set up OAuth, or set `OPENAI_API_KEY`
2. **codex not found**: Install with `npm install -g @openai/codex`
3. **Session not found**: Check `~/.codex/sessions/` for valid UUIDs
4. **Connection errors**: Check network connectivity and auth token expiry

## Notes

- Runs `codex exec --dangerously-bypass-approvals-and-sandbox` (YOLO mode)
- Uses `--skip-git-repo-check` to allow running outside git repos
- Sessions stored in `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`
- For bidirectional streaming, use `codex app-server` directly (JSON-RPC)
