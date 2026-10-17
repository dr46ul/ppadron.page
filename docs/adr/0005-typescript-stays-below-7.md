# TypeScript stays below 7

`typescript` is on `^6.0.3`, the last major written in JavaScript. Do not raise
it to 7.x until `vue-tsc` supports the native compiler — doing so silently
breaks the typecheck and, through `lint-staged`, every commit.

This record was first written against `^5.9.3`. The move to 6.x (#59) changed
nothing it depends on: `typescript@6.0.3` still ships `lib/tsc.js` and still
publishes no `exports` map, so `vue-tsc` resolves the subpath it needs.

TypeScript 7 is the native Go port. It no longer ships the JavaScript
`typescript/lib/tsc` entry point, and `vue-tsc` resolves exactly that subpath at
startup in order to wrap it. Under `typescript@7.0.2` every invocation of
`vue-tsc` died before checking anything:

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './lib/tsc' is not
defined by "exports" in .../typescript/package.json
```

**Nothing catches this for you.** `vue-tsc@3.3.11` declares its peer as
`typescript: >=5.0.0`, which `7.0.2` satisfies, so the package manager installs
the combination without a warning. The failure only appears at runtime, and only
if something actually runs the typechecker.

**The blast radius was larger than one script.** `.husky/pre-commit` runs
`lint-staged`, which runs `pnpm typecheck` whenever a `.ts`, `.tsx`, `.js`,
`.mjs` or `.vue` file is staged. So a broken typechecker does not merely disable
`pnpm typecheck`; it takes down the pre-commit hook, and with it the only gate
standing between a change and `main` at the time. The repository went through a
period where the typechecker had never once run to completion.

**A typecheck that runs is not one that checks.** After the fix above,
`pnpm typecheck` was `vue-tsc --noEmit` against a `tsconfig.json` that holds
only project `references` and `files: []`. Outside build mode TypeScript does not
follow references, so it checked no files at all and passed: an error planted
in `app/` exited 0, in CI and in the hook alike. It now runs
`nuxt typecheck --checker vue-tsc`, which regenerates `.nuxt`'s types first and
switches to build mode when the tsconfig is solution-style. `test/unit` and
`test/e2e` sit outside every project Nuxt generates, so `nuxt.config.ts` adds
them to its node project (see docs/agents/testing.md).

**Why not a different Vue typechecker.** A `golar.config.ts` once sat untracked
in the working tree, configured for a package that was never added to
`package.json` — an attempt at routing around this. Golar checks Vue on
typescript-go, and `nuxt typecheck --checker golar` now supports it directly, so
it is the likely way past 7.x. It is not adopted yet:

- It is pre-1.0 (`0.1.10`), and its config is imported from `golar/unstable`.
- The types would be checked by the native compiler while editors and ESLint
  still run `typescript@6`, so the two could disagree about the same file.
- On a site whose type surface is a handful of files, `vue-tsc` takes about two
  seconds; the speed Golar buys is not worth the churn yet.

Adopting it is a new record that supersedes this one, after a trial in a
worktree (docs/agents/worktrees.md). `--checker vue-tsc` is pinned in the script
because, without it, `nuxt typecheck` prefers Golar the moment any
`golar.config.*` exists — which a stray file like the one above would do.

**What has to be true before this is reversed**: `vue-tsc` (or its successor)
runs against the native compiler without the `lib/tsc` shim. Verify three ways:

- Run `pnpm typecheck`.
- Plant a type error and watch `pnpm typecheck` fail on it. A green run alone
  does not prove anything was checked.
- Make a real commit. A green `pnpm typecheck` alone does not prove the hook
  survived.
