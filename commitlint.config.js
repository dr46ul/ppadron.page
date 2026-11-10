// The human is the only author (.agents/rules/human-is-the-only-author.md):
// published history cannot be rewritten, so a trace of the agent is refused
// here rather than left to be remembered.
const AGENT_TRACE = /co-authored-by:|generated with|🤖/i

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'no-agent-trace': ({ raw }) => [
          !AGENT_TRACE.test(raw),
          'the human is the only author: no Co-Authored-By, "Generated with" or 🤖',
        ],
      },
    },
  ],
  rules: {
    'no-agent-trace': [2, 'always'],
  },
}
