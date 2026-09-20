# TypeScript stays on 5.x

`typescript` is pinned to `^5.9.3`. Do not raise it to 7.x until `vue-tsc`
supports the native compiler — doing so silently breaks the typecheck and,
through `lint-staged`, every commit.

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
`lint-staged`, which runs `vue-tsc --noEmit` on every staged `.ts`, `.tsx`,
`.js` or `.vue` file. So the broken typechecker did not merely disable
`pnpm typecheck`; it took down the pre-commit hook, and with it the only gate
standing between a change and `main` at the time. The repository went through a
period where the typechecker had never once run to completion.

**Why 5.x and not a different Vue typechecker.** A `golar.config.ts` sat
untracked in the working tree, configured for a package that was never added to
`package.json` — an attempt at routing around this. Swapping the typechecker is
a larger and less reversible change than holding TypeScript one major behind for
a while, on a site whose type surface is a handful of files. `typescript@5.9.3`
publishes no `exports` map at all, so the subpath resolves and `vue-tsc` works.

**What has to be true before this is reversed**: `vue-tsc` (or its successor)
runs against the native compiler without the `lib/tsc` shim. Verify by running
`pnpm typecheck` and by making a real commit — a green `pnpm typecheck` alone
does not prove the hook survived.
