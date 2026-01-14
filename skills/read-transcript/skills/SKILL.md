---
name: read-transcript
description: Read Claude Code .jsonl transcript files in a token-efficient format. Use this instead of Read when you need the conversation content from a transcript, not the raw JSONL structure. Extracts USER/ASSISTANT exchanges and tool summaries, strips metadata.
allowed-tools: Bash
---

# Read Transcript

Token-efficient reader for Claude Code `.jsonl` transcript files. Strips metadata, extracts conversation flow.

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

- Analyzing what happened in a Claude Code session
- Reviewing conversation flow without metadata clutter
- Extracting content from transcripts for documentation
- Summarizing or understanding transcript content

## When NOT to Use

- Debugging JSONL format issues (use Read directly)
- Inspecting specific metadata fields (sessionId, tokens, etc.)
- When user explicitly wants raw structure
