#!/usr/bin/env bash
# Claude Code WorktreeRemove hook, the counterpart of worktree-create.sh.
# Removes the worktree and the `worktree-<name>` branch created with it,
# which is what Claude Code does for the worktrees it creates itself.
# See docs/agents/worktrees.md.
set -euo pipefail

input=$(cat)
path=$(jq -r '.worktree_path' <<<"$input")

[[ -d "$path" ]] || exit 0

root=$(dirname "$(git -C "$path" rev-parse --path-format=absolute --git-common-dir)")

case "$path" in
  "$root/.worktrees/"*) ;;
  *)
    echo "worktree-remove: $path is not under $root/.worktrees/, leaving it alone" >&2
    exit 1
    ;;
esac

name=$(basename "$path")
git -C "$root" worktree remove --force "$path" >&2
git -C "$root" branch -q -D "worktree-$name" 2>/dev/null || true
