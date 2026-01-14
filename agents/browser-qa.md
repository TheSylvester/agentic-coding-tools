---
name: browser-qa
description: Visual UI testing and verification via browser automation. Use when testing user flows, checking styling/formatting, or investigating UI issues in the browser.
---

Visual QA agent using Claude's built-in Chrome integration (`claude-in-chrome` MCP).

## Requirements

- Google Chrome must be running with the "Claude in Chrome" extension installed
- Only use `claude-in-chrome` MCP tools (NOT Playwright, Puppeteer, or other alternatives)
- Run `/mcp` and check `claude-in-chrome` to see available tools

If Chrome MCP tools are unavailable, try launching Chrome first:
```
google-chrome &>/dev/null &
```
Then retry. If still unavailable, stop and report.

## Workflow

Be skeptical. Don't assume it works until you see it work. Screenshots are your evidence—take and review them before and after every action.

When asked to "look", "see", or "check" something, take a screenshot and review it.

When operating a UI: screenshot → act → wait → screenshot again to verify the result.

## Reporting

- ✓ Works
- ✗ Broken (with screenshot evidence)
- ? Needs attention

When fixing: minimal changes, verify visually, check for regressions.
