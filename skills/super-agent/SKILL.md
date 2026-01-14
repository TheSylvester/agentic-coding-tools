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

Use `SUPER_AGENT_DEBUG=1` on initial run to capture session ID.

## Options

| Flag / Variable         | Description                              |
| ----------------------- | ---------------------------------------- |
| `--no-chrome`           | Disable Chrome (enabled by default)      |
| `--fork`, `-f`          | Fork from SESSION_ID context             |
| `--resume`, `-r`        | Resume a previous session                |
| `PROMPT_FILE`           | Read prompt from file                    |
| `BYPASS_PERMISSIONS=1`  | Full autonomy mode                       |
| `SUPER_AGENT_DEBUG=1`   | Print session ID & cost                  |
| `SUPER_AGENT_CHROME=0`  | Disable Chrome (env var form)            |
| `SESSION_ID`            | Session ID for --fork                    |

## Monitoring

Transcripts land in `~/.claude/projects/<cwd-slug>/`. Use external transcript monitor for realtime visibility.
