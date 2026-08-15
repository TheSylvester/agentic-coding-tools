---
name: claude-agent
description: Run the Claude Code CLI non-interactively as a child agent and get back its final reply plus a session id, with the prompt supplied as arguments, a file, or stdin, true session resume, and an opt-in liveness monitor. Use to delegate a self-contained brief to a full Claude agent, to run several Claude agents in parallel in the background, or to continue an earlier non-interactive run.
license: MIT
allowed-tools: Bash
---

# Claude Agent (wrapper)

> **This runs an autonomous agent with permission prompts disabled.**
> The default permission mode is `bypassPermissions`, because a
> non-interactive run has no one to answer a prompt. The child agent can read,
> write and execute in whatever directory you launch it from. Only give it
> briefs you would be willing to run yourself, and set
> `CLAUDE_PERMISSION_MODE` if you want something stricter.

## Execution

Works in both foreground and background:

```
# Foreground (blocks until done - use a long timeout, runs can take minutes)
Bash(command: "node \"~/.claude/skills/claude-agent/scripts/claude-agent.mjs\" Your prompt here", timeout: 600000)

# Background (non-blocking - you are notified when it finishes)
Bash(command: "node \"~/.claude/skills/claude-agent/scripts/claude-agent.mjs\" Your prompt here", run_in_background: true)
```

Background is preferred when launching multiple agents in parallel.

---

Thin wrapper around `claude -p` (Claude Code CLI) for non-interactive use:

- Provide the prompt via arguments, `PROMPT_FILE`, or stdin (briefs are byte-exact)
- Model selection via `--model` or `CLAUDE_MODEL`
- TRUE session resume via `--resume` / `--continue` or `CLAUDE_SESSION`
- Pre-assign a session id via `--session-id` so the caller owns the handle
- Opt-in live phase/liveness monitor via `--monitor` / `CLAUDE_MONITOR=1`
- Clean reply and session id read straight out of the JSON result — no scraping

## Prerequisites

- **Node 18 or newer** (`node --version`)
- **Claude Code CLI**: `npm install -g @anthropic-ai/claude-code`

Nothing else. The wrapper is a single Node script with no dependencies, so it
does not need bash, `jq`, `python3`, `uuidgen`, GNU grep or GNU sort. It runs
the same on Linux, macOS, WSL, and Windows (PowerShell, cmd, or Git Bash).

## Usage

```bash
# Arguments
node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs" Your prompt here

# File via env var (preferred for big briefs - byte-exact off stdin)
PROMPT_FILE=task.md node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs"

# Stdin
cat task.md | node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs"
```

On Windows PowerShell the `VAR=value command` prefix form is not valid syntax.
Use `$env:PROMPT_FILE="task.md"` on its own line first, then run the command.

### Session Resume

```bash
# Resume most recent session in this cwd
node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs" --resume latest "Follow-up question"

# Resume by UUID (true resume - preserves full prior context)
node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs" --resume 019bf3a2-40ce-7923-b501-3d4ebd00aed3 "Continue"

# Via environment variable
CLAUDE_SESSION=latest node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs" "Follow-up"
```

### Pre-assign a Session ID

For NEW sessions the wrapper generates a UUID up-front, so the orchestrator
owns the handle before any output returns. Force a specific id with:

```bash
node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs" --session-id <UUID> "Your prompt"
# or
CLAUDE_SESSION_ID=<UUID> node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs" "Your prompt"
```

### Model Selection

```bash
# Via flag (alias or full id)
node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs" --model sonnet "Your prompt"

# Via environment variable
CLAUDE_MODEL=sonnet node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs" "Your prompt"
```

Omit the model to use the CLI default.

### Monitor Mode (live liveness)

Opt-in. Streams live phase and liveness lines to **stderr** while the run is in
flight, and still returns the final reply and session id on **stdout**. The
`[output_file:]` and `[session_id:]` contract is identical to the default mode,
so callers never have to branch.

