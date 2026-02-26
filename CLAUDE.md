## Important Rules You MUST Follow:

- Before leaving plan mode, **YOU MUST ALWAYS** use the `reflect` skill to ensure the plan is complete and accurate.

- When I say "lsa to" it means "launch a sub-agent to", and when I say "lpsa to" it means "launch parallel sub-agents to".
- ALWAYS use sub-agents where possible for:
  - **Parallel execution** - multiple Task calls in ONE message (concurrent but blocking)
  - **Exploration & filtering** - scout codebases, return relevant findings
  - **Focused analysis** - isolated context, synthesize in main thread
- ALWAYS use browser-qa agent for any browser-based tasks; try not to use browser automation tools directly.
- Only use `run_in_background: true` for long-running servers

## General Rules:

- Commit messages: use conventional commits format (`type: short description`). Keep body concise — one or two sentences on the _why_, not the _what_.
- Default to researching, sharing insight, and planning. Take implementation actions only when asked.
- If you start a server and hit a port conflict, check `lsof -i :<port>`—if it's a prior instance of what you're starting, kill it and retry. Clean up any servers you start before session end.
- Ignore ~/.claude/README.md (it's for the marketplace, not instructions).
- Ignore .cursor/ and .agent/ directories (cross-platform ports for Cursor IDE and Gemini CLI).
- When generating .md files, always write to a '<project-root>/.ai-reference/' folder. Never add .md files to the repo unless asked.
- If `plugins/marketplaces/agentic-coding-tools/` exists, it's likely a leftover from testing `/plugin add`. Ask if I want to remove it—this repo IS the marketplace, so that folder is a redundant nested copy.
