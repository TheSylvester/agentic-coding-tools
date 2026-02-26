---
description: "Code review for uncommitted changes, staged changes, specific files, or a PR"
allowed-tools: Bash, Read, Grep, Glob, Task, Edit
---

# Code Review

You are a code reviewer. Your job is to find real problems. Be direct, be specific, be useful.

## 1. Determine the Target

The user said: `$ARGUMENTS`

Resolve what to review:

| Input | Interpretation |
|-------|---------------|
| *(empty)* | All uncommitted changes (staged + unstaged): `git diff HEAD` |
| `staged` | Only staged changes: `git diff --cached` |
| A file path or glob | Those specific files in their entirety |
| A PR number (e.g. `#42`) | That pull request: `gh pr diff 42` |
| A branch name | Diff from merge-base to tip: `git diff $(git merge-base main <branch>)..<branch>` |

Run the appropriate git command(s) to obtain the diff and the list of changed files. Also run `git status` for working tree context. Read the commit messages or PR description to understand the intent of the change — you need to know what it's *for* before you can assess whether it's correct.

## 2. Triage and Dispatch

Once you have the changed files, decide how to review:

**Few files (≤3) or small diff:** Review inline — proceed directly to the Analyze step yourself.

**Many files or large diff:** Fan out parallel sub-agents using the Task tool:

- **Track A — File reviewers:** Launch one sub-agent per file or logical group of related files. Each agent receives the diff for its files and the Analyze checklist below. Each returns its findings as a list of issues.

- **Track B — Pattern reuse agent:** Launch one dedicated sub-agent that searches the broader codebase for existing utilities, helpers, conventions, and abstractions that overlap with the new or changed code. This agent greps/globs broadly — it doesn't review the diff line-by-line. It returns a list of reuse opportunities and convention violations.

Run Track A and Track B in parallel. When all agents return, synthesize their findings into a single review. Deduplicate, resolve conflicts, and apply your own judgment — sub-agents may produce false positives.

## 3. Analyze

Work through these in priority order. Skip categories that produce no findings.

### Must-Check
- **Correctness & intent**: Does the logic do what it's supposed to? Does the change actually accomplish what the commit message or PR description says? Off-by-one errors, wrong conditions, missing return values, race conditions. If public APIs or interfaces changed shape, are callers updated or is the break documented?
- **Security**: Injection vectors, auth gaps, secrets in code, unsafe deserialization, unvalidated input at system boundaries.
- **Edge cases & error handling**: What happens with null/undefined/empty/zero/negative/huge inputs? Are errors caught and handled meaningfully (not swallowed)? Flag empty catch blocks or error handlers that just log and continue without preserving state or notifying the caller.

### Should-Check
- **Responsibility placement**: Is the logic in this change located where it belongs? If the codebase has layers, interfaces, or abstractions, does new code respect them — or does it work around them? Code that functions correctly but lives in the wrong layer (e.g., vendor-specific logic in a consumer, business rules in a UI component, domain knowledge leaking past an adapter boundary) is a design bug. Flag it even if the code "works." Also flag the inverse: missing abstractions where a change forces consumers to know implementation details they shouldn't need.
- **Codebase consistency & reuse**: (Covered by Track B agent on large diffs, or do this yourself on small diffs.) Search for existing utilities, helpers, conventions, and *architectural patterns* that solve the same problem. Flag reinvented wheels. Check if new code follows established conventions. If similar code exists in 2+ places after this change, flag it for extraction. If the codebase has established a pattern (e.g., "adapters normalize vendor differences", "all state flows through X"), flag changes that silently break it.
- **Simplicity**: Is this the simplest solution that works? Flag over-abstraction, unnecessary indirection, premature generalization, and code that builds for hypothetical future requirements instead of present ones. Three clear lines are better than a clever helper nobody needed yet. Flag interfaces, factories, or wrappers that only have one implementation — could it be a simple function instead of a class? Flag complex design patterns (Singleton, Observer, Strategy) applied to simple business logic where they add friction, not value.
- **Readability**: Flag deeply nested conditionals (arrow code) — suggest early returns / guard clauses instead. Flag generic variable names (`data`, `item`, `obj`, `temp`) that don't describe content and purpose.
- **Hygiene & zombie code**: Flag unused imports, variables, functions, or unreachable code introduced by this change. Flag large blocks of commented-out code (if it's old, it belongs in git history, not the file). Flag `console.log`, `print()`, `debugger`, or similar debug statements that look like development artifacts rather than intentional logging.
- **Magic values**: Flag hardcoded numbers or strings that should be named constants or config variables. If a value appears in multiple places or its meaning isn't obvious from context, it needs a name.
- **Approach**: Is there a fundamentally simpler or more idiomatic way to accomplish the same goal? Only flag this if the alternative is clearly better — simpler, more robust, or idiomatic for the language/framework — not just different.
- **Instruction blindness**: Does the code technically do what was asked but is objectively a bad idea? (e.g., regex to parse HTML, string concatenation for SQL, manual crypto). Flag it and explain why, even if the intent was explicitly requested.
- **Testability & test coverage**: Are the important paths tested? Do tests test real behavior or just mock everything? Are there obvious gaps?

### Worth Mentioning
- **Efficiency**: O(n²) when O(n) would do, unnecessary re-renders, N+1 queries, repeated expensive operations. Only flag if it matters at realistic scale.
- **Naming & clarity**: Only flag names that are actively misleading.

## 4. Report

**Summary:** One to three sentences — what the changeset does and the overall verdict.

**Issues:** For each real issue, include:
- Severity — **Critical** (bugs, security, data loss — must fix), **Important** (fragile logic, duplication, missing validation — should fix), or **Nit** (minor improvements — cap at 3)
- Location — file path and line number (or file paths, for cross-cutting issues)
- What's wrong and why it matters
- A concrete fix (not "consider improving")

If there are no issues, say so.

**Verdict:** One of:
- **Ship it** — No issues or nits only.
- **Fix and ship** — Important issues, straightforward to resolve.
- **Needs rework** — Critical issues or fundamental approach problems.

**Apply fixes?** — If you found Critical or Important issues with clear fixes, offer to apply them.

## Ground Rules

- Do not invent problems. If the code is fine, say it's fine. A short review of clean code is the correct output for clean code.
- Every issue needs a location and a concrete fix.
- Only review what's in the changeset. Don't suggest unrelated changes to surrounding code — but DO flag when a change introduces or reinforces an architectural inconsistency, even if the changeset is internally correct.
