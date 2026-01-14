---
argument-hint: (optional) [topic, plan, or path to review]
description: Reflect on conversation + codebase to ensure prompts capture everything before execution
---

**Reflect** on:

- The discussion so far, and any details/decisions relevant to: $ARGUMENTS
- The artifacts/prompt files/plans we most recently produced
- The actual codebase versus those artifacts/plans, to confirm they will succeed

This is your last chance to catch gaps before a fresh agent executes these tasks with no memory of our discussion. Your goal is to ensure the implementation planned will succeed by providing the best, most accurate context and instructions possible.

Make any refinements to ensure:

- [ ] All design decisions from our conversation are documented
- [ ] Rationale is included (not just "what" but "why")
- [ ] Trade-offs we discussed are noted
- [ ] Domain knowledge I explained is included
- [ ] Edge cases we identified are listed
- [ ] Constraints and preferences are captured
- [ ] Task boundaries match what we agreed
- [ ] Nothing we discussed is missing from the artifacts/plans
- [ ] No scope creep beyond what we decided
- [ ] All referenced files exist at the stated paths
- [ ] File paths haven't been renamed or moved
- [ ] Line number references are still accurate
- [ ] Verify the code actually exists as described
- [ ] Verify the described behavior is accurate
- [ ] Verify types/interfaces match what's stated
- [ ] Commands are correct for this project
- [ ] Test file paths are accurate
- [ ] Interface definitions are IDENTICAL across all task files
- [ ] Prerequisites in each task match what prior tasks deliver
- [ ] Index dependency graph matches task file prerequisites
- [ ] No conflicts between what tasks produce vs consume

---

Directly update the artifacts, prompt files, and/or other plan file in question with the refinements required.
