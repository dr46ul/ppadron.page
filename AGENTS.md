# AGENTS.md

Guidance for AI agents working in this repository.

## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues (`dr46ul/ppadron.page`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Testing

Three Vitest projects, split by directory: `test/unit` (node), `test/nuxt` (Nuxt runtime), `test/e2e` (built server). The directory decides the environment. See `docs/agents/testing.md`.

### Worktrees

Every git worktree goes under `.worktrees/<name>/` at the repo root, never `.claude/worktrees/` or anywhere else. Claude Code is held to this by the hooks in `.claude/settings.json`. See `docs/agents/worktrees.md`.
