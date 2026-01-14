#!/bin/bash
# Claude Code Stop Hook
# Provides detailed completion notification with task summary

INPUT=$(cat)

# Prevent infinite loops
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""')
CWD=$(echo "$INPUT" | jq -r '.cwd // ""')

# Get project name
PROJECT=""
if [ -n "$CWD" ]; then
  PROJECT=$(basename "$CWD")
fi

# Extract summary from transcript
SUMMARY=""
if [ -f "$TRANSCRIPT_PATH" ]; then
  # Get the last user prompt as summary (first 200 chars)
  # Content can be either a string or an array of objects
  SUMMARY=$(tail -100 "$TRANSCRIPT_PATH" 2>/dev/null | \
    jq -r 'select(.type=="user") | .message.content |
           if type == "string" then .
           elif type == "array" then (.[] | select(.type=="text") | .text)
           else "" end' 2>/dev/null | \
    grep -v "^$" | \
    tail -1 | \
    head -c 200 | \
    tr '\n' ' ')
fi

# Fallback message if no summary found
if [ -z "$SUMMARY" ]; then
  SUMMARY="Task completed successfully"
fi

TITLE="Claude [$PROJECT] - Complete"
wsl-notify-send.exe --category "$TITLE" "$SUMMARY"
exit 0
