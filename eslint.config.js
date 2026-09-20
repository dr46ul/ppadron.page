import antfu from '@antfu/eslint-config'

export default antfu(
  {
    formatters: true,
    typescript: true,
    vue: true,
  },
  {
    rules: {
      // Enforces a fixed set of pnpm-workspace.yaml settings, one of which is
      // `trustPolicy: no-downgrade`. That setting rejects this lockfile —
      // chokidar@4.0.3 and semver@6.3.1 are the last versions of their major
      // lines and carry no npm attestation, which the policy reads as a
      // downgrade — so `pnpm install --frozen-lockfile` fails outright, both
      // locally and in CI. The rule offers no way to opt out of a single
      // setting. Supply-chain enforcement is worth having, but as a deliberate
      // change with a lockfile audit behind it, not as a lint autofix.
      'pnpm/yaml-enforce-settings': 'off',
    },
  },
)
