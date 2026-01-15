# Agentic Coding Tools

A Claude Code plugin marketplace for sub-agent orchestration, prompt synthesis, and browser automation.

## Installation

### Install Everything

```bash
/plugin marketplace add TheSylvester/agentic-coding-tools
/plugin install agentic-coding-tools
```

### Install Individual Skills

Skills are individually installable from the marketplace:

```bash
/plugin marketplace add TheSylvester/agentic-coding-tools
/plugin install super-agent      # Just this skill
/plugin install chrome-screenshot # Or this one
```

Or clone and symlink:
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
| `gemini-agent` | Wrapper around gemini CLI for non-interactive runs with resume support. |
| `build-prompt-chain` | Transform monolithic prompts into phased chains for sustained-context execution. |
| `read-transcript` | Read Claude Code .jsonl transcripts in a token-efficient format. |
| `chrome-screenshot` | Extract and save browser screenshots from Claude Code transcripts. |
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
| `browser-qa` | Visual UI testing and verification via browser automation. |
| `ui-clone` | Create pixel-perfect HTML/CSS/JS reproductions of websites. |

### Cross-Platform Ports

The same prompt synthesis tools are available for other AI coding assistants:

#### Cursor IDE (`.cursor/commands/`)

```bash
mkdir -p ~/.cursor/commands
cp -r .cursor/commands/* ~/.cursor/commands/
# Restart Cursor or run "Developer: Reload Window"
```

#### Gemini CLI (`.agent/workflows/`)

```bash
mkdir -p ~/.agent/workflows
cp -r .agent/workflows/* ~/.agent/workflows/
```

## Key Workflows

### Handoff Pattern
Use `/handoff-prompt-to` to synthesize a prompt, then `/super-agent` to execute it in a fresh context.

### Phased Execution
Use `/build-prompt-chain` to decompose large tasks into phases, then execute each phase with `/super-agent`.

### UI Work
Use `browser-qa` for testing flows and `ui-clone` for reproducing designs.

---

## Development

This repo serves dual purpose: it's both a Claude Code config directory AND a marketplace source.

### Structure

```
~/.claude/                              # Can be this repo
├── .claude-plugin/
│   ├── plugin.json                     # Plugin metadata
│   └── marketplace.json                # Lists all installable plugins
├── skills/                             # Individual skills
│   └── <skill-name>/
│       ├── SKILL.md                    # Documentation + frontmatter
│       ├── .claude-plugin/plugin.json  # Makes it individually installable
│       └── scripts/<skill-name>        # Executable (if any)
├── commands/                           # Slash commands (.md files)
├── agents/                             # Subagent definitions (.md files)
└── plugins/                            # GITIGNORED - for installed plugins
    └── marketplaces/
        └── agentic-coding-tools → ../.. (symlink to root)
```

### How the Symlink Works

Claude Code looks for marketplaces in `~/.claude/plugins/marketplaces/*/`. The symlink makes the repo root appear there:

```
plugins/marketplaces/agentic-coding-tools → ../..
```

This way:
- Claude Code finds the marketplace via the symlink
- All actual files live at root (tracked by git)
- `plugins/` stays gitignored (for external installed plugins)

### Local Development Setup

If using this repo as your `~/.claude/`:

```bash
# One-time symlink setup
mkdir -p plugins/marketplaces
ln -s ../.. plugins/marketplaces/agentic-coding-tools
```

### Adding a New Skill

1. Create `skills/<name>/SKILL.md` with YAML frontmatter:
   ```yaml
   ---
   name: skill-name
   description: What it does
   allowed-tools: Bash, Read
   ---
   ```

2. Add `skills/<name>/.claude-plugin/plugin.json`:
   ```json
   {
     "name": "skill-name",
     "version": "1.0.0",
     "description": "What it does",
     "author": { "name": "YourName" }
   }
   ```

3. Add executable to `skills/<name>/scripts/<name>` (if needed)

4. Add entry to `.claude-plugin/marketplace.json`:
   ```json
   {
     "name": "skill-name",
     "source": "./skills/skill-name",
     "description": "What it does",
     "version": "1.0.0",
     "category": "development",
     "author": { "name": "YourName" }
   }
   ```

5. Validate and test:
   ```bash
   claude plugin validate .
   /plugin  # Check it appears
   ```

## License

MIT
