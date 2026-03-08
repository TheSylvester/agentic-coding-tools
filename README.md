# Agentic Coding Tools

A Claude Code marketplace plugin for multi-agent orchestration, prompt synthesis, and code review. Delegate complex tasks to fresh agents, run adversarial multi-vendor reviews, and automate browser-based QA — all from within Claude Code.

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
/plugin install council
```

## Core Workflows

### Agent Orchestration

Spawn, resume, and coordinate agents across vendors:

- **`super-agent`** — SDK-based Claude agent with full Task tool access; can spawn nested sub-agents
- **`council`** — Multi-agent debate orchestrator with parallel panels and Chair synthesis
- **`codex-agent`** / **`gemini-agent`** / **`cursor-agent`** — Vendor CLI wrappers with resume support

### Prompt Synthesis

Synthesize self-contained prompts so fresh agents can execute without token debt:

- `/handoff-prompt-to` — Full implementation spec for a fresh agent (auto-decomposes large tasks)
- `/pair-prompt-to` — Collaborative pair-programming spec for a new agent
- `/reflect` — Validate prompts against conversation + codebase before execution
- **`super-implement`** — Transform plans into execution-ready prompt artifacts (single, parallel, or chained)
- **`build-prompt-chain`** — Decompose monolithic prompts into phased chains with orchestration

### Code Review

From single-agent review to multi-vendor adversarial analysis:

- `/review` — Code review for uncommitted changes, staged changes, files, or PRs
- `/multi-agent-review` — Multi-vendor adversarial review with parallel agents and iterative pushback
- `/swarm-think` — Dispatch super-agent + codex-agent for adversarial analysis

### Walkthroughs & Specs

Explore code and build specs interactively:

- `/walkthrough` — Walk through code, changes, designs, or plans chunk by chunk
- `/walkthrough-review` — Generate walkthrough prompt + agent design review
- **`spec-mode`** — Interactive spec-building through conversation with a living plan file

### Browser Automation

- **`browser-qa`** agent — Visual UI testing and verification via Chrome automation
- **`ui-clone`** agent — Pixel-perfect HTML/CSS/JS website reproduction from visual observation
- **`chrome-screenshot`** — Extract and save browser screenshots from session transcripts

### Utilities

- **`read-transcript`** — Token-efficient Claude Code transcript (.jsonl) reader with budget-limited output
- **`claude-transcript`** agent — Analyze transcripts: search history, extract patterns, compare sessions
- **`save-plan`** — Save plans to `.ai-reference/` for future reference

## What's Included

### Skills

| Skill | Description |
| --- | --- |
| `super-agent` | SDK-based Claude agent with full Task tool access and nested sub-agent support |
| `council` | Multi-agent debate orchestrator with parallel panels and Chair synthesis |
| `super-implement` | Transform plans into execution-ready prompt artifacts (single, parallel, or chain) |
| `build-prompt-chain` | Decompose monolithic prompts into phased chains with orchestration |
| `spec-mode` | Interactive spec-building through conversation |
| `codex-agent` | Codex CLI wrapper for non-interactive runs with resume support |
| `gemini-agent` | Gemini CLI wrapper for non-interactive runs with resume support |
| `cursor-agent` | Cursor IDE agent wrapper for non-interactive runs with resume support |
| `chrome-screenshot` | Extract browser screenshots from session transcripts |
| `read-transcript` | Token-efficient transcript reader with budget-limited output |
| `save-plan` | Save plans to `.ai-reference/` for future reference |

### Commands

| Command | Description |
| --- | --- |
| `/handoff-prompt-to` | Synthesize implementation prompts for fresh agents |
| `/pair-prompt-to` | Create specs for pair-programming sessions |
| `/walkthrough` | Walk through code, changes, designs, or plans chunk by chunk |
| `/walkthrough-review` | Generate walkthrough prompt + agent design review |
| `/reflect` | Validate prompts against conversation + codebase |
| `/review` | Code review for uncommitted changes, staged changes, files, or PRs |
| `/multi-agent-review` | Multi-vendor adversarial review with parallel agents |
| `/swarm-think` | Dispatch super-agent + codex-agent for adversarial analysis |

### Agents

| Agent | Description |
| --- | --- |
| `browser-qa` | Visual UI testing and verification via browser automation |
| `ui-clone` | Pixel-perfect HTML/CSS/JS website reproduction |
| `claude-transcript` | Analyze Claude Code transcripts (.jsonl) |
| `walkthrough-reviewer` | Holistic design critic for walkthrough reviews |

## Cross-Platform

Same prompt synthesis commands for other AI coding assistants:

| Platform | Setup |
| --- | --- |
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
