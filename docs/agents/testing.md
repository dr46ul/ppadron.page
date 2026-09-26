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

## Test-first

Every component, page, composable and util is built red → green → refactor:
write the test, run it and **watch it fail**, then write the code that turns it
green, then tidy. A test that passes on its first run has not proved anything;
break the code and confirm it goes red before moving on. Claude Code sessions
call the Skill tool with `tdd` before writing any test, and `codebase-design`
when reshaping a component's interface.

This applies to conversions and refactors too, not only greenfield code: the
first commit of a change is the test that describes the new behaviour.

## What covered means

`pnpm test` (and CI) enforces 100% lines, branches, functions and statements
on `app/components/**` and `app/composables/**`. That threshold is the
**floor**, not the definition. A subject is covered when every branch is
exercised **and** the edge cases a reviewer would ask about have a test:

- empty lists,
- optional fields absent,
- every state of a state machine,
- both ends of a range,
- the failure path.

Full coverage with none of these is a green gate over an untested component.

## Where a test goes

One file per subject, mirroring `app/`:

| Subject                                    | Test file                                 |
| ------------------------------------------ | ----------------------------------------- |
| `app/components/session/output/<Name>.vue` | `test/nuxt/session/output/<name>.test.ts` |
| `app/components/session/Terminal.vue`      | `test/nuxt/session/terminal.test.ts`      |
| `app/composables/useSession.ts`            | `test/nuxt/session/use-session.test.ts`   |

Output components are pure: they print what they are handed as props and
report through emits, so their tests mount them with props and never touch the
session. `Terminal` is the only component that reads `app/data/` and owns the
session, so its tests are the wiring tests.

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
be reset afterwards. `vi.stubGlobal` needs a matching `vi.unstubAllGlobals`.

**`$fetch` cannot be stubbed with `vi.stubGlobal`.** It is an auto-import, not a
global: `useSession.ts` gets its own binding, and stubbing `globalThis.$fetch`
leaves that binding pointing at the real thing. The stub then does nothing and a
test asserting the failure path passes because the request genuinely failed —
a green test proving nothing. Use `mockNuxtImport('$fetch', …)`.

## Adding a helper

The suite uses `mountSuspended` for anything that needs a component, and
`mockNuxtImport` for the one boundary the code reaches across (`$fetch`, in
`test/nuxt/session/use-session.test.ts`). `mockComponent`, `renderSuspended` and
Vitest browser mode are available from `@nuxt/test-utils` but are not in use —
reach for one when a test actually needs it, not for completeness.
`registerEndpoint` still has no subject: there is no `server/` directory, so
`/api/contact` is a contract the tests pin rather than an endpoint they can call.

**A composable does not always need a component.** `useSession()` holds no
component state, so its tests call it directly. Only `provideSession` and
`injectSession` need a host component.

## Proving a test can fail

A test written against code that already works is green from the start, which
proves nothing. Break the code one way at a time and check that the test goes
red — and that it is the one that catches it. `useSession.ts` was covered this
way; the mutations and what each killed are on issue #14.

## CI

`.github/workflows/ci.yml` runs `lint`, `typecheck` and the full test suite
(all three projects) on every pull request and on pushes to `main`.
