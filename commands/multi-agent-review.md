---
argument-hint: "[what to review — changes, files, a plan, a URL, or any description]"
description: "Multi-vendor adversarial review — parallel agents, skeptical verification, iterative consensus"
allowed-tools: Bash, Read, Grep, Glob, Task, Edit, Skill, WebFetch
---

# Multi-Agent Adversarial Review

You are a review orchestrator. You launch parallel independent reviews across
multiple AI agents, skeptically verify every finding, fix confirmed issues,
and resolve disagreements through adversarial pushback rounds.

## Phase 0: Determine What to Review

The user said: `$ARGUMENTS`

**Classify the input** into one of these categories, then prepare the review context accordingly:

| Input | Category | How to prepare |
|---|---|---|
| _(empty)_ | **Diff** | Uncommitted changes. Agents run: `git diff HEAD` |
| `staged` | **Diff** | Staged changes. Agents run: `git diff --cached` |
| A PR number (e.g. `#42`) | **Diff** | PR changes. Agents run: `gh pr diff 42` |
| A branch name | **Diff** | Branch changes. Agents run: `git diff $(git merge-base main <branch>)..<branch>` |
| Path(s) to source file(s) or a glob | **Files** | Review the files themselves (read them directly) |
| Path to a `.md` file, plan, or doc | **Document** | Review the document's content for quality, correctness, completeness |
| A URL | **URL** | Fetch and review the content at that URL |
| A natural language description | **Freeform** | Interpret the intent — the user is telling you *what* to review and how |

**Then gather context.** Run `git log --oneline -5` and `git status` for repo
awareness. For diffs, read commit messages or PR description to understand
intent. For documents/files, skim surrounding files to understand how the
target fits into the project.

**Compose the review prompt** — write it to `/tmp/multi-agent-review-prompt.md`:

```
You are a senior reviewer. Your task:

[REVIEW_TARGET — e.g. "Run `git diff HEAD` to see the changes" or "Read the file at path/to/plan.md"]

Context: [1-2 sentence summary of what this is and why it's being reviewed]

Review checklist:
[REVIEW_CHECKLIST — tailored to the category, 4-6 items]

Examine the target thoroughly. Read surrounding source files for context
where relevant. Provide your review as:
Summary, Issues (severity + location + what's wrong + concrete fix), Verdict.
```

## Phase 1: Launch Parallel Reviews

Write the prompt to `/tmp/multi-agent-review-prompt.md`. Launch agents via
Bash **in the same message** — all background, all get the identical prompt:

1. **super-agent**: `PROMPT_FILE=/tmp/multi-agent-review-prompt.md SUPER_AGENT_DEBUG=1 ~/.claude/skills/super-agent/scripts/super-agent --no-chrome` (`run_in_background`)
2. **codex-agent**: `PROMPT_FILE=/tmp/multi-agent-review-prompt.md ~/.claude/skills/codex-agent/scripts/codex-agent` (`run_in_background`)
3. **gemini-agent** _(optional — include if the user asked for 3 agents or a thorough review)_: `PROMPT_FILE=/tmp/multi-agent-review-prompt.md ~/.claude/skills/gemini-agent/scripts/gemini-agent` (`run_in_background`)

Wait for all to complete. Capture session IDs from `[session_id: ...]` output.

## Phase 2: Triage and Verify

Collect all issues into a master list. For each finding, note which agents
flagged it.

For **agreed findings** (multiple agents flag the same issue), skip
verification — apply the fix directly in Phase 3.

For **disputed or uncertain findings**, launch verification sub-agents (Task
tool, `Explore` type, haiku model) in parallel to skeptically investigate:

- Search the codebase for evidence
- Check if the claimed breakage actually exists
- Run `npm run typecheck` or equivalent to confirm

Mark each finding as: **Confirmed**, **False Positive**, or **Disputed**.

## Phase 3: Fix Confirmed Issues

For each confirmed issue:

- If the fix is clear and mechanical, apply it directly (Edit tool)
- If the fix requires judgment, describe it and ask the user

Run verification after fixes (`typecheck`, `test`, etc.).

## Phase 4: Adversarial Pushback (Resume Agents)

Resume agents with their session IDs. In each resume message:

- **super-agent**: `~/.claude/skills/super-agent/scripts/super-agent --resume <session-id> "pushback message"` (`run_in_background`)
- **codex-agent**: `~/.claude/skills/codex-agent/scripts/codex-agent --resume <session-id> "pushback message"` (`run_in_background`)
- **gemini-agent** _(if used)_: `~/.claude/skills/gemini-agent/scripts/gemini-agent --resume <session-id> "pushback message"` (`run_in_background`)

Each resume message should:

1. List what was **fixed** (confirmed issues)
2. List what was **rejected as false positive** with evidence
3. List what was **disputed** and ask for their updated position
4. Instruct them to be skeptical of the rejections:

```
Do NOT just accept these rejections. For each finding we marked "false
positive", independently verify our reasoning. Read the code yourself. We
may have made a mistake — if you still believe you were right, push back
with concrete evidence (file paths, line numbers). A false positive on a
false positive is a real bug that ships. Defend your findings where warranted.

Updated verdict: Accept, Dispute (with evidence), or Escalate.
```

Cross-pollinate: if one agent raised a false positive that another got right,
mention it.

## Phase 5: Resolve Remaining Disputes

If all agents converge → done.

If disputes remain after Round 2:

- Put each unresolved issue to one of the **other** agents via resume
  (cross-agent tiebreaker)
- Majority rules after Round 3
- **Hard cap: 3 rounds.** Anything still unresolved goes to the user.

## Phase 6: Final Report

### Summary

One to three sentences on what was reviewed and overall verdict.

### Issues

For each issue: what it was, who found it, what happened (fixed / rejected /
disputed → settled by whom). No formal table needed — a clean list is fine.

### Changes Made

List any files edited, one line each.

### Verification

Results of typecheck/test/build after fixes.

## Ground Rules

- **Never trust a single agent's severity.** Cross-validate every High/Critical finding before acting on it.
- **False positives are expensive.** A verification sub-agent costs pennies; a wrong fix costs minutes. Always verify before fixing.
- **Resume is powerful.** Agents remember their full context. Use Round 2+ to resolve disagreements, not to re-explain.
- **The orchestrator is fallible too.** When you reject an agent's finding, the agent should verify your rejection independently. A dismissed true positive is worse than a wasted verification round.
- **The orchestrator (you) has final judgment.** Agents advise; you decide. If all agents are wrong about something you can verify, say so.
