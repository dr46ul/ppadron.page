# No type assertions: `satisfies`, or narrow

`x as T` tells the compiler to stop checking. It compiles whether `x` is a `T`
or not, so the one place the type was supposed to be proved is the one place it
is assumed. Use `satisfies` where the value already is the type, and narrow
where it is not.

```ts
// ✅ The value is checked against the type and keeps its own.
const state = 'idle' satisfies EnquiryState
const controls = { name, email, message } satisfies Record<EnquiryField, unknown>

// ❌ Compiles even if the value is wrong.
const state = 'idle' as EnquiryState
const fields = Object.keys(controls) as EnquiryField[]
```

`satisfies` only replaces an assertion that was an annotation all along. A
downcast, from a wider type to a narrower one, needs the value to prove what it
is:

- **A string that should be one of a union**: find it in the list the union is
  built from. `RULES.find(rule => rule === issue.message)` returns an
  `EnquiryRule` or `undefined`, which `issue.message as EnquiryRule` never
  admits.
- **The keys of an object**: take them from a typed source. `z.keyof(schema).options`
  is `EnquiryField[]`; `Object.keys(schema.shape)` is `string[]`, and so is every
  other `Object.keys`.
- **An event or element of a wider type**: `instanceof`. `event instanceof
  PointerEvent && event.pointerType === 'touch'`.
- **A tuple through `Array.map`**: `map` widens it to an array, so map the
  members and rebuild it (`mapChannels` in `test/unit/contrast.ts`).
- **A test fixture**: build a real one. `{} as Profile` is not a Profile, and
  a `{ toString } as Selection` stub stands in for a selection the DOM can
  make itself.
- **An element in a component test**: Vue Test Utils' typed query,
  `wrapper.find<HTMLInputElement>('#prompt')`, rather than `.element as
  HTMLInputElement`.

`as const` is not an assertion about what a value is, only a request to keep its
literal type, and stays allowed. The `as` in `import * as z` is a rename, not an
assertion.

Enforced by `ts/consistent-type-assertions` with `assertionStyle: 'never'` in
`eslint.config.js`. Markdown code blocks are left out, so this file can show the
assertion it forbids.

Severity:

- ❌ HIGH — an `as` assertion anywhere in `.ts` or `.vue`. `pnpm lint` fails, so
  the branch does not merge.
