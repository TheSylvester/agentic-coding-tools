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
- Clear error messages with auto-diagnostics on failure

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

## Which Input Method to Use?

Choose ONE method based on your situation:

| Situation | Method | Example |
|-----------|--------|---------|
| Short inline prompt | **Args** | `gemini-agent "Explain X"` |
| Prompt already exists in a file | **PROMPT_FILE** | `PROMPT_FILE=task.md gemini-agent` |
| Building prompt dynamically | **Heredoc** | `gemini-agent <<'EOF'`<br>`your prompt`<br>`EOF` |
| Piping from another command | **Stdin** | `cat file.md \| gemini-agent` |

**Key concept:** `PROMPT_FILE` means "read this file's contents AS the prompt" - the entire file becomes your prompt.

## Usage Examples

### Args (short prompts)
```bash
gemini-agent "Explain how async/await works in JavaScript"
gemini-agent "Review this code for bugs: $(cat snippet.js)"
```

### PROMPT_FILE (prompt is in a file)
```bash
# The contents of task.md become the prompt
PROMPT_FILE=task.md gemini-agent

# With model selection
PROMPT_FILE=analysis-request.md GEMINI_MODEL=gemini-2.0-flash gemini-agent
```

### Heredoc (multi-line dynamic prompts)
```bash
gemini-agent <<'EOF'
Context: We're building a VS Code extension.

Question: What's the best way to handle webview state persistence?

Please provide:
1. Recommended approach
2. Code example
3. Common pitfalls
EOF
```

### Stdin (piping)
```bash
# Pipe file contents
cat requirements.md | gemini-agent

# Pipe command output
git diff HEAD~3 | gemini-agent "Review these changes:"
```

## Common Mistakes

**Don't combine input methods** - use exactly ONE:

```bash
# WRONG: PROMPT_FILE with heredoc
PROMPT_FILE=/dev/stdin gemini-agent <<'EOF'
prompt here
EOF

# CORRECT: Just use heredoc directly
gemini-agent <<'EOF'
prompt here
EOF
```

```bash
# WRONG: PROMPT_FILE pointing to stdin
PROMPT_FILE=/dev/stdin gemini-agent

# CORRECT: Use pipe or heredoc
cat myfile.txt | gemini-agent
```

```bash
# WRONG: Mixing PROMPT_FILE with piped input
echo "extra" | PROMPT_FILE=task.md gemini-agent
# (stdin is ignored, only PROMPT_FILE is used - you'll get a warning)

# CORRECT: Choose one source
PROMPT_FILE=task.md gemini-agent
# OR
cat task.md extra.txt | gemini-agent
```

## Session Resume

Capture the `[session_id: ...]` from output to continue conversations:

```bash
# Resume most recent session
gemini-agent --resume latest "Follow-up question"

# Resume by UUID (from previous output)
gemini-agent --resume c9283e30-910e-442c-b567-48ac9e1fab03 "Continue"

# Resume by index (use `gemini --list-sessions` to see available)
gemini-agent --resume 3 "Continue from session 3"

# Via environment variable
GEMINI_SESSION=c9283e30-910e-442c-b567-48ac9e1fab03 gemini-agent "Follow-up"
```

## Model Selection

```bash
# Via flag
gemini-agent --model gemini-2.0-flash "Your prompt"

# Via environment variable
GEMINI_MODEL=gemini-2.0-flash gemini-agent "Your prompt"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PROMPT_FILE` | Path to file whose contents become the prompt |
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

**Diagnostics are shown automatically on any failure**, including:
- What input method was used
- Prompt length and preview
- Authentication status
- Gemini CLI version

You can also run diagnostics manually:
```bash
gemini-agent --version
```

### Common Issues

1. **No auth configured**: Run `gemini` interactively once to set up OAuth, or set `GEMINI_API_KEY`
2. **gemini not found**: Install with `npm install -g @google/gemini-cli`
3. **--resume not working**: Requires gemini CLI v0.20.0+ (`gemini --version` to check)
4. **Connection errors**: Check network connectivity and auth token expiry
5. **Empty prompt error**: Make sure your file/stdin/args actually contain content

## Notes

- Runs `gemini -y -o json -p <prompt>` in non-interactive YOLO mode with JSON output to capture session_id
- Sessions are project-specific (tied to working directory)
- UUID-based resume requires full UUIDs (e.g., `c9283e30-910e-442c-b567-48ac9e1fab03`), not partial UUIDs
- Use `gemini --list-sessions` to see available sessions for current project

### Session File Locations

For reference, session files are stored at:
- Path: `~/.gemini/tmp/{project_hash}/chats/session-*.json`
- `{project_hash}` is the SHA256 hash of the working directory path
- Use `gemini --list-sessions` to list available sessions without needing to navigate the file structure
