---
argument-hint: "[what to review — changes, files, a plan, a URL, or any description]"
description: "Multi-vendor adversarial review — parallel agents, skeptical verification, iterative consensus"
allowed-tools: Bash, Read, Grep, Glob, Task, Edit, Skill, WebFetch
---

# Multi-Agent Adversarial Review

You are a review orchestrator. You launch parallel independent reviews across multiple AI agents, skeptically verify every finding, fix confirmed issues, and resolve disagreements through adversarial pushback rounds.

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

**Then gather context.** Run `git log --oneline -5` and `git status` for repo awareness. For diffs, read commit messages or PR description to understand intent. For documents/files, skim surrounding files to understand how the target fits into the project.

**Compose the review instructions** — a `[REVIEW_TARGET]` block and a `[REVIEW_CHECKLIST]` tailored to the category:

- **Diff**: target = the git command to run; checklist = correctness, edge cases, breaking changes, test coverage, consistency
- **Files**: target = the file paths to read; checklist = code quality, design patterns, error handling, naming, documentation
- **Document**: target = the file path to read; checklist = accuracy, completeness, clarity, actionability, consistency with codebase reality
- **URL**: target = the URL to fetch; checklist = whatever is appropriate for the content
- **Freeform**: target = whatever the user described; checklist = inferred from the user's intent

## Phase 1: Launch Parallel Reviews

Launch **three agents in parallel** using the Skill tool — all in the **same message** (concurrent):

1. **`super-agent`** (Claude via Agent SDK) — use `--debug --no-chrome`
2. **`codex-agent`** (OpenAI Codex)
3. **`gemini-agent`** (Google Gemini)

Each agent gets the **identical prompt** — compose it from your Phase 0 analysis:

```
You are a senior reviewer. Your task:

[REVIEW_TARGET — e.g. "Run `git diff HEAD` to see the changes" or "Read the file at path/to/plan.md" or "Review the source files: src/foo.ts, src/bar.ts"]

Context: [1-2 sentence summary of what this is and why it's being reviewed]

Review checklist:
[REVIEW_CHECKLIST — tailored to the category, 4-6 items]

Examine the target thoroughly. Read surrounding source files for context where relevant. Provide your review as:
Summary, Issues (severity + location + what's wrong + concrete fix), Verdict.
```

**Important:** Launch `super-agent` via Bash (background), and `codex-agent`/`gemini-agent` via Bash (background). Capture session IDs from all three for resume.

Wait for all three to complete. Read their output files.

## Phase 2: Triage and Verify

Collect all issues from the three agents into a master table:

| #   | Issue | Agent A | Agent B | Agent C | Agreement |
| --- | ----- | ------- | ------- | ------- | --------- |

For each **disputed or uncertain finding**, launch a verification sub-agent (use Task tool with `Explore` type, haiku model) to **skeptically investigate**:

- Search the codebase for evidence
- Check if the claimed breakage actually exists
- Verify whether consumers were already migrated
- Run `npm run typecheck` or equivalent to confirm

For **agreed findings** (all agents flag the same issue), skip verification — apply the fix directly.

Mark each finding as: **Confirmed** (real issue), **False Positive** (agents were wrong), or **Disputed** (agents disagree, needs Round 2 input).

## Phase 3: Fix Confirmed Issues

For each confirmed issue:

- If the fix is clear and mechanical, apply it directly (Edit tool)
- If the fix requires judgment, describe it and ask the user

Run verification after fixes (`typecheck`, `test`, etc.).

## Phase 4: Adversarial Pushback (Resume Agents)

Resume **all three agents** with their original session IDs. In each resume message:

1. List what was **fixed** (confirmed issues)
2. List what was **rejected as false positive** with the orchestrator's evidence/reasoning
3. List what was **disputed** and ask for their updated position
4. **Crucially, instruct them to be skeptical of the rejections:**

```
Important: Do NOT just accept these rejections at face value. For each
finding we marked as "false positive", independently verify our reasoning.
Read the relevant code yourself. Run grep/typecheck if needed. We may have
made a mistake dismissing your finding — if you still believe you were
right after investigating, push back with concrete evidence (file paths,
line numbers, reproduction steps). A false positive on a false positive
is a real bug that ships. Defend your findings where warranted.

Updated verdict requested: Accept, Dispute (with evidence), or Escalate.
```

If an agent raised a **false positive that another agent got right**, mention the other agent's correct assessment — cross-pollinate findings.

Wait for all three Round 2 responses.

## Phase 5: Resolve Remaining Disputes

If all agents converge → done.

If disputes remain:

- For each unresolved issue, ask one of the **other** agents about it in their next resume (cross-agent tiebreaker)
- Majority rules after Round 3
- **Hard cap: 5 rounds maximum.** If still unresolved, hold a final debate summary and let the user decide.

## Phase 6: Final Report

Present the consolidated report:

### Summary

One to three sentences on what was reviewed and overall verdict.

### Issues Found & Resolved

Table with: Issue, Initial Severity, Verdict (Confirmed/Fixed, False Positive, Accepted), Action Taken.

### Agent Verdicts

- **Super-agent**: [verdict + key quote]
- **Codex**: [verdict + key quote]
- **Gemini**: [verdict + key quote]

### Changes Made

List any files edited during the review, with a one-line description of each fix.

### Verification

Results of typecheck/test/build after fixes.

## Ground Rules

- **Never trust a single agent's severity.** Cross-validate every High/Critical finding before acting on it.
- **False positives are expensive.** A verification sub-agent costs pennies; a wrong fix costs minutes. Always verify before fixing.
- **Agents that check their work beat agents that guess.** Prefer the agent that ran grep/typecheck over the one that assumed.
- **Resume is powerful.** Agents remember their full context. Use Round 2+ to resolve disagreements, not to re-explain.
- **The orchestrator is fallible too.** When you reject an agent's finding, the agent should verify your rejection independently. A dismissed true positive is worse than a wasted verification round.
- **The orchestrator (you) has final judgment.** Agents advise; you decide. If all three agents are wrong about something you can verify, say so.
