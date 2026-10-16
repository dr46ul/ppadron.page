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
`app/components/**`, `app/composables/**`, `app/utils/**` and `server/utils/**`, and **at most
four uncovered branches** in that tree — a count, not a percentage, so the gate cannot drift as
the tree grows. Exactly four exist today, all unreachable, all in `Terminal.vue`
(see "A `.vue` file will not reach 100% branches" below); the cap is sized to
them, so one new uncovered branch anywhere makes it five and the run fails.
Cover a new branch, don't raise the cap.

**`server/api/**` is outside the allowlist on purpose, and that shapes how a
route is written.** A route handler only ever runs inside the built server the
`e2e` project starts as its own process, so v8 collects no coverage from it and
an included route file would report 0% and fail the gate. The rule that follows:
**a route handler holds no logic.** It reads the body, calls into
`server/utils/`, and maps a refusal to a status code; everything it decides
lives in a `server/utils/` module a `test/unit` test imports directly.
`server/api/contact.post.ts` is the worked example.

What the e2e project adds for a route is the one thing only it can prove: that
the path is served at all. `ssr.test.ts` posts a body that is not an Enquiry and
expects a 400. It never posts a valid one — validation is refused before
delivery is reached, so nothing leaves, and a valid Enquiry would be delivered
for real the moment a credential exists in `.env`.

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
| `app/composables/useDateContext.ts`        | `test/nuxt/use-date-context.test.ts`      |
| `app/composables/useVisitedAt.ts`          | `test/nuxt/use-visited-at.test.ts`        |
| `app/utils/<name>.ts`                      | `test/unit/utils/<name>.test.ts`          |
| `server/utils/<name>.ts`                   | `test/unit/server/<name>.test.ts`         |

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

**That `/` is prerendered is asserted against the build, not a response.** A
static file and a per-request render serve the same HTML, so `ssr.test.ts`
checks for `public/index.html` in the output `setup()` built, found through
`useTestContext().nuxt.options.nitro.output.dir`. Nitro prerenders under the
`node-server` preset the e2e build uses, so the check holds there; what it
cannot see is the Vercel preset's own layout. See ADR-0008.

**The dates a Visitor is served are asserted here too.** The build has no
Visitor, so the banner and the © ship in English and UTC and are re-dated once
the page is mounted (ADR-0009). The composables' tests see the fallback
during setup, but only the prerendered HTML shows the page actually ships it.
The expected banner is formatted from the build's own instant, read out of the
inline payload (`$sbuilt-at`, decoded with `devalue`), with the English and UTC
spelled out rather than imported, so a changed fallback fails here.

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

**Stub the Visitor's time zone with `vi.stubEnv('TZ', …)`, not by spying on
`Intl`.** Node re-reads `TZ` whenever it changes, so the zone `Intl` resolves
to moves with it. A spy on `Intl.DateTimeFormat.prototype.resolvedOptions`
does not reach the component in the `nuxt` environment, and the test quietly
runs in the machine's own zone instead — green on a laptop in one zone, red in
CI in another. Unstub with `vi.unstubAllEnvs()`. `navigator.languages` does
stub with `vi.spyOn(navigator, 'languages', 'get')`. Both are in `visitFrom`,
`test/nuxt/visit-from.ts`.

**`mountSuspended` resolves with the component already mounted**, so anything
a component holds before `onMounted` is invisible to an assertion made after
it. To see it, mount a small probe component that copies the value out during
`setup()` — `test/nuxt/use-date-context.test.ts` does.

**`$fetch` cannot be stubbed with `vi.stubGlobal`.** It is an auto-import, not a
global: `useSession.ts` gets its own binding, and stubbing `globalThis.$fetch`
leaves that binding pointing at the real thing. The stub then does nothing and a
test asserting the failure path passes because the request genuinely failed —
a green test proving nothing. Use `mockNuxtImport('$fetch', …)`.

**Server code uses the real `fetch`, and that one does stub.** `server/utils/`
runs in the `unit` project, where there are no auto-imports: `sendEnquiry` looks
`fetch` up on the global at each call, so `vi.stubGlobal('fetch', …)` genuinely
replaces it and no mail leaves. The trap above is about Nuxt's `$fetch`
specifically, not about every name that resembles it.

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
`registerEndpoint` still has no subject, though `/api/contact` now exists. It
registers a substitute handler rather than running the real one, so pointing it
at that path would only re-prove the client contract `use-session.test.ts`
already holds.

