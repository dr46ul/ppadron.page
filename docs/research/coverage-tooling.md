# Coverage tooling for the multi-project Vitest suite

Research for issue #10 (part of map #9). Question: how is coverage collected
and gated at 100% in this repo's shape — Vitest 4 with three `projects`
(`unit`, `e2e`, `nuxt`), the `nuxt` one built with `defineVitestProject` from
`@nuxt/test-utils/config`, components mounted with `mountSuspended` under
`environment: 'nuxt'`?

Investigated on 2026-09-20 against the versions the lockfile installs:

| Package               | Version                                 |
| --------------------- | --------------------------------------- |
| `vitest`              | 4.1.11                                  |
| `@nuxt/test-utils`    | 4.1.0                                   |
| `nuxt`                | 4.5.2                                   |
| `@vitest/coverage-v8` | 4.1.11 (trialled, not yet a dependency) |

## Summary

- **Provider: `v8`** (`@vitest/coverage-v8`, pinned to the `vitest` version).
  It attributes lines, branches and functions to `.vue` SFCs and
  `app/composables/*.ts` correctly when they run inside the `nuxt` environment,
  auto-imports and all. Istanbul also works and produced byte-identical numbers
  in this repo; v8 is Vitest's recommended default and needs no instrumentation
  step, so there is no reason to pay for Istanbul.
- **Config lives at the root `test.coverage` only.** `coverage` is a
  root-level option in Vitest 4; it is typed out of project configs and the
  docs say "coverage is done for the whole process".
- **Thresholds go in the same block**, all four metrics at 100; a miss makes
  `vitest run` exit `1`, which fails the `pnpm test` step in CI with no extra
  wiring.
- **The `e2e` project needs no exclusion.** `coverage.include` already limits
  the report to `app/components/**` and `app/composables/**`, and the e2e
  worker never loads app code (it talks to a built server in another process),
  so it contributes 0% — neither noise nor credit.
- **Nothing special for GitHub Actions**, beyond gitignoring `coverage/`.
- **Two traps found while running it**, both documented below: coverage must
  run with the `nuxt` project in the run (untested `.vue` files are silently
  dropped otherwise), and Vitest hides fully-covered rows from the `text` table
  when it detects an AI-agent shell.

## 1. Does `@vitest/coverage-v8` attribute `.vue` and composables correctly under the Nuxt environment?

**Yes, verified by running.** With `coverage.include` set to the two app
directories and all three projects running, the report listed all 13 SFCs under
`app/components/**` plus `app/composables/useSession.ts` (14 files, 178
statements, 161 branches, 54 functions). Spot checks of the reported uncovered
lines against the source:

- `Terminal.vue` line 56 is the body of `focusPrompt()` and line 197 the
  `@keydown.down` handler `recall(-1)` — both real, both plausibly unexercised.
- `useSession.ts` lines 264–276 are the body of `send()` and line 313 is the
  `throw` in `injectSession()`.
- `Help.vue` lines 5–16 are the two `v-for` blocks in the template, reported as
  uncovered _branches_ — template control flow is mapped back to the template.

`Terminal.vue` has **no explicit imports at all**: `provideSession`, `ref` and
the `SessionOutput*` components are injected by Nuxt's `nuxt:imports-transform`
and `nuxt:components-loader` plugins. Its lines still map exactly, so in this
repo's shape the auto-import / `#imports` transforms do not break the source
maps.

Why that holds, from the source (read, not just observed):

