# Agentic Coding Tools

Stop losing context when Claude hits limits. Hand off tasks to fresh agents with full specs automatically synthesized from your conversation.

## Quick Example

```
You: "Build the auth system we discussed"
/handoff-prompt-to super-agent

→ Synthesizes a complete implementation spec from conversation context
→ Spawns a fresh agent with the spec
→ Agent executes with full context, no token debt
```

## Installation

```bash
/plugin marketplace add TheSylvester/agentic-coding-tools
/plugin install agentic-coding-tools
```

Or install individual skills:
```bash
/plugin install super-agent
/plugin install chrome-screenshot
```

## Core Workflows

### Handoff Pattern
When context gets heavy, synthesize a prompt and hand off to a fresh agent:
- `/handoff-prompt-to super-agent` — Full spec, fresh execution
- `/pair-prompt-to super-agent` — Collaborative pair-programming mode
- `/reflect` — Validate your prompts before execution

### Phased Execution
For large tasks that exceed single-agent capacity:
- `/build-prompt-chain` — Decompose into phases with orchestration file
- Execute each phase with `/super-agent`

### Browser Automation
- `browser-qa` agent — Visual UI testing and verification
- `ui-clone` agent — Pixel-perfect HTML/CSS reproductions
- `/chrome-screenshot` — Extract screenshots from session transcripts

## What's Included

### Skills

| Skill | Description |
|-------|-------------|
| `super-agent` | SDK-based Claude agent with full Task tool access |
| `cursor-agent` | Cursor IDE agent wrapper with resume support |
| `gemini-agent` | Gemini CLI wrapper with resume support |
| `git-worktree` | Create worktrees with auto-symlinked local files (.env*, .ai-*) |
| `build-prompt-chain` | Transform monolithic prompts into phased chains |
| `chrome-screenshot` | Extract browser screenshots from transcripts |
| `read-transcript` | Token-efficient transcript reading |

### Commands

| Command | Description |
|---------|-------------|
| `/handoff-prompt-to` | Synthesize implementation prompts for fresh agents |
| `/pair-prompt-to` | Create specs for pair-programming sessions |
| `/walkthrough-prompt-to` | Generate design walkthrough prompts |
| `/reflect` | Validate prompts against conversation + codebase |

### Agents

| Agent | Description |
|-------|-------------|
| `browser-qa` | Visual UI testing via browser automation |
| `ui-clone` | Pixel-perfect website reproduction |

## Cross-Platform

Same prompt synthesis tools for other AI assistants:

| Platform | Setup |
|----------|-------|
| Cursor IDE | `cp -r .cursor/commands/* ~/.cursor/commands/` |
| Gemini CLI | `cp -r .agent/workflows/* ~/.agent/workflows/` |

---

<details>
<summary><strong>Development</strong></summary>

This repo is both a Claude Code config directory AND a marketplace source.

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

### Local Setup

```bash
# One-time symlink setup
mkdir -p plugins/marketplaces
ln -s ../.. plugins/marketplaces/agentic-coding-tools
```

### Adding a Skill

1. Create `skills/<name>/SKILL.md` with YAML frontmatter
2. Add `skills/<name>/.claude-plugin/plugin.json`
3. Add executable to `skills/<name>/scripts/<name>` (if needed)
4. Add entry to `.claude-plugin/marketplace.json`
5. Validate: `claude plugin validate .`

</details>

## License

MIT
