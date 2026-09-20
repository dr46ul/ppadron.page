#!/usr/bin/env bash
# Claude Code WorktreeCreate hook. Every worktree goes under `.worktrees/` at
# the root of the main checkout, never `.claude/worktrees/`, so one ignore
# entry in .gitignore, eslint.config.js and nuxt.config.ts covers all of them.
# See docs/agents/worktrees.md.
#
# Reads the hook input JSON on stdin and prints the worktree path as the last
# line of stdout; everything else goes to stderr.
set -euo pipefail

input=$(cat)
name=$(jq -r '.name' <<<"$input")
cwd=$(jq -r '.cwd' <<<"$input")

if [[ -z "$name" || "$name" == "null" || "$name" == */* || "$name" == .* ]]; then
  echo "worktree-create: refusing name '$name'" >&2
  exit 1
fi

# The session may already be inside a worktree; resolve the main checkout so
# nested worktrees do not pile up.
root=$(dirname "$(git -C "$cwd" rev-parse --path-format=absolute --git-common-dir)")
path="$root/.worktrees/$name"
branch="worktree-$name"

if [[ ! -d "$path" ]]; then
  mkdir -p "$root/.worktrees"

  # Same as Claude Code's default: branch from the remote default branch,
  # falling back to HEAD when there is none.
  base=$(git -C "$root" symbolic-ref -q refs/remotes/origin/HEAD || echo HEAD)

  if git -C "$root" show-ref -q --verify "refs/heads/$branch"; then
    git -C "$root" worktree add "$path" "$branch" >&2
  else
    git -C "$root" worktree add -b "$branch" "$path" "$base" >&2
  fi

  # A worktree is a fresh checkout. `postinstall` runs `nuxt prepare`, which
  # generates the .nuxt types the typecheck and the nuxt test project need.
  if ! (cd "$path" && pnpm install --frozen-lockfile --prefer-offline >&2); then
    echo "worktree-create: pnpm install failed; run it in $path before lint, typecheck or test" >&2
  fi
fi

echo "$path"
