# Agentic Coding Tools

A Claude Code plugin marketplace for sub-agent orchestration, prompt synthesis, and browser automation.

## Installation

```bash
/plugin marketplace add TheSylvester/agentic-coding-tools
/plugin install agentic-coding-tools
```

## What's Included

### Skills (Sub-agent Wrappers)

| Skill | Description |
|-------|-------------|
| `super-agent` | SDK-based Claude agent with full Task tool access. Use for executing handoff prompts or spawning nested sub-agents. |
| `cursor-agent` | Wrapper around cursor-agent CLI for non-interactive runs with resume support. |
| `gemini-agent` | Wrapper around gemini CLI for non-interactive runs. |
| `build-prompt-chain` | Transform monolithic prompts into phased chains for sustained-context execution. |
| `read-transcript` | Read Claude Code .jsonl transcripts in a token-efficient format. |

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

## Key Workflows

### Handoff Pattern
Use `/handoff-prompt-to` to synthesize a prompt, then `/super-agent` to execute it in a fresh context.

### Phased Execution
Use `/build-prompt-chain` to decompose large tasks into phases, then execute each phase with `/super-agent`.

### UI Work
Use `browser-qa` for testing flows and `ui-clone` for reproducing designs.

## License

MIT
