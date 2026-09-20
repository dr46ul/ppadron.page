# AGENTS.md

Guidance for AI agents working in this repository.

## Agent skills

### Issue tracker

Issues and specs are tracked in GitHub Issues (`dr46ul/ppadron.com`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Testing

Three Vitest projects, split by directory: `test/unit` (node), `test/nuxt` (Nuxt runtime), `test/e2e` (built server). The directory decides the environment. See `docs/agents/testing.md`.
