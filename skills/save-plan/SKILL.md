---
description: Use ONLY when user explicitly mentions saving plan to ".ai-reference" or "ai-reference" or "for reference". Phrases like "save this plan to ai-reference", "save plan for reference", "archive this plan". Do NOT use for generic "save this plan" requests.
user_invocable: true
---

# Save Plan

Save the current session's plan file to the project's `.ai-reference/plans/` folder for editing and reuse.

## Instructions

1. **Find the current plan file** - Look in the conversation context for references to a plan file path (typically `/home/silver/.claude/plans/<plan-name>.md`)

2. **Ask for a name** if not provided in arguments:
   - Use AskUserQuestion to get a short, descriptive kebab-case name
   - Example: "fix-fork-conversation", "add-dark-mode", "refactor-auth"

3. **Create the plans directory** (force create):
   ```bash
   mkdir -p .ai-reference/plans
   ```

4. **Copy the plan** with ✨ prefix:
   ```bash
   cp "<plan-file-path>" ".ai-reference/plans/✨-<name>.md"
   ```

5. **Report the result** - Tell the user the file location so they can edit it

## Arguments

Optional: The descriptive name for the plan (kebab-case, no extension)

Example: `/save-plan fix-fork-conversation`

## Notes

- If no plan file exists in the current session, inform the user
- The ✨ emoji prefix makes plan files easy to spot
- Plans are saved as-is; user can edit after saving