```bash
PROMPT_FILE=task.md node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs" --monitor

# Equivalent via env var alone
CLAUDE_MONITOR=1 node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs" "Your prompt"
```

Monitor mode runs claude with `--output-format stream-json --verbose
--include-partial-messages --include-hook-events`, writes the raw NDJSON to a
sibling `.ndjson` file, feeds the same lines to the bundled
`claude-monitor.mjs` in-process, and extracts the reply and session id from the
terminal `result` event. Stderr shows phase transitions (`thinking` ->
`tool:<name>` -> `idle-between` -> `done`) and declares `STALLED!!` on silence
outside an open tool or hook bracket.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PROMPT_FILE` | Read prompt from this file (byte-exact off stdin) |
| `CLAUDE_MODEL` | Model alias/id (passed as `--model`). Omit for default |
| `CLAUDE_SESSION` | Session to resume (`latest` or UUID) |
| `CLAUDE_SESSION_ID` | Pre-assign this UUID for a new session |
| `CLAUDE_PERMISSION_MODE` | Permission mode (default `bypassPermissions`) |
| `CLAUDE_MONITOR` | `1` enables the live liveness monitor (= `--monitor`) |
| `AGENT_LOG_DIR` | Where run logs go (default: system temp `/agentic-coding-tools`) |

## Output

Returns the plain text response followed by the session ID (same in both modes):

```
<response text>

[session_id: <uuid>]
```

Capture the session ID to continue the conversation with `--resume <uuid>`.

Every run also saves its output to a log file whose path is printed to stderr
as `[output_file: ...]`. **Read the path the wrapper printed** — do not guess
it or glob for the newest file, because parallel runs share the directory. Its
contents are byte-identical to stdout (clean reply plus `[session_id:]`) in
both modes. In monitor mode the raw stream-json NDJSON is additionally saved to
a sibling `.ndjson` file, announced on stderr as `[ndjson_file: ...]`.

If a background run's output was not captured, read the `[output_file:]` path
instead.

## Troubleshooting

```bash
node "~/.claude/skills/claude-agent/scripts/claude-agent.mjs" --version
```

Common issues:

1. **claude not found**: install with `npm install -g @anthropic-ai/claude-code`
2. **Permission prompts / tool use blocked**: keep `bypassPermissions` (the default)
3. **Session not found on resume**: check the UUID, or use `--resume latest`
4. **`no prompt: stdin was empty`**: the wrapper refuses to bill a turn on an
   empty prompt. This usually means it was launched from a parent that closed
   stdin. Pass the prompt as arguments or via `PROMPT_FILE`.

## Why this exists

Symmetric sibling of `codex-agent`. The `fusionthink` skill hands BOTH
reviewers the SAME `.md` brief via `PROMPT_FILE=<file>`, and a sub-agent task
tool cannot do that — its prompt is a plain string with no file parameter.
`claude -p` reads the brief **directly off stdin, byte-exact**, with no pointer
indirection and no JSON-escaping minefield. With the full Claude system prompt
loaded, the child is an **independent, full-fidelity agent** rather than a
stripped sub-agent.

`claude -p` runs fine nested inside Claude Code. Every prompt — including
resume follow-ups — is delivered on stdin, so a large brief is never truncated
at the ~128KB argument-length cap, and no user text ever passes through
platform command-line quoting.

## Notes

- Default mode runs `claude -p --output-format json` and reads `.result` and
  `.session_id` directly. No transcript scraping.
- Monitor mode runs `claude -p --output-format stream-json` and extracts the
  same fields from the terminal `result` event. The stderr contract is
  identical, so callers do not branch.
- New sessions get a pre-assigned UUID up-front; `--resume`/`--continue` use
  the existing one.
- Transcripts live under `~/.claude/projects/<cwd-slug>/<session-id>.jsonl`.
- Behavior of `claude -p` is tied to the CLI version. Pin the version if you
  depend on the exact output contract.
