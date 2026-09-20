# Testing

How tests are organised in this repo, and where a new one goes.

## The three projects

`vitest.config.ts` defines three Vitest projects. The directory a file sits in
decides which environment it runs in, so **put the file in the right directory
and there is nothing else to configure**.

| Directory   | Project | Environment                  | For                                                  |
| ----------- | ------- | ---------------------------- | ---------------------------------------------------- |
| `test/unit` | `unit`  | `node`                       | Plain functions. No DOM, no Nuxt, no auto-imports.   |
| `test/nuxt` | `nuxt`  | `nuxt` (happy-dom)           | Components and composables needing the Nuxt runtime. |
| `test/e2e`  | `e2e`   | `node` + a real built server | Server-rendered HTML, routing, response headers.     |

Run one at a time with `pnpm test:unit`, `pnpm test:nuxt`, `pnpm test:e2e`
(watch mode), or the whole suite once with `pnpm test`.

## Rules that are not obvious

**`@nuxt/test-utils/runtime` and `@nuxt/test-utils/e2e` cannot be used in the
same file.** They need different environments. This is why `test/nuxt` and
`test/e2e` are separate directories rather than one `test/` folder.

**Only `test/nuxt/` is in the Nuxt TypeScript context.** Nuxt includes
`test/nuxt/**` automatically, which is what makes `~/`, `#imports` and
auto-imports resolve there. Tests elsewhere must import from real paths. If a
new directory needs the Nuxt context, add it under `typescript.tsConfig.include`
in `nuxt.config.ts`.

**Unit tests must not reach for Nuxt features.** If a test in `test/unit` needs
an auto-import or a composable, it belongs in `test/nuxt` instead.

**Never sleep on the real clock.** The session prints output behind a
per-command think delay (`useSession.ts`). Tests fake the clock and run it out
with `vi.runAllTimersAsync()` — see `test/nuxt/session.test.ts`. A real-time
`setTimeout` wait is slow and fails on a loaded CI runner.

**The `nuxt` environment shares global state between tests in a file.** A Nuxt
app is initialised once before the tests run, so anything mutated globally must
be reset afterwards.

## Adding a helper

The suite deliberately uses only `mountSuspended`. `mockNuxtImport`,
`mockComponent`, `renderSuspended` and Vitest browser mode are all available
from `@nuxt/test-utils` but are not in use — reach for one when a test actually
needs it, not for completeness. `registerEndpoint` has no subject: there is no
`server/` directory.

## CI

`.github/workflows/ci.yml` runs `lint`, `typecheck` and the full test suite
(all three projects) on every pull request and on pushes to `main`.
