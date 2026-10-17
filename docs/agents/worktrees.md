# Worktrees

Where a git worktree goes in this repo, and why the location is not negotiable.

## The rule

**Every worktree lives under `.worktrees/<name>/` at the root of the main
checkout.** Not `.claude/worktrees/`, not a sibling directory, not `/tmp`.

```bash
git worktree add .worktrees/<name> -b <branch>
```

One directory means one ignore entry per tool, and every tool that walks the
repository already has it:

| Tool                       | Where `.worktrees` is ignored                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| git                        | `.gitignore`                                                                                                                             |
| ESLint (`pnpm lint`)       | `ignores` in `eslint.config.js`                                                                                                          |
| Nuxt / Vite dev server     | `ignore` in `nuxt.config.ts`                                                                                                             |
| vue-tsc (`pnpm typecheck`) | Nothing to add: Nuxt's generated tsconfigs, and the test directories `nuxt.config.ts` adds to them, are all anchored paths, never `**/*` |
| Vitest (`pnpm test`)       | Nothing to add: every project's `include` is anchored to `test/<project>/`                                                               |
| lint-staged                | Nothing to add: it only sees staged files, and nothing under `.worktrees` is ever staged                                                 |

A worktree anywhere else is a full second copy of the repo that `eslint .`
would lint on the wrong branch and the Vite watcher would react to. That is
what happened with `.claude/worktrees/` before this rule existed.

## Claude Code

Claude Code's own default is `.claude/worktrees/`, and there is no setting to
change it, so `.claude/settings.json` registers a `WorktreeCreate` hook that
replaces the default. It is shared with the repo, so it applies to
`claude --worktree <name>`, the `EnterWorktree` tool, subagents with
`isolation: "worktree"` and background sessions alike.

- `.claude/hooks/worktree-create.sh` creates `.worktrees/<name>` on a
  `worktree-<name>` branch from the remote default branch, mirroring Claude
  Code's default, then runs `pnpm install --frozen-lockfile` so lint,
  typecheck and tests work immediately. Called from inside a worktree, it still
  resolves the main checkout, so worktrees never nest.
- `.claude/hooks/worktree-remove.sh` removes the worktree and its
  `worktree-<name>` branch. It refuses any path outside `.worktrees/`.

Because a `WorktreeCreate` hook replaces Claude Code's git handling entirely,
`.worktreeinclude` and the `worktree.*` settings (`baseRef`, `sparsePaths`,
`symlinkDirectories`) are not applied. If one of those is ever needed, add it
to the create script.

## Cleaning up

`git worktree list` shows what exists. Remove one with
`git worktree remove --force .worktrees/<name>` and delete its branch if it is
merged; `git worktree prune` clears entries whose directory is already gone.
