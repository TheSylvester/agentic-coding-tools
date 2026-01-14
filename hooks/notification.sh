#!/bin/bash
# Claude Code Notification Hook
# Provides detailed toast notifications with context

INPUT=$(cat)

NOTIFICATION_TYPE=$(echo "$INPUT" | jq -r '.notification_type // "unknown"')
MESSAGE=$(echo "$INPUT" | jq -r '.message // "Claude needs attention"')
CWD=$(echo "$INPUT" | jq -r '.cwd // ""')

# Get project name from cwd
PROJECT=""
if [ -n "$CWD" ]; then
  PROJECT=$(basename "$CWD")
fi

# Build title based on notification type
case "$NOTIFICATION_TYPE" in
  permission_prompt)
    TITLE="Claude [$PROJECT] - Permission Required"
    ;;
  idle_prompt)
    TITLE="Claude [$PROJECT] - Waiting for Input"
    MESSAGE="Claude has been idle and is waiting for your response"
    ;;
  auth_success)
    TITLE="Claude - Authenticated"
    ;;
  elicitation_dialog)
    TITLE="Claude [$PROJECT] - Input Needed"
    ;;
  *)
    TITLE="Claude [$PROJECT]"
    ;;
esac

wsl-notify-send.exe --category "$TITLE" "$MESSAGE"
exit 0
