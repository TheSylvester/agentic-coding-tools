---
name: read-transcript
description: ALWAYS use this skill instead of Read when reading Claude Code transcript files (.jsonl in ~/.claude/projects/, ~/.claude/history.jsonl, or paths containing 'transcript'). Token-efficient format that extracts USER/ASSISTANT exchanges and tool summaries, strips metadata.
allowed-tools: Bash
---

# Read Transcript

Token-efficient reader for Claude Code `.jsonl` transcript files. Strips metadata, extracts conversation flow.

## Auto-Trigger Conditions

**CRITICAL**: Use this skill AUTOMATICALLY instead of Read for any transcript files.

**File Patterns:**
- `~/.claude/projects/*/<UUID>.jsonl` - main session transcripts
- `~/.claude/projects/*/agent-*.jsonl` - sub-agent transcripts (at project root)
- `~/.claude/projects/*/<UUID>/subagents/agent-*.jsonl` - nested sub-agent transcripts
- `~/.claude/history.jsonl` - ⚠️ command history (different format, not supported)
- `*/diffs/*/transcript_cycle.jsonl` - transcript cycle files
- Any `.jsonl` when context suggests Claude Code conversation

**User Phrases:**
- "read/analyze this transcript"
- "what happened in this session"
- "review this Claude Code session"
- "find a transcript" / "find me a transcript"

**Only use Read directly if:**
- User explicitly needs raw JSONL structure
- Debugging format issues
- Inspecting specific metadata fields

## Usage

```bash
# Basic - outputs to stdout
python .claude/skills/read-transcript/scripts/jsonl-to-readable.py /path/to/transcript.jsonl

# With metadata header (dir, branch, timestamps, entry count)
python .claude/skills/read-transcript/scripts/jsonl-to-readable.py transcript.jsonl --summary

# Text only (no tool calls)
python .claude/skills/read-transcript/scripts/jsonl-to-readable.py transcript.jsonl --no-tools

# Compact format
python .claude/skills/read-transcript/scripts/jsonl-to-readable.py transcript.jsonl --compact

# Include sub-agent transcripts inline
python .claude/skills/read-transcript/scripts/jsonl-to-readable.py transcript.jsonl --inline-subagents
```

## Options

| Flag | Description |
|------|-------------|
| `--summary` | Include metadata header (dir, branch, timestamps) |
| `--no-tools` | Omit tool calls/results (text exchanges only) |
| `--compact` | Denser output format |
| `--inline-subagents` | Recursively inline sub-agent transcripts |
| `--thinking` | Include thinking blocks (usually skip to save tokens) |

## When to Use

**Auto-trigger on:**
- Any `.jsonl` file in `~/.claude/projects/`
- User mentions "transcript", "session", or "conversation history"

**Also useful for:**
- Analyzing what happened in a Claude Code session
- Reviewing conversation flow without metadata clutter
- Extracting content from transcripts for documentation
- Summarizing or understanding transcript content

## When NOT to Use

- Debugging JSONL format issues (use Read directly)
- Inspecting specific metadata fields (sessionId, tokens, etc.)
- When user explicitly wants raw structure
