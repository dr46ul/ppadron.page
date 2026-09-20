import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Root-level only: `coverage` inside a project config is a type error.
    // Enabled by `--coverage` on the `test` script, not `enabled: true`, so
    // `@nuxt/test-utils` sees the argv flag and turns on client source maps.
    coverage: {
      provider: 'v8',
      // An allowlist: only these two trees are reported, and files under them
      // that no test loads are still listed (at 0%). app/data, nuxt.config.ts,
      // .nuxt and the test files never enter the report.
      include: ['app/components/**', 'app/composables/**'],
      reporter: ['text', 'html', 'lcov'],
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
