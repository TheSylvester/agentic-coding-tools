---
argument-hint:
  [a plan, files, diff, design question, or any subject to think about]
description: "Dispatch super-agent and codex-agent to review something adversarially — skeptical sub-agents, pushback rounds, cross-agent dispute settlement"
allowed-tools: Bash, Read, Grep, Glob, Task, Skill, WebFetch
---

Think about: $ARGUMENTS

## Figure out the subject

Read, grep, diff — whatever it takes to understand what the user wants
reviewed. Could be a plan file, source files, uncommitted changes, a design
question, anything. Compose a single review/analysis prompt that gives the
agent enough context to do real work — point it at the actual files, explain
what we're looking at and why, and tell it to read the code itself.

**Do not enter plan mode. Do not pre-plan phases. Just start.**

## Dispatch both agents in parallel

Write the prompt to a temp file. Launch `super-agent` and `codex-agent` via
their skills **in the same message** using `PROMPT_FILE`:

- **super-agent**: `PROMPT_FILE=/tmp/swarm-think-prompt.md SUPER_AGENT_DEBUG=1 ~/.claude/skills/super-agent/scripts/super-agent --no-chrome` (`run_in_background`)
- **codex-agent**: `PROMPT_FILE=/tmp/swarm-think-prompt.md ~/.claude/skills/codex-agent/scripts/codex-agent` (`run_in_background`)

Both get the **identical prompt**. Both scripts save output to
`/tmp/crispy-agents/` (printed as `[output_file: ...]` on stderr).

**Reading output:** If `TaskOutput` returns empty/metadata-only or "No task
found", fall back to reading the output file directly from
`/tmp/crispy-agents/`. List the directory sorted by time to find the latest
`super-agent-*.log` and `codex-agent-*.log` files.

Capture their session IDs from the `[session_id: ...]` output.

## Skeptically verify their claims

For each claim or issue an agent raised, send a sub-agent to check it against the actual code. Be
skeptical — grep for the thing, read the file, think hard about it and ask yourself if the claim holds up.
Don't take the review agents at their word.

Launch verification sub-agents in parallel where possible.

## Push back where claims don't hold up

For anything that looks like a false positive or a stretch, **resume** the
original agent's session and push back with evidence. Tell it what you found
and ask it to look again:

- **super-agent**: `~/.claude/skills/super-agent/scripts/super-agent --resume <session-id> "pushback message"`
- **codex-agent**: `~/.claude/skills/codex-agent/scripts/codex-agent --resume <session-id> "pushback message"`

The agent should defend its position with new evidence or concede. If it
still disagrees after looking again, that's a live dispute.

## Settle disputes with the other agent

Any 2-way dispute — one agent says it's real, you (or a sub-agent) say it's
not, and the agent defended itself — put it to the **other** agent by
resuming that agent's session with the dispute context. The third perspective
settles it.

## Report and stop

Tell the user what happened:

- What was **confirmed** — real issues both agents or verification agreed on
- What was **disputed and settled** — who said what, who won, why
- What was **rejected** — false positives that didn't survive scrutiny
- Any **open questions** where you genuinely aren't sure

Then stop. The user decides what to do next — fix things, dig deeper, ignore
it, whatever. Do not auto-fix. Do not suggest next steps unprompted.
