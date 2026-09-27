# Testing

How tests are organised in this repo, and where a new one goes.

## The three projects

`vitest.config.ts` defines three Vitest projects. The directory a file sits in
decides which environment it runs in, so **put the file in the right directory
and there is nothing else to configure**.

| Directory   | Project | Environment                  | For                                                     |
| ----------- | ------- | ---------------------------- | ------------------------------------------------------- |
| `test/unit` | `unit`  | `node`                       | Plain functions. No DOM, no Nuxt, no auto-imports.      |
| `test/nuxt` | `nuxt`  | `nuxt` (happy-dom)           | Components and composables needing the Nuxt runtime.    |
| `test/e2e`  | `e2e`   | `node` + a real built server | Only what only the server render can prove — see below. |

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

`pnpm test` (and CI) enforces 100% lines, functions and statements on
`app/components/**` and `app/composables/**`, and **at most four uncovered
branches** in that tree — a count, not a percentage, so the gate cannot drift as
the tree grows. Exactly four exist today, all unreachable, all in `Terminal.vue`
(see "A `.vue` file will not reach 100% branches" below); the cap is sized to
them, so one new uncovered branch anywhere makes it five and the run fails.
Cover a new branch, don't raise the cap.

That threshold is the **floor**, not the definition. A subject is covered when every branch is
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
session — see `docs/adr/0007-output-components-are-pure.md`. `Terminal` is the
only component that reads `app/data/` and calls `useSession()`, so its tests are
the wiring tests.

**`Terminal` takes no props, so its tests mock the data modules.** It reads
`app/data/` by design, which makes those modules the only seam a wiring test can
substitute at:

```ts
const data = vi.hoisted(() => ({ profile: {} as Profile }))
vi.mock('~/data/profile', () => ({ profile: data.profile }))
```

The mocked binding is captured on import, so the fixture object keeps its
identity and each test writes into it (`Object.assign`, `splice`) rather than
reassigning it. This is also the only way to reach Content the real modules
cannot express, such as `availability.open` being false.

### What belongs in the SSR test

`test/e2e/ssr.test.ts` asserts **only what only the server render can prove**:
the response, the document shell, and that the real `app/data/` Content reaches
the HTML a Visitor is served before any JavaScript runs.

That last one is the whole reason the project earns a second seam. `Terminal`'s
tests mock the three data modules, and `app/data/` is outside the coverage
allowlist, so the wire from a data module to shipped HTML is the one join no
other test can see. The e2e project cannot mock those modules — it runs a real
built server — which is exactly what qualifies it.

The rule that follows: **one assertion per seam, and nothing a `test/nuxt` test
already owns.** The seams are the login banner plus each of the three data
modules, asserted in the transcript block that consumes it. Which fields a
block prints, and how, stays in that component's own test file; re-proving it
here just buys a slower copy. Prefer a field carrying real copy over a
`[bracketed]` placeholder, since the placeholders are all replaced at once.

Two mechanics this depends on:

- **Read the expected value from the data module; never spell it out.** Import
  `../../app/data/profile` and assert on `profile.headline`, so replacing a
  placeholder does not touch the test.
- **Parse the HTML, don't regex it.** `happy-dom` is a devDependency and
  `test/e2e` is a `node` project, so the fetched string is parsed as a document
  — a parser, not a browser: script and stylesheet loading stays off. This is
  what makes an assertion scopable (below), and `.textContent` compares decoded
  text rather than escaped markup, which matters for any copy with an
  apostrophe in it.

A transcript block is found by the command it echoes, not by its `data-entry`
id — the ids are only `TOUR`'s order, and that order is `TOUR`'s to change.

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

**An assertion against the whole page cannot fail. Scope it.** The same Content
is printed in more than one place, so a page-wide `toContain` is satisfied by a
region other than the one under test, and it stays green when the region under
test is wired to nothing. It has bitten three times, in two guises:

- **In `test/nuxt`** the login banner prints `profile.name` and
  `profile.headline` of its own, so a `toContain(profile.name)` made against the
  whole component passes even with the output's prop substituted. Scope to the
  block with `mountTerminal()`'s `output(cmd)` helper (issues #15, #16).
- **In `test/e2e`** the `<head>` carries `profile.name` twice — the document
  title and the description — so a page-wide assertion on it passes against an
  empty `<body>`. Worse, the placeholder Content is not unique to its module:
  `'[Company]'`, `'[Name]'` and `'[Title]'` are fields of **both** `roles` and
  `recommendations`, so Experience could vanish and an assertion on
  `roles[0].company` would stay green on the Recommendations block. Scope to
  `[data-banner]` or to the block `entry(cmd)` returns (issue #29).

Picking a value that happens to be unique today is not a fix: it rests on which
strings three placeholder files happen not to share, and stops discriminating
the moment real copy reuses one. Scope the assertion instead.

## Adding a helper

The suite uses `mountSuspended` for anything that needs a component, and
`mockNuxtImport` for the one boundary the code reaches across (`$fetch`, in
`test/nuxt/session/use-session.test.ts`). `mockComponent`, `renderSuspended` and
Vitest browser mode are available from `@nuxt/test-utils` but are not in use —
reach for one when a test actually needs it, not for completeness.
`registerEndpoint` still has no subject: there is no `server/` directory, so
`/api/contact` is a contract the tests pin rather than an endpoint they can call.

**A composable does not always need a component.** `useSession()` holds no
component state, so its tests call it directly and `use-session.test.ts` mounts
nothing at all.

## Proving a test can fail

A test written against code that already works is green from the start, which
proves nothing. Break the code one way at a time and check that the test goes
red — and that it is the one that catches it. `useSession.ts` was covered this
way; the mutations and what each killed are on issue #14, and `Terminal.vue`'s
25 on issue #18.

**Sometimes the mutation is the only proof there is.** An assertion added to
`ssr.test.ts` against Content the page already prints is green on its first run,
and no ordering of the work makes it red — the code it tests shipped long ago.
There is nothing to do but break the render one way at a time; `ssr.test.ts`'s
seven are on issue #29. The same applies to any assertion added to code that
already works.

**A `.vue` file will not reach 100% branches.** The v8 provider counts branches
in the compiled render function and maps them back through the sourcemap, so
Vue's own `_cache[n] || (_cache[n] = …)` guards for hoisted static vnodes and
cached event handlers surface as uncovered `cond-expr` branches — attributed to
whichever source column is nearest, usually an innocent prop expression.
`Terminal.vue` carries four of them (there is no conditional at any of the four
positions, and they survived every test written for it). No test can reach them;
do not chase them.

This is why the branch gate is a count of four rather than 100% — `branches: -4`
in `vitest.config.ts`. If the four ever move or multiply (a template edit shifts
which prop expression the sourcemap lands on), confirm the newly-reported
positions are artefacts the same way issue #19 did — compile the template with
`@vue/compiler-sfc` and look for a conditional at that source position — before
touching the cap. A real uncovered branch gets a test, not a bigger number.

## CI

`.github/workflows/ci.yml` runs `lint`, `typecheck` and the full test suite
(all three projects) on every pull request and on pushes to `main`.
