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

The shapes that come up again and again:

- **A state that changes** is captured and compared once:
  `expect([before, after]).toEqual(['sending', 'sent'])`, not two `expect`s
  either side of the step.
- **A string that must hold several things** lists what is missing, so the
  failure names it: `expect(['Acme', '2022 — now'].filter(field =>
  !text.includes(field))).toEqual([])`. Flip the condition for things it must
  not hold.
- **A class that must be there while another must not**: filter to the classes
  in question, `expect(['border-edge', 'border-base-300'].filter(name =>
  classes.includes(name))).toEqual(['border-edge'])`.
- **The same check across a list** maps the list and compares the array, never
  an `expect` inside a `for`.

Asymmetric matchers inside the one `expect` (`expect.stringContaining`,
`expect.objectContaining`, `expect.not.stringMatching`) are part of the expected
value, not extra assertions.

Every test is written with `it`, never `test`, so a file reads as a list of
things the code does: "it prints every field of the note".

Enforced in `eslint.config.js` for every file under `test/`:
`test/max-expects` with `max: 1`, and `test/consistent-test-it`, which
`@antfu/eslint-config` already sets to `it` inside and outside `describe`.

Severity:

- ❌ HIGH — a second `expect` in a test, or `test(` in place of `it(`.
  `pnpm lint` fails, so the branch does not merge.
