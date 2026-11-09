# One `it`, one behaviour, one `expect`

A test is a sentence about one behaviour, and its `expect` is the proof of that
sentence. A second `expect` means one of two things: the test proves a second
behaviour its name doesn't mention, or it proves one behaviour in pieces, and
the first piece that fails hides the rest.

- **A second behaviour is a second `it`.** "Prints the note between two Roles"
  and "the note cannot be opened" are two specs, so each gets its own name and
  its own failure.
- **Several facts of one behaviour are one value.** Gather them into an object
  or an array and compare it once with `toEqual`. The failure diff then shows
  every fact that is wrong, side by side, not just the first one.

```ts
// ✅ One behaviour, compared as one value.
it('prints every field of the note', async () => {
  const entry = (await mount([role({ before: note() })])).findAll('li')[1]!
  expect({
    period: entry.get('time').text(),
    datetime: entry.get('time').attributes('datetime'),
    summary: entry.get('p').text(),
  }).toEqual({ period: '2011 — 2014', datetime: '2011', summary: 'Threw bowls.' })
})

// ❌ Stops at the first mismatch; the name covers some of these but not others.
it('prints every field of the note', async () => {
  const entry = (await mount([role({ before: note() })])).findAll('li')[1]!
  expect(entry.get('time').text()).toBe('2011 — 2014')
  expect(entry.get('time').attributes('datetime')).toBe('2011')
  expect(entry.get('p').text()).toBe('Threw bowls.')
  expect(entry.findAll('button')).toHaveLength(0)
})
```

A state that changes is still one value: compare `[before, after]`, not the two
moments one after the other. Asymmetric matchers inside the one `expect`
(`expect.stringContaining`, `expect.arrayContaining`, `expect.any`) are part of
the expected value, not extra assertions.

Every test is written with `it`, never `test`, so a file reads as a list of
things the code does: "it prints every field of the note".

Enforced in `eslint.config.js`:

- `test/max-expects` with `max: 1` covers every test file except the ones listed
  beside it, which predate this rule. A file migrated to one `expect` per `it`
  comes off the list in the same change, and nothing is ever added to it.
- `test/consistent-test-it` comes from `@antfu/eslint-config`, which sets `it`
  both inside and outside `describe`.

Severity:

- ❌ HIGH — a second `expect` in a test file not on the list, or a file added to
  the list. `pnpm lint` fails or the ratchet goes backwards.
- ❌ HIGH — `test(` in place of `it(`. `pnpm lint` fails.
- ⚠️ MEDIUM — a new or changed test with more than one `expect` in a file still
  on the list. Lint can't see it, so review has to.
