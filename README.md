# Agentic Coding Tools

Five [Agent Skills](https://agentskills.io) for Claude Code, for delegating
work to fresh agents and reviewing it across two vendors.

They are the skills I actually use every day, not a catalogue. Each one is a
plain `SKILL.md`; the two agent wrappers add a single zero-dependency Node
script each.

## Install

```bash
npx github:TheSylvester/agentic-coding-tools
```

That copies every skill into `~/.claude/skills/`. Restart Claude Code
afterwards to pick them up.

Pick and choose, or install somewhere else:

```bash
npx github:TheSylvester/agentic-coding-tools --list          # see what's on offer
npx github:TheSylvester/agentic-coding-tools handoff          # just one
npx github:TheSylvester/agentic-coding-tools --project        # into ./.claude/skills
npx github:TheSylvester/agentic-coding-tools --dir <path>     # anywhere
npx github:TheSylvester/agentic-coding-tools --force          # overwrite existing
npx github:TheSylvester/agentic-coding-tools --dry-run        # change nothing
```

Prefer to do it by hand? Copy any folder from `skills/` into
`~/.claude/skills/` and you are done — the documented commands already assume
that location. The installer only exists to get the paths right when you
install somewhere else, or on Windows where `~` does not expand outside a
POSIX shell.

The layout is also compatible with Vercel's generic skills installer, if that
is already part of your workflow:

```bash
npx skills@latest add TheSylvester/agentic-coding-tools
```

Use one route, not several — installing twice leaves you with duplicate skills.

## The skills

| Skill | What it does | Needs |
| --- | --- | --- |
| **`handoff`** | Turns the current conversation into self-contained implementation prompt(s) for an agent with an empty context window. Decomposes into a phased chain or a parallel set when the task is too big for one. | nothing (a phased chain can drive `claude-agent`) |
| **`fusionthink`** | Multi-vendor adversarial review. Sends one identical brief to a Claude reviewer and a Codex reviewer, verifies every claim against the real code, pushes back on weak findings, and makes each vendor settle the other's disputes. Can loop fix-and-re-review until both agree. | `claude-agent` + `codex-agent`, both CLIs |
| **`claude-agent`** | Runs the Claude Code CLI non-interactively as a child agent. Prompt via args, file or stdin; true session resume; opt-in liveness monitor. | Node 18+, `claude` |
| **`codex-agent`** | Runs the OpenAI Codex CLI non-interactively as a child agent. Same contract as `claude-agent`, so both can be handed the same brief. | Node 18+, `codex` |
| **`point-by-point`** | Makes the assistant explain something one point at a time and stop after each for questions. | nothing |

`handoff` and `point-by-point` are pure prose — they work in any agent that
reads `SKILL.md`. The other three shell out to vendor CLIs.

## Vendor CLIs

Only needed for `claude-agent`, `codex-agent` and `fusionthink`:

```bash
npm install -g @anthropic-ai/claude-code    # for claude-agent
npm install -g @openai/codex && codex login # for codex-agent
```

## Safety

`claude-agent` and `codex-agent` launch **autonomous agents with permission
prompts and sandboxing disabled** — `bypassPermissions` and
`--dangerously-bypass-approvals-and-sandbox` respectively. A non-interactive
run has nobody available to approve anything, so this is what makes them
useful, and it is also what makes them dangerous. The child agent can read,
write and execute in whatever directory you launch it from.

Only hand these wrappers briefs you would be willing to run yourself.
`claude-agent` honors `CLAUDE_PERMISSION_MODE` if you want something stricter.

`fusionthink` launches both of them, unattended, in the background.

## Platform support

Linux, macOS, WSL, and Windows — including native PowerShell and cmd. The two
wrappers are Node scripts with no dependencies beyond Node 18+, so there is no
requirement for bash, `jq`, `python3`, `uuidgen`, GNU `grep -P` or GNU
`sort -V`. Every prompt reaches the child CLI on stdin rather than through
argv, which keeps briefs byte-exact past the ~128KB argument-length limit and
avoids platform command-line quoting entirely.

Two things to know on Windows:

- The `VAR=value command` prefix used in the examples is POSIX shell syntax.
  In PowerShell, set `$env:PROMPT_FILE="task.md"` on its own line first.
- `fusionthink` orchestrates through your agent's shell, so it wants a POSIX
  shell (WSL or Git Bash). The wrappers it calls do not.

## Run logs

Each wrapper run writes its clean reply and session id to a log file and prints
the path to stderr as `[output_file: ...]`. Read the path that was printed
rather than globbing for the newest file — parallel runs share the directory.
Override the location with `AGENT_LOG_DIR`.

## License

MIT — see [LICENSE](LICENSE).