- Vitest ≥ 3.2 remaps V8 coverage with an AST-aware algorithm that "produces
  identical coverage reports to Istanbul"
  ([coverage guide, v4.1.11](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/guide/coverage.md#v8-provider)).
  Vitest 4 removed the older `v8-to-istanbul` path entirely
  ([migration guide](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/guide/migration.md#v8-code-coverage-major-changes)).
- Coverage remapping reuses the Vite transform result's source map per
  project and per Vite environment
  (`node_modules/@vitest/coverage-v8/dist/provider.js`, `convertCoverage`,
  "Source maps can change based on projectName and transform mode"). The `nuxt`
  environment declares `viteEnvironment: "client"`
  (`node_modules/@nuxt/test-utils/dist/vitest-environment.mjs`), so tested
  files are remapped through the Nuxt client pipeline that compiled them.
- Nuxt's `nuxt:imports-transform` emits a map when
  `sourcemap.server || sourcemap.client` is true
  (`node_modules/nuxt/dist/index.mjs`, `TransformPlugin({ ..., sourcemap: !!nuxt.options.sourcemap.server || !!nuxt.options.sourcemap.client })`);
  `sourcemap.server` defaults to `true` in `@nuxt/schema` 4.5.2, so the map is
  always there. `nuxt:components-loader` in 4.5.2 returns through
  `rolldown-string`'s `generateTransform`, which always attaches a map.
- Historical trap, fixed upstream: with older Nuxt the components loader
  skipped its map unless `sourcemap.client` was on, shifting every line by the
  number of prepended imports and producing phantom branches
  ([nuxt/test-utils#1655](https://github.com/nuxt/test-utils/issues/1655)).
  `@nuxt/test-utils` ≥ the fix in
  [PR #1674](https://github.com/nuxt/test-utils/pull/1674) (in 4.1.0) now
  forces `sourcemap.client = true` when coverage is on — **but** its detection
  (`isCoverageEnabled` in `dist/config.mjs`) only looks at the config object
  passed to `defineVitestProject` and at `--coverage` on `process.argv`. A
  root-level `coverage.enabled: true` is invisible to it. The recommendation
  below therefore enables coverage with the CLI flag, which also trips this
  guard, rather than with `enabled: true` in the root config. (In this repo the
  two forms produced identical numbers, because the only transforms still
  gated on `sourcemap.client` alone — `experimental.asyncContext` and
  `experimental.extractAsyncDataHandlers` — are off by default.)

**Istanbul, for comparison (verified by running):** `@vitest/coverage-istanbul`
4.1.11 with `--coverage.provider=istanbul` gave the same 160/178, 139/161,
42/54, 148/166 totals and the same uncovered line numbers. It works, it is
just slower and a second dependency.

### Two things that do not work the way you would expect

**(a) Untested `.vue` files need the `nuxt` project in the run.** Files that
match `coverage.include` but were never loaded are transformed on demand to
produce their 0% entries. Vitest tries each project's Vite server in order and
keeps the first that succeeds
(`createUncoveredFileTransformer` in `node_modules/vitest/dist/chunks/coverage.*.js`).
Only the `nuxt` project has the Vue plugin. Verified: adding an untested
`app/components/TmpUntested.vue` and running `--project unit --project nuxt`
listed it at 0% (lines 2–9); running `--project e2e` alone printed
`Failed to parse .../Code.vue. Excluding it from coverage.` for every SFC and
reported only `useSession.ts`. So the coverage gate must be the full
`vitest run`, never a `--project` subset — which is what the `test` script
already is.

**(b) Vitest hides 100% rows from the `text` table in agent shells.** Vitest
4.1.11 checks `std-env`'s `isAgent` and, when true, defaults the `text`
reporter to `skipFull: true` and appends `text-summary`
(`node_modules/vitest/dist/chunks/coverage.*.js`, "default to `skipFull` and
add `text-summary` reporter when `text` reporter is used on agents"). Running
under Claude Code, 8 of the 14 files vanished from the table while the totals
still counted them. This is cosmetic — the JSON/HTML/lcov output and the
thresholds are unaffected, and CI (`isAgent` false) prints the full table —
but it will confuse an agent reading the terminal. Pass
`--coverage.skipFull=false` or read `coverage/coverage-final.json` when in
doubt.

## 2. Where does `coverage` live with `projects`, and how is `include` written?

**Root `test.coverage` only.** The v4.1.11 projects guide lists it as
unsupported in a project config: "`coverage`: coverage is done for the whole
process"
([projects.md, Unsupported Options](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/guide/projects.md#defining-projects)),
and the same page says the root config "will only influence global options
such as `reporters` and `coverage`". The types agree: `coverage` is in
`NonProjectOptions`, which `ProjectConfig` omits
(`node_modules/vitest/dist/chunks/reporters.d.*.d.ts`). Putting it inside a
project entry would be a type error and would be ignored.

**`include` is a list of root-relative globs, and it is the mechanism that
brings untested files into the report.** Vitest 4 removed `coverage.all` and
now "defaults to include only covered files in the report"; "When upgrading to
v4 it is recommended to define `coverage.include`"
([migration guide](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/guide/migration.md#removed-options-coverageall-and-coverageextensions)).
`coverage.exclude` defaults to `[]`
([config reference](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/config/coverage.md#coverage-exclude)).
Because `include` is an allowlist, `app/data`, `nuxt.config.ts`, `.nuxt/**`,
`.output/**`, test files and `vitest.config.ts` never enter the report and
need no `exclude` entries. Verified: the trial report contained exactly the
14 files under the two globs.

```ts
// inside the root `test.coverage` block
export default defineConfig({
  test: {
    coverage: {
      include: ['app/components/**', 'app/composables/**'],
    },
  },
})
```

The docs recommend putting extensions in the pattern
([`coverage.include`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/config/coverage.md#coverage-include));
`app/components/**/*.vue` and `app/composables/**/*.ts` would be the strict
form. The bare directory globs are used above because both trees are
single-purpose and a stray `.ts` helper under `app/components/` should count.

## 3. How are 100% thresholds declared so `pnpm test` exits non-zero, and does `e2e` need excluding?

```ts
// inside the root `test.coverage` block
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
```

Or the shorthand `thresholds: { 100: true }`, which the docs define as exactly
that
([`coverage.thresholds.100`](https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/config/coverage.md#coverage-thresholds-100)).
The explicit form is recommended so a future `autoUpdate` or per-glob
override has somewhere obvious to go. `perFile` is unnecessary: a global 100%
implies every file is at 100%.

**Verified by running:** with the block above and the current suite,
`pnpm test` (`vitest run --coverage`) printed the four
`ERROR: Coverage for <metric> (…) does not meet global threshold (100%)` lines
and exited `1`; `pnpm vitest run --project unit` (no flag) ran with no
coverage output and exited `0`. The thresholds logic is
`reportThresholds` in `node_modules/vitest/dist/chunks/coverage.*.js`; it sets
the process exit code on any miss.

**The `e2e` project does not need excluding.** Verified: `vitest run --project
e2e --coverage` reports 0/100 statements — the e2e test file only imports
`@nuxt/test-utils/e2e`, and the app runs inside the Nitro server that `setup()`
spawns, whose process Vitest's inspector does not see
([nuxt/test-utils#1154](https://github.com/nuxt/test-utils/issues/1154) is the
open request for server-side e2e coverage). Its own test file is outside
`coverage.include`, so it adds nothing to the numerator or denominator.
Running it under `--coverage` costs nothing measurable, and keeping the gate
on the single `vitest run` invocation is what makes (a) above safe.

## 4. Anything special for GitHub Actions?

No. The existing `- run: pnpm test` step becomes the gate once the `test`
script passes `--coverage`; a threshold miss is a non-zero exit and a red
check. Two small things:

- Add `coverage` to `.gitignore` — `coverage/` is not ignored today and the
  `html`/`lcov` reporters write there.
- Optionally upload the report so a failing run can be inspected:

  ```yaml
  - run: pnpm test

  - if: always()
    uses: actions/upload-artifact@v4
    with:
      name: coverage
      path: coverage/
      retention-days: 7
  ```

`lcov` is in the reporter list so a Codecov/Coveralls step can be added later
without touching the config. Vitest's `github-actions` _test_ reporter is
enabled automatically on CI and is unrelated to coverage.

## Recommended changes

### `vitest.config.ts`

```ts
import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Root-level only: Vitest collects coverage for the whole process, so a
    // `coverage` block inside a project is a type error and is ignored.
    // Enabled by the `--coverage` flag on the `test` script, not here, so the
    // per-project watch scripts stay fast and `@nuxt/test-utils` sees the
    // flag and turns on client source maps (its guard reads argv).
    coverage: {
      provider: 'v8',
      // An allowlist: only these two trees are reported, and files under them
      // that no test loads are still listed (at 0%). app/data, nuxt.config.ts,
      // .nuxt and the test files never enter the report.
      include: ['app/components/**', 'app/composables/**'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
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
```

### `package.json`

```sh
pnpm add -D @vitest/coverage-v8@4.1.11
```

Pin it to the same version as `vitest`: its `package.json` declares an
exact-version peer dependency (`"vitest": "4.1.11"`), so the two must be bumped
together. Then:

```diff
-    "test": "vitest run",
+    "test": "vitest run --coverage",
```

`test:unit`, `test:nuxt` and `test:e2e` stay as they are. They are watch-mode
single-project runs, and a `--project` subset cannot gate coverage anyway
(see 1a).

### `.gitignore`

```diff
 # Nuxt dev/build outputs
 .output
 .data
 .nuxt
 .nitro
 .cache
 dist
+coverage
```

### `docs/agents/testing.md`

Worth a short section once this lands: the gate is `pnpm test`, only
`app/components/**` and `app/composables/**` count, a `--project` run never
reports coverage, and the `text` table hides 100% rows in agent shells.

## What was verified by running vs read

Run in this worktree (Node 24.19, pnpm 12.4.2, `pnpm install --frozen-lockfile`
then `pnpm add -D @vitest/coverage-v8@4.1.11` and
`@vitest/coverage-istanbul@4.1.11`; neither the lockfile nor `package.json`
change is committed):

- Full `vitest run --coverage` with the include globs: 14 files reported,
  line numbers spot-checked, exit `1` on thresholds.
- Same with `coverage.enabled: true` in the root config and no flag: identical
  numbers.
- `--project e2e` alone: 0% and every SFC dropped with a parse warning.
- `--project unit --project nuxt` with a temporary untested SFC: listed at 0%.
- `--coverage.provider=istanbul`: identical totals and uncovered lines.
- `--project unit` without the flag: no coverage output, exit `0`.
- JSON reporter output inspected to confirm all 14 files were present when the
  `text` table showed 6 (the `isAgent` `skipFull` default).

Read, not run:

- Vitest 4.1.11 docs (guide/coverage, guide/projects, guide/migration,
  config/coverage) at the `v4.1.11` tag.
- Vitest 4.1.11 dist source: `chunks/coverage.*.js` (`isIncluded`,
  `getUntestedFiles`, `createUncoveredFileTransformer`, `reportThresholds`,
  the `isAgent` reporter default), `chunks/defaults.*.js`
  (`coverageConfigDefaults`), `chunks/reporters.d.*.d.ts` (`NonProjectOptions`).
- `@vitest/coverage-v8` 4.1.11 `dist/provider.js` (`convertCoverage`,
  `getCoverageMapForUncoveredFiles`, `getSources`).
- `@nuxt/test-utils` 4.1.0 `dist/config.mjs` (`isCoverageEnabled`,
  `resolveConfig`, `defineVitestProject`) and `dist/vitest-environment.mjs`.
- Nuxt 4.5.2 `dist/index.mjs` (`nuxt:imports-transform`,
  `nuxt:components-loader`) and `@nuxt/schema` 4.5.2 (`sourcemap` default,
  `experimental.asyncContext`, `experimental.extractAsyncDataHandlers`).

Not verified:

- Behaviour in GitHub Actions itself; the claim rests on the exit code, which
  was verified locally, and on `isAgent` being false there (it keys off
  agent-specific environment variables, none of which Actions sets).
- Whether the phantom-branch drift from nuxt/test-utils#1655 can still occur
  with a Nuxt module that registers components differently; the components
  loader in 4.5.2 always emits a map, and the `--coverage` flag makes
  `@nuxt/test-utils` enable client source maps regardless, so it should not.

## Sources

- Vitest 4.1.11 coverage guide — https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/guide/coverage.md
  (rendered: https://vitest.dev/guide/coverage — note the live site may now track a newer major)
- Vitest 4.1.11 coverage config reference — https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/config/coverage.md
- Vitest 4.1.11 projects guide — https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/guide/projects.md
- Vitest 4 migration guide, coverage sections — https://github.com/vitest-dev/vitest/blob/v4.1.11/docs/guide/migration.md
- `ast-v8-to-istanbul` limitations — https://github.com/AriPerkkio/ast-v8-to-istanbul?tab=readme-ov-file#limitations
- Nuxt testing guide (`defineVitestProject`, projects; says nothing about coverage) — https://github.com/nuxt/nuxt/blob/main/docs/1.getting-started/17.testing.md
- nuxt/test-utils#1655, V8 phantom branch from missing client source maps — https://github.com/nuxt/test-utils/issues/1655
- nuxt/test-utils#1674, enable sourcemaps when coverage is enabled — https://github.com/nuxt/test-utils/pull/1674
- nuxt/test-utils#1154, server-side coverage for e2e (open) — https://github.com/nuxt/test-utils/issues/1154
- Installed sources cited inline under `node_modules/` at the versions in the table above.
