---
name: read-transcript
description: This skill should be used instead of the Read tool when reading Claude Code transcript files (.jsonl in ~/.claude/projects/, ~/.claude/history.jsonl, or paths containing 'transcript'). This skill should be used when the user asks to "read this transcript", "analyze this session", "what happened in this session", "review this Claude Code session", "find a transcript", or when any .jsonl file in ~/.claude/projects/ needs to be read. Token-efficient format that extracts USER/ASSISTANT exchanges and tool summaries, strips metadata, with budget-based output limiting.
allowed-tools: Bash
---

# Read Transcript

Token-efficient reader for Claude Code `.jsonl` transcript files. Strips metadata, extracts conversation flow. Output is budget-limited by default (~30K chars) — never dumps unbounded data.

## When to Use

Use **instead of Read** for any transcript file:

- `~/.claude/projects/*/<UUID>.jsonl` — main session transcripts
- `~/.claude/projects/*/agent-*.jsonl` — sub-agent transcripts
- `~/.claude/projects/*/<UUID>/subagents/agent-*.jsonl` — nested sub-agent transcripts
- `*/diffs/*/transcript_cycle.jsonl` — transcript cycle files
- Any `.jsonl` when context suggests Claude Code conversation

**Not supported:** `~/.claude/history.jsonl` (command history, different format).

**Use Read directly only when:** raw JSONL structure is needed, debugging format issues, or inspecting specific metadata fields.

## Usage

```bash
# Default — auto-limited to ~30K chars
.claude/skills/read-transcript/scripts/read-transcript /path/to/transcript.jsonl

# Most recent activity first
.claude/skills/read-transcript/scripts/read-transcript transcript.jsonl --tail

# With metadata header (dir, branch, entry count)
.claude/skills/read-transcript/scripts/read-transcript transcript.jsonl --summary

# Continue from where output stopped (offset from footer)
.claude/skills/read-transcript/scripts/read-transcript transcript.jsonl --offset 42

# Dump everything (bypass budget)
.claude/skills/read-transcript/scripts/read-transcript transcript.jsonl --all
```

## Options

| Flag | Description |
|------|-------------|
| `--summary` | Include metadata header (dir, branch, timestamps) |
| `--no-tools` | Omit tool calls/results (text exchanges only) |
| `--compact` | Denser output format |
| `--inline-subagents` | Recursively inline sub-agent transcripts |
| `--thinking` | Include thinking blocks (usually skip to save tokens) |
| `--offset N` | Skip first N entries (0-based) |
| `--limit N` | Return only N entries |
| `--budget N` | Max output chars (default: 30000). Stops at last complete entry. |
| `--tail` | Read from the end of the transcript (most recent activity) |
| `--all` | Bypass budget limit, dump everything |

## Budget-Based Output Limiting

Output is capped at ~30,000 characters by default. The script never cuts mid-entry — it stops at the last complete entry that fits, then prints a continuation footer:

```
────────────────────────────────────────
Showing entries 0–41 of 312 (~29,847 chars)
Next page: --offset 42
```

To continue, pass the `--offset` value from the footer on the next call.

**Tail mode** reads from the end — for "what just happened?" scenarios:

```bash
.claude/skills/read-transcript/scripts/read-transcript transcript.jsonl --tail --summary
```

Adjust the budget with `--budget N` or bypass entirely with `--all`.
