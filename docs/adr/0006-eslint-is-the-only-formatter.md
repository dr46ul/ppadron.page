# ESLint is the only formatter

Formatting belongs to ESLint, through `@antfu/eslint-config` with
`formatters: true`. Do not add Prettier back as a separate step — not as a
`format` script, not as a `lint-staged` task, not as an editor "format on save"
pointed at a `.prettierrc`. It has been tried and it does not converge.

The repository ran both at once. `eslint.config.js` declared `formatters: true`,
which hands formatting to ESLint, while a standalone Prettier with its own
`.prettierrc.json` formatted the same files to different rules. They disagree
about arrow parentheses, object key quoting, operator line breaks, and Vue tag
layout, among others.

**There is no ordering that settles it.** `lint-staged` ran `eslint --fix` and
then `prettier --write`, so Prettier had the last word on every staged file and
`pnpm lint` was left reporting 54 errors and 9 warnings — none of which were
real defects. Running `eslint --fix` across the repository cleared all 63
problems, after which Prettier called 10 files misformatted; formatting those
the Prettier way puts the ESLint errors straight back. Each tool undoes the
other, forever.

**The consequence was a gate nobody could pass.** `pnpm lint` had never once
exited zero. A check that is always red is a check nobody reads, which is how it
went unnoticed that it was red for purely cosmetic reasons — and it would have
made the new CI workflow fail on its first run for no real cause.

**Why ESLint won rather than Prettier.** The config already declared it: keeping
Prettier would have meant switching `formatters` off and adding
`eslint-config-prettier` to suppress the stylistic rules, which is more moving
parts to hold in sync, not fewer. `@antfu/eslint-config` is also explicit that
it is not meant to run alongside Prettier.

**Prettier has not actually left.** `eslint-plugin-format` depends on it and
still formats CSS, HTML and Markdown through it, so the output for those files
is substantially what it was. What went is the second, competing entry point:
the `format` and `format:check` scripts, `.prettierrc.json`, `.prettierignore`,
the direct devDependency, and the `lint-staged` step.

**This makes ESLint the authority on formatting, not on everything.** The same
config carries a `pnpm/yaml-enforce-settings` rule that writes settings into
`pnpm-workspace.yaml`, one of which — `trustPolicy: no-downgrade` — rejects this
lockfile and breaks `pnpm install --frozen-lockfile` outright, locally and in
CI. The two entries it flags, `chokidar@4.0.3` and `semver@6.3.1`, are the last
versions of their major lines and carry no npm attestation, which the policy
reads as a downgrade. The rule has no way to opt out of one setting, so it is
off. Supply-chain enforcement is worth having; it is a deliberate change with a
lockfile audit behind it, not a side effect of `eslint --fix`. `shellEmulator`,
which arrived the same way, was kept on its own merits.

**A file that still looks Prettier-shaped was probably never linted.** The
preset ships a default ignore list that includes `**/output`, which matched
`app/components/session/output/` and kept the Command output components out of
every lint and fix run; the split end-tags Prettier had left there survived
ADR-0006 for that reason alone. `eslint.config.js` negates that entry. If
another directory ever shows the same symptom, check the preset's ignores
before touching a rule.

Use `pnpm lint:fix`. There is no `pnpm format`.
