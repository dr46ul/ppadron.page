import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Root-level only: `coverage` inside a project config is a type error.
    // Enabled by `--coverage` on the `test` script, not `enabled: true`, so
    // `@nuxt/test-utils` sees the argv flag and turns on client source maps.
    coverage: {
      provider: 'v8',
      // An allowlist: only these trees are reported, and files under them that
      // no test loads are still listed (at 0%). app/data, nuxt.config.ts,
      // .nuxt and the test files never enter the report. `server/api/**` is
      // outside it deliberately — see docs/agents/testing.md.
      include: [
        'app/components/**',
        'app/composables/**',
        'app/utils/**',
        'server/utils/**',
        'shared/**',
      ],
      reporter: ['text', 'html', 'lcov'],
      // The gate. `pnpm test` fails below these, and CI runs `pnpm test`.
      thresholds: {
        statements: 100,
        functions: 100,
        lines: 100,
        // Negative is a maximum uncovered *count*, not a percentage. The four
        // are auto-import artefacts in Terminal.vue that no test can reach; a
        // count cannot drift as the tree grows, so a fifth fails the run. Cover
        // it, don't raise this. See docs/agents/testing.md.
        branches: -4,
      },
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['test/e2e/**/*.{test,spec}.ts'],
          environment: 'node',
          testTimeout: 120_000,
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
})
