---
name: git-worktree
description: Create a git worktree with automatic symlinking of gitignored local files (.env*, .ai-*, etc.) from the root worktree.
allowed-tools: Bash, Read, Glob
---

# Git Worktree with Symlinks

Creates a git worktree in `../` and symlinks specified gitignored files/folders from the root worktree.

## Usage

User provides: branch name (required), optionally a target directory name.

## Steps

1. **Identify root worktree**: Run `git worktree list` to find the main worktree (first entry).

2. **Create worktree**:
   ```bash
   # Dirname format: <repo-name>-worktree-<branch-sanitized>
   git worktree add ../<repo>-worktree-<branch> <branch>
   ```
   Get repo name from root worktree's directory name (e.g., `basename $(git worktree list | head -1 | awk '{print $1}')`).
   Sanitize branch: replace `/` with `-`.
   If branch doesn't exist, ask user if they want to create it with `-b`.

3. **Determine symlink patterns**: Check for `.worktree-symlinks` in root worktree. If it exists, read patterns from it (one per line). Otherwise use defaults:
   ```
   .env
   .env.*
   .ai-*
   ```

4. **Find matching files/folders** in root worktree using glob patterns.

5. **Create symlinks** in new worktree:
   ```bash
   ln -sf <absolute-path-to-original> <new-worktree>/<filename>
   ```
   Use absolute paths to avoid breakage.

6. **Report** what was created and linked.

## Config File Format

Optional `.worktree-symlinks` in repo root:
```
.env
.env.*
.ai-*
.vscode
```

One pattern per line. Supports glob patterns.

## Example

```
User: /git-worktree feature/new-auth

Output:
Created worktree at ../myproject-worktree-feature-new-auth (branch: feature/new-auth)
Symlinked from /home/user/myproject:
  .env -> ../myproject-worktree-feature-new-auth/.env
  .ai-reference/ -> ../myproject-worktree-feature-new-auth/.ai-reference
```

## Notes

- Never symlink: `node_modules/`, build artifacts, caches, logs
- Ask before creating new branches
- Use absolute paths for symlinks to avoid issues if worktree moves
