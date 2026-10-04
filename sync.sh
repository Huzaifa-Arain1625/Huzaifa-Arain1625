#!/usr/bin/env bash
# sync.sh — commit pending changes and push to BOTH repos in one command.
#
# Usage (from Git Bash / any bash terminal, inside this folder):
#   ./sync.sh                     commit with the default message, then push both remotes
#   ./sync.sh "your message"      commit with your message, then push both remotes
#   ./sync.sh --push-only         skip committing, just push both remotes
set -euo pipefail
cd "$(dirname "$0")"

MODE="commit"
MSG="Update profile README"
if [ "${1:-}" = "--push-only" ]; then
  MODE="push"
elif [ -n "${1:-}" ]; then
  MSG="$1"
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
FAILED=0

if [ "$MODE" = "commit" ]; then
  # Stage all changes; .freebuff/ is protected by .gitignore so it never gets added.
  git add -A
  if git diff --cached --quiet; then
    echo "• No pending changes to commit."
  else
    git commit -m "$MSG"
    echo "• Committed: $(git log -1 --oneline)"
  fi
fi

for REMOTE in origin profile; do
  if git push "$REMOTE" "$BRANCH"; then
    echo "• $REMOTE  OK"
  else
    echo "✗ $REMOTE  PUSH FAILED"
    FAILED=1
  fi
done

if [ "$FAILED" -ne 0 ]; then
  echo "Done with errors — one or more remotes failed."
  exit 1
fi
echo "✓ Both repos in sync at $(git rev-parse --short HEAD):"
echo "    origin : $(git rev-parse --short origin/"$BRANCH")"
echo "    profile: $(git rev-parse --short profile/"$BRANCH")"
