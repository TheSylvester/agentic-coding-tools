---
name: super-agent
description: SDK-based Claude agent with full Task tool access. Use for executing handoff prompts or spawning nested sub-agents.
allowed-tools: Bash
---

# Super Agent

SDK-based Claude instance with full tool access including Task (can spawn its own sub-agents).

## Usage

```bash
# Execute a prompt file
PROMPT_FILE=path/to/prompt.md .claude/skills/super-agent/scripts/super-agent

# Inline prompt
.claude/skills/super-agent/scripts/super-agent Use parallel sub-agents to research this repo

# Stdin
cat prompt.md | .claude/skills/super-agent/scripts/super-agent
```

**If agent asks "should I proceed?" instead of implementing:** Resume and confirm:

```bash
.claude/skills/super-agent/scripts/super-agent --resume <session-id> "Yes, proceed"
```

The session ID is always printed at the end of output as `[session_id: ...]`.

**Fork at a specific message** (the forked agent sees only conversation up to that message):

```bash
.claude/skills/super-agent/scripts/super-agent \
  --fork --resume <session-id> --resume-at <message-uuid> \
  "Continue from this point"
```

## Options

| Flag / Variable         | Description                              |
| ----------------------- | ---------------------------------------- |
| `--no-chrome`           | Disable Chrome (enabled by default)      |
| `--no-persist`          | Don't save session to disk               |
| `--fork`, `-f`          | Fork from SESSION_ID context             |
| `--resume`, `-r`        | Resume a previous session                |
| `--resume-at MESSAGE_ID`| Fork at a specific message UUID (requires `--fork`) |
| `PROMPT_FILE`           | Read prompt from file                    |
| `BYPASS_PERMISSIONS=1`  | Full autonomy mode                       |
| `SUPER_AGENT_DEBUG=1`   | Print cost to stderr                     |
| `SUPER_AGENT_CHROME=0`  | Disable Chrome (env var form)            |
| `SESSION_ID`            | Session ID for --fork                    |
| `SUPER_AGENT_MODEL`     | Override model (e.g., claude-sonnet-4-5) |

## Output Files

Every run saves a copy of the output to `/tmp/crispy-agents/super-agent-<timestamp>-<pid>.log`.
The path is printed to stderr as `[output_file: ...]`. If `TaskOutput` fails
to capture output from a background run, read this file instead.

## Monitoring

Transcripts land in `~/.claude/projects/<cwd-slug>/`. Use external transcript monitor for realtime visibility.
