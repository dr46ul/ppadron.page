# AGENTS.md

Guidance for AI agents working in this repository.

## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues (`dr46ul/ppadron.page`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. An issue without `ready-for-agent` is the human's to clear: say so before building it, unless they named that issue. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Coding rules

House rules the generated code has to satisfy live as one file each under `.agents/rules/`, which `.claude/rules` symlinks so Claude Code loads them. Read them before writing code.

### Testing

Test-first, always: every new component, page, composable or util starts as a failing test, and "covered" means every branch plus the edge cases, with the coverage gate as the floor (100% lines, functions, statements and branches). Three Vitest projects, split by directory: `test/unit` (node), `test/nuxt` (Nuxt runtime), `test/e2e` (built server). See `docs/agents/testing.md`.

### Worktrees

Every git worktree goes under `.worktrees/<name>/` at the repo root, never `.claude/worktrees/` or anywhere else. Claude Code is held to this by the hooks in `.claude/settings.json`. See `docs/agents/worktrees.md`.
