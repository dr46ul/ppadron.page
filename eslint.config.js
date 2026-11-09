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

      // The preset ignores `**/output` by default, next to `**/dist`, which
      // takes the Command output components and their tests with it. The
      // directories keep their name: "Output" is the domain's word for what a
      // Command prints (CONTEXT.md).
      '!app/components/session/output/**',
      '!test/nuxt/session/output/**',
    ],
  },
  {
    // Explicit so the overrides reach Markdown, which the preset lints as its
    // own language; a block without `files` only reaches the source globs.
    files: ['**/*'],
    rules: {
      // `eslint --fix` would write the preset's settings into
      // pnpm-workspace.yaml, so a preset upgrade could change install policy
      // unreviewed. The rule cannot opt out of one setting. See ADR-0006.
      'pnpm/yaml-enforce-settings': 'off',

      // The em dash is part of this repository's written voice, in the ADRs,
      // CONTEXT.md and the Session's own Interface copy, and `2022 — now` is
      // the right typography for a range. Not slop; an editorial choice.
      'slop/no-em-dash': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.vue'],
    // A code block in Markdown is linted as a virtual `<file>.md/<n>.ts`, and
    // the rule's own document has to be able to show the cast it forbids.
    ignores: ['**/*.md/**'],
    rules: {
      // `as const` is not a cast and stays allowed. See
      // .agents/rules/no-type-assertions.md.
      'ts/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
    },
  },
  {
    files: ['test/**/*.ts'],
    // These predate the rule. Each comes off the list once its tests have one
    // `expect` each, and none is ever added. See
    // .agents/rules/one-expect-per-test.md.
    ignores: [
      'test/nuxt/session/output/background.test.ts',
      'test/nuxt/session/output/colophon.test.ts',
      'test/nuxt/session/output/contact.test.ts',
      'test/nuxt/session/output/experience.test.ts',
      'test/nuxt/session/output/help.test.ts',
      'test/nuxt/session/output/recommendations.test.ts',
      'test/nuxt/session/output/role-detail.test.ts',
      'test/nuxt/session/output/unknown.test.ts',
      'test/nuxt/session/output/whoami.test.ts',
      'test/nuxt/session/prompt-bar.test.ts',
      'test/nuxt/session/terminal.test.ts',
      'test/nuxt/session/use-enquiry.test.ts',
      'test/nuxt/session/use-session.test.ts',
      'test/nuxt/use-date-context.test.ts',
      'test/nuxt/use-theme.test.ts',
      'test/unit/server/send-enquiry.test.ts',
      'test/unit/shared/enquiry.test.ts',
      'test/unit/text-control-focus.test.ts',
      'test/unit/theme-tokens.test.ts',
      'test/unit/utils/date-format.test.ts',
    ],
    rules: {
      'test/max-expects': [
        'error',
        { max: 1 },
      ],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      // `sameNameShorthand` defaults to `ignore`, so `:profile="profile"` and
      // `:profile` both pass unless it is named. Vue camelises the argument of
      // a same-name shorthand, so `:meta-commands` still binds `metaCommands`.
      // See .agents/rules/vue-same-name-shorthand.md.
      'vue/v-bind-style': [
        'error',
        'shorthand',
        { sameNameShorthand: 'always' },
      ],
    },
  },
)
