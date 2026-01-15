---
name: chrome-screenshot
description: Extract and save browser screenshots from session transcripts
allowed-tools: Bash, Read
---

# chrome-screenshot

Extract browser screenshots from Claude Code transcripts by their `ss_*` ID.

Screenshot IDs are returned when you take screenshots with claude-in-chrome tools. These images are stored in the session transcript and can be retrieved later.

## Usage

```bash
chrome-screenshot                              # List all screenshot IDs
chrome-screenshot ss_abc123                    # Extract to stdout
chrome-screenshot ss_abc123 file.jpg           # Save to file
chrome-screenshot ss_abc123 file.jpg <session> # From specific session
```

## Save & View Pattern

```bash
# Save screenshot to file
chrome-screenshot ss_3669oma6t .ai-reference/screenshots/homepage.jpg

# Then Read it to view
Read .ai-reference/screenshots/homepage.jpg
```

## Side-by-Side Comparison

Save multiple screenshots, then Read them together:

```bash
chrome-screenshot ss_abc123 .ai-reference/screenshots/before.jpg
chrome-screenshot ss_def456 .ai-reference/screenshots/after.jpg
```

```
Read .ai-reference/screenshots/before.jpg
Read .ai-reference/screenshots/after.jpg
```

Claude sees both images for visual comparison.

## Why This Matters

- Screenshot IDs persist in the session transcript
- You can retrieve any screenshot taken during the session
- Useful for comparing UI states, documenting bugs, creating evidence trails