**A composable does not always need a component.** `useSession()` holds no
component state, so its tests call it directly and `use-session.test.ts` mounts
nothing at all.

**`test/unit/contrast.ts` is the palette's oracle.** It converts oklch to sRGB,
composites `in srgb` and returns a WCAG ratio, so a test can recompute what a
token renders at instead of trusting a number in a comment.
`theme-tokens.test.ts` parses each role token out of `main.css` and checks it
against the interface audit's measured ramp; the oracle reproduces that ramp
exactly (`/100` 18.10, `/60` 6.86, `/50` 5.07, `/45` 4.31), which is what makes
it usable as one. Reuse it for any new colour pair rather than measuring by
hand — including the 3:1 WCAG 1.4.11 asks of a control's boundary.

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

**Commit the green change before you mutate, and make the script refuse to run
a mutation that did not apply.** A mutation script reverts each break with
`git checkout -- <file>`, which restores from `HEAD` — so if the code under test
is still only in the working tree, the first revert deletes it. Every later
mutation then edits a file that no longer contains what it was looking for,
silently changes nothing, and runs against unmutated code. The failures that
come back are real, identical for every mutation, and prove nothing; the tell is
that each "mutation" kills exactly the same tests. Guard it:

```sh
if git diff --quiet -- "$FILE"; then
  echo "mutation did not apply"
  return
fi
```

This cost a re-apply and one worthless run on issue #47, using a script copied
from issue #29 — where the code under test was already merged, so reverting was
safe there and destructive here.

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

## Verifying what the browser actually paints

**No Vitest project can see colour, focus or geometry.** happy-dom computes no
styles, and the `e2e` project asserts the markup the server sent. So a claim
about a contrast ratio, a focus ring, an overflow or a tap target is not
something the suite can make — it needs a real browser, driven out of band. The
suite's job is then narrower and still worth doing: assert the **token** a
component renders, and recompute the **value** that token resolves to from the
stylesheet (see `test/unit/contrast.ts` above). Between them, the unit test
guards the number and the browser run proves the number reaches the element.

`playwright-core` is already in `devDependencies`. Two things about it:

- **It is CommonJS**, so an ESM script reaches it with `createRequire` and an
  absolute path rather than an `import`.
- **It ships no browser.** A fresh clone fails with `Executable doesn't exist`;
  run `npx playwright install chromium-headless-shell` first. Neither install
  nor CI does this, because no committed test needs a browser.

Drive the server built into `.output`, not the dev server, so what is measured
is what deploys.

**Two traps make a contrast measurement silently wrong, in opposite
directions.** Both cost a full false result on issue #32:

- **`getComputedStyle(el).color` is not always `rgb()`.** Chrome serialises a
  `color-mix()` of `oklch` as `color(srgb 0.8 0.79 0.78)` — channels in 0–1, not
  0–255. Parsed as 8-bit, every colour collapses toward black and **every** pair
  reports ≈1.00:1, so the whole page looks like it fails.
- **`body` paints no background here.** The surface is `--color-base-100` on
  `:root`, so `getComputedStyle(document.body).backgroundColor` is
  `rgba(0, 0, 0, 0)`. Composited against pure black, every ratio comes out
  **higher** than the truth (5.53:1 where the real figure is 5.07:1), so the
  page looks like it passes.

The fix for the first is to let the browser do the conversion: paint the
computed value into a 1x1 canvas and read the pixel back with `getImageData`,
which is 8-bit sRGB whatever the input notation. The fix for the second is to
walk up from `body` to the first ancestor whose `backgroundColor` is not
transparent, and composite against that.

**A hydration mismatch is tested at the composable, and checked in a browser
for the page.** `use-date-context.test.ts` plays the build with
`renderToString` under English and UTC, re-stubs the Visitor, hydrates the HTML
with `createSSRApp`, and fails on any console message mentioning `Hydration`
— Vue's dev build reports each mismatch. Reading the browser before mount is
the mistake it catches (ADR-0009). Whether the whole page hydrates cleanly is
still checked against `.output`: open it in a Playwright context with a
`locale` and `timezoneId` unlike the build's, and watch the console. Vue's
production build logs `Hydration completed but contains mismatches.` when the
two differ, and nothing when they do not.

Sanity-check the harness before trusting it. A run where every element fails, or
where every element passes by a suspiciously even margin, is measuring the
harness rather than the page.

## CI

`.github/workflows/ci.yml` runs `lint`, `typecheck` and the full test suite
(all three projects) on every pull request and on pushes to `main`.
