---
name: council
description: Multi-agent debate orchestrator. Use when you want multiple AI perspectives on a question, plan review, or architectural decision. Runs parallel agent panels with a Chair synthesizing responses.
allowed-tools: Bash
---

# Council - Multi-Agent Debate

Orchestrates parallel debates across multiple AI agents (codex, gemini, super-agent) with a Chair LLM synthesizing responses across rounds.

## When to Use

- "Get multiple perspectives on this"
- "Have the agents debate this approach"
- "Review this plan with the council"
- "What do different models think about X?"

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                      ROUND N                                │
├─────────────────────────────────────────────────────────────┤
│  1. All agents receive the question + previous context      │
│  2. Agents respond IN PARALLEL (O(N) not O(N²))             │
│  3. Chair synthesizes responses                             │
│  4. Chair decides: CONTINUE or DONE                         │
│  5. If CONTINUE, agents get synthesis + other views         │
└─────────────────────────────────────────────────────────────┘
```

Each agent maintains its own session via `--resume`, enabling true multi-round debate where agents remember what they said.

## Usage

```bash
# Basic question
~/.claude/skills/council/scripts/council "What's the best approach for X?"

# Specify agents (default: gemini,super)
~/.claude/skills/council/scripts/council --agents codex,gemini,super "Review this"

# More rounds for complex debates
~/.claude/skills/council/scripts/council --max-rounds 5 "Debate the tradeoffs"

# Verbose output (see agent responses in real-time)
~/.claude/skills/council/scripts/council --verbose "Analyze this architecture"

# From file
PROMPT_FILE=question.md ~/.claude/skills/council/scripts/council
```

## Options

| Flag / Variable    | Description                                    |
| ------------------ | ---------------------------------------------- |
| `--agents`, `-a`   | Comma-separated agents (default: gemini,super) |
| `--max-rounds`, `-r` | Maximum debate rounds (default: 3)           |
| `--verbose`, `-v`  | Show agent responses in real-time              |
| `PROMPT_FILE`      | Read question from file                        |
| `COUNCIL_AGENTS`   | Default agents via environment                 |

## Available Agents

| Agent    | Strengths                          | Notes                    |
| -------- | ---------------------------------- | ------------------------ |
| `gemini` | Fast, good UX/behavior reasoning   | Enabled by default       |
| `super`  | Architectural, can use tools       | Enabled by default       |
| `codex`  | Technical correctness, code review | Often rate-limited       |

## Output

- Progress/status goes to **stderr** (council convened, rounds, decisions)
- Final synthesis goes to **stdout** (pipeable)

```bash
# Capture just the final answer
answer=$(~/.claude/skills/council/scripts/council "Question" 2>/dev/null)

# See the debate unfold
~/.claude/skills/council/scripts/council --verbose "Question"
```

## Extending

Add new agents by updating `AGENT_SCRIPTS` in the script:

```python
AGENT_SCRIPTS = {
    "codex": Path.home() / ".claude/skills/codex-agent/scripts/codex-agent",
    "gemini": Path.home() / ".claude/skills/gemini-agent/scripts/gemini-agent",
    "super": Path.home() / ".claude/skills/super-agent/scripts/super-agent",
    "cursor": Path.home() / ".claude/skills/cursor-agent/scripts/cursor-agent",  # Add new
}
```

Agents must support:
- Prompt as final argument
- `--resume <session_id>` for continuity
- Output `[session_id: ...]` for session tracking
