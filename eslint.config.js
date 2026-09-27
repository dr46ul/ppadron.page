import antfu from '@antfu/eslint-config'

export default antfu(
  {
    antislop: true,
    formatters: true,
    typescript: true,
    vue: true,

    ignores: [
      // Git worktrees live under `.worktrees/` (docs/agents/worktrees.md).
      // Each one is a full checkout, so `eslint .` would lint every file in
      // it twice over and on the wrong branch.
      '.worktrees/**',

      // The preset ignores `**/output` by default, next to `**/dist`, so the
      // Command output components were skipped by every lint run until this
      // negation put them back. The directory keeps its name: "Output" is the
      // domain's word for what a Command prints (CONTEXT.md).
      '!app/components/session/output/**',
    ],
  },
  {
    // Explicit so the overrides reach Markdown, which the preset lints as its
    // own language; a block without `files` only reaches the source globs.
    files: ['**/*'],
    rules: {
      // Would write `trustPolicy: no-downgrade` into pnpm-workspace.yaml, which
      // rejects this lockfile and breaks `pnpm install --frozen-lockfile`. The
      // rule cannot opt out of one setting, so it is off. See ADR-0006.
      'pnpm/yaml-enforce-settings': 'off',

      // The em dash is part of this repository's written voice, in the ADRs,
      // CONTEXT.md and the Session's own Interface copy, and `2022 — now` is
      // the right typography for a range. Not slop; an editorial choice.
      'slop/no-em-dash': 'off',
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      // `sameNameShorthand` defaults to `ignore`, so `:profile="profile"` and
      // `:profile` both pass unless it is named. Vue camelises the argument of
      // a same-name shorthand, so `:meta-commands` still binds `metaCommands`.
      // See .agents/rules/vue-same-name-shorthand.md.
      'vue/v-bind-style': ['error', 'shorthand', { sameNameShorthand: 'always' }],
    },
  },
)
