---
name: codex-agent
description: Run the OpenAI Codex CLI non-interactively as a child agent and get back its final reply plus a session id, with the prompt supplied as arguments, a file, or stdin, and session resume support. Use to delegate a self-contained brief to a Codex agent, to get a second-vendor opinion alongside a Claude agent, or to continue an earlier non-interactive Codex run.
license: MIT
allowed-tools: Bash
---

# Codex Agent (wrapper)

> **This runs an autonomous agent with approvals and sandboxing disabled.**
> The wrapper invokes `codex exec --dangerously-bypass-approvals-and-sandbox`,
> because a non-interactive run has no one to approve anything. The child agent
> can read, write and execute in whatever directory you launch it from. Only
> give it briefs you would be willing to run yourself.

## Execution

Works in both foreground and background:

```
# Foreground (blocks until done - use a long timeout, runs can take minutes)
Bash(command: "node \"~/.claude/skills/codex-agent/scripts/codex-agent.mjs\" Your prompt here", timeout: 600000)

# Background (non-blocking - you are notified when it finishes)
Bash(command: "node \"~/.claude/skills/codex-agent/scripts/codex-agent.mjs\" Your prompt here", run_in_background: true)
```

Background is preferred when launching multiple agents in parallel. Codex
routinely takes 2-3x longer than Claude on the same brief.

---

Thin wrapper around the `codex` CLI for non-interactive use:

- Provide the prompt via arguments, `PROMPT_FILE`, or stdin (briefs are byte-exact)
- Model selection via `--model` or `CODEX_MODEL`
- Session resume via `--resume` or `CODEX_SESSION`
- Auto-detects OAuth login (`~/.codex/auth.json`) or API keys
- Clear diagnostics on failure

## Prerequisites

- **Node 18 or newer** (`node --version`)
- **Codex CLI v0.80.0+**: `npm install -g @openai/codex@latest`
- **Authentication**, one of:
  1. `codex login` for ChatGPT OAuth (creates `~/.codex/auth.json`)
  2. `OPENAI_API_KEY` environment variable
  3. `CODEX_API_KEY` environment variable (exec mode only)

Nothing else. The wrapper is a single Node script with no dependencies, so it
does not need bash, GNU `grep -P`, GNU `sort -V`, awk or sed. It runs the same
on Linux, macOS, WSL, and Windows (PowerShell, cmd, or Git Bash).

`CODEX_HOME` is honored if you have relocated your Codex configuration.

## Usage

```bash
# Arguments
node "~/.claude/skills/codex-agent/scripts/codex-agent.mjs" Your prompt here

# File via env var (preferred for big briefs - byte-exact off stdin)
PROMPT_FILE=task.md node "~/.claude/skills/codex-agent/scripts/codex-agent.mjs"

# Stdin
cat task.md | node "~/.claude/skills/codex-agent/scripts/codex-agent.mjs"
```

On Windows PowerShell the `VAR=value command` prefix form is not valid syntax.
Use `$env:PROMPT_FILE="task.md"` on its own line first, then run the command.

### Session Resume

```bash
# Resume most recent session
node "~/.claude/skills/codex-agent/scripts/codex-agent.mjs" --resume latest "Follow-up question"

# Resume by UUID
node "~/.claude/skills/codex-agent/scripts/codex-agent.mjs" --resume 019bf3a2-40ce-7923-b501-3d4ebd00aed3 "Continue"

# Via environment variable
CODEX_SESSION=latest node "~/.claude/skills/codex-agent/scripts/codex-agent.mjs" "Follow-up"
```

### Model Selection

```bash
# Via flag
node "~/.claude/skills/codex-agent/scripts/codex-agent.mjs" --model gpt-5.2-codex "Your prompt"

# Via environment variable
CODEX_MODEL=gpt-5.2-codex node "~/.claude/skills/codex-agent/scripts/codex-agent.mjs" "Your prompt"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PROMPT_FILE` | Read prompt from this file (byte-exact off stdin) |
| `CODEX_MODEL` | Model to use (passed as `--model`) |
| `CODEX_SESSION` | Session to resume (`latest` or UUID) |
| `CODEX_HOME` | Codex config/auth directory (default `~/.codex`) |
| `OPENAI_API_KEY` | API key authentication |
| `CODEX_API_KEY` | API key for exec mode |
| `AGENT_LOG_DIR` | Where run logs go (default: system temp `/agentic-coding-tools`) |

## Output

Returns the plain text response followed by the session ID:

```
<response text>

[session_id: <uuid>]
```

Capture the session ID to continue the conversation with `--resume <uuid>`.

Every run also saves its output to a log file whose path is printed to stderr
as `[output_file: ...]`. **Read the path the wrapper printed** — do not guess
it or glob for the newest file, because parallel runs share the directory.

If a background run's output was not captured, read the `[output_file:]` path
instead.

## Troubleshooting

Diagnostics are shown automatically on any failure. You can also run:

```bash
node "~/.claude/skills/codex-agent/scripts/codex-agent.mjs" --version
```

Common issues:

1. **No auth configured**: run `codex login`, or set `OPENAI_API_KEY`
2. **codex not found**: install with `npm install -g @openai/codex`
3. **Session not found**: check `~/.codex/sessions/` for valid UUIDs
4. **Connection errors**: check network connectivity and auth token expiry
5. **`no prompt: stdin was empty`**: the wrapper refuses to run on an empty
   prompt. This usually means it was launched from a parent that closed stdin.
   Pass the prompt as arguments or via `PROMPT_FILE`.

## Notes

- Runs `codex exec --dangerously-bypass-approvals-and-sandbox` (see the warning
  at the top), with `--skip-git-repo-check` so it works outside a git repo.
- The prompt is always delivered on stdin (`codex exec ... -`), including
  resume follow-ups. A large brief is therefore never truncated at the ~128KB
  argument-length cap, and no user text passes through platform command-line
  quoting.
- stdout and stderr are captured separately. Recent codex builds put the final
  agent message on stdout and the header, transcript replay and "tokens used"
  footer on stderr; merging them made the reply and the footer interleave
  nondeterministically.
- Sessions are stored in `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`.
- For bidirectional streaming, use `codex app-server` directly (JSON-RPC).
