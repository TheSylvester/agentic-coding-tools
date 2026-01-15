# Agentic Coding Tools

A Claude Code plugin marketplace for sub-agent orchestration, prompt synthesis, and browser automation.

## Installation

### Install Everything

```bash
/plugin marketplace add TheSylvester/agentic-coding-tools
/plugin install agentic-coding-tools
```

### Install Individual Items

After adding the marketplace, you can manually copy individual items to your `~/.claude/` directory:

**Skills** (copy entire folder):
```bash
# Example: install just super-agent
cp -r ~/.claude/plugins/agentic-coding-tools/skills/super-agent ~/.claude/skills/
```

**Commands** (copy .md file):
```bash
# Example: install just handoff-prompt-to
cp ~/.claude/plugins/agentic-coding-tools/commands/handoff-prompt-to.md ~/.claude/commands/
```

**Agents** (copy .md file):
```bash
# Example: install just browser-qa agent
cp ~/.claude/plugins/agentic-coding-tools/agents/browser-qa.md ~/.claude/agents/
```

Or clone the repo and symlink what you need:
```bash
git clone https://github.com/TheSylvester/agentic-coding-tools.git ~/dev/agentic-coding-tools
ln -s ~/dev/agentic-coding-tools/skills/super-agent ~/.claude/skills/super-agent
```

## What's Included

### Skills

| Skill | Description |
|-------|-------------|
| `super-agent` | SDK-based Claude agent with full Task tool access. Use for executing handoff prompts or spawning nested sub-agents. |
| `cursor-agent` | Wrapper around cursor-agent CLI for non-interactive runs with resume support. |
| `gemini-agent` | Wrapper around gemini CLI for non-interactive runs. |
| `build-prompt-chain` | Transform monolithic prompts into phased chains for sustained-context execution. |
| `read-transcript` | Read Claude Code .jsonl transcripts in a token-efficient format. |
| `save-transcript-screenshots` | Extract and save browser screenshots from Claude Code transcripts to disk. Works with MCP browser automation. |
| `git-worktree` | Create git worktrees with automatic symlinking of gitignored local files (.env*, .ai-*, etc.). |

### Commands (Prompt Synthesis)

| Command | Description |
|---------|-------------|
| `/handoff-prompt-to` | Synthesize implementation prompts for a fresh agent. Auto-decomposes if task is too large. |
| `/pair-prompt-to` | Create a complete spec for pair-programming with a new agent. |
| `/reflect` | Validate prompts against conversation + codebase before execution. |
| `/walkthrough-prompt-to` | Generate guided walkthrough prompts. |

### Agents (Task Specialists)

| Agent | Description |
|-------|-------------|
| `browser-qa` | Visual UI testing and verification via browser automation. Auto-saves screenshots using `save-transcript-screenshots`. |
| `ui-clone` | Create pixel-perfect HTML/CSS/JS reproductions of websites. |

### Cross-Platform Ports

The same prompt synthesis tools are available for other AI coding assistants:

#### Cursor IDE (`.cursor/commands/`)

Ports of the Claude Code commands for Cursor's Agent chat. Install globally:

```bash
mkdir -p ~/.cursor/commands
cp -r .cursor/commands/* ~/.cursor/commands/
# Restart Cursor or run "Developer: Reload Window"
```

Includes: `/build-prompt-chain`, `/handoff-prompt-to`, `/pair-prompt-to`, `/reflect`

#### Gemini CLI (`.agent/workflows/`)

Ports of the Claude Code commands for Gemini CLI. Copy to your Gemini config:

```bash
mkdir -p ~/.agent/workflows
cp -r .agent/workflows/* ~/.agent/workflows/
```

Includes: `build-prompt-chain`, `handoff-prompt-to`, `pair-prompt-to`, `reflect`

## Key Workflows

### Handoff Pattern
Use `/handoff-prompt-to` to synthesize a prompt, then `/super-agent` to execute it in a fresh context.

### Phased Execution
Use `/build-prompt-chain` to decompose large tasks into phases, then execute each phase with `/super-agent`.

### UI Work
Use `browser-qa` for testing flows and `ui-clone` for reproducing designs.

## License

MIT
