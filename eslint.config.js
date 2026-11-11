import antfu from '@antfu/eslint-config'

/**
 * Vue keeps template comments in development, so a comment beside the root
 * element is a second root: the component renders a fragment, attributes stop
 * falling through, and a test's `wrapper.element` is the comment rather than
 * the element. Production strips it, so only dev and the tests break.
 * `vue/no-multiple-template-root` does not count comments.
 */
const noTemplateRootComment = {
  meta: {
    type: 'problem',
    messages: { root: 'Move this comment inside the root element: beside it, Vue renders a fragment in development.' },
  },
  create(context) {
    return {
      'Program:exit': function () {
        const template = context.sourceCode.ast.templateBody
        if (!template)
          return
        const roots = template.children.filter(node => node.type === 'VElement')
        for (const comment of template.comments) {
          const inside = roots.some(root => comment.range[0] >= root.range[0] && comment.range[1] <= root.range[1])
          if (!inside)
            context.report({ loc: comment.loc, messageId: 'root' })
        }
      },
    }
  },
}

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
    // See .agents/rules/one-expect-per-test.md.
    rules: {
      'test/max-expects': [
        'error',
        { max: 1 },
      ],
    },
  },
  {
    files: ['**/*.vue'],
    plugins: {
      local: {
        rules: { 'no-template-root-comment': noTemplateRootComment },
      },
    },
    rules: {
      'local/no-template-root-comment': 'error',

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
