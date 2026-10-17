# Output components are pure; Terminal is the only session consumer

Every component under `app/components/session/output/` prints only what it is
handed as props, and reports what happens through emits. None of them imports
`app/data/`, and none of them reaches for the session. `Terminal` is the single
component that reads `app/data/`, calls `useSession()`, and wires the two
together.

This replaces an arrangement where each output imported the Content it printed
and the session was provided down the tree for any output to inject. `Contact`
injected the session to read the Enquiry draft and call `send()`; `Whoami`,
`Experience`, `Recommendations` and `Colophon` each imported their own data
module. The components worked, and were close to untestable: mounting one meant
accepting whatever `app/data/` happened to say that week, so a test could only
assert the real copy back at itself, and there was no way to reach an empty
Roles list, an absent optional field, or a closed availability.

## Considered Options

- **Props for Content, injection for the session.** Rejected, and it was the
  obvious middle: it fixes the data-module imports while leaving `Contact` able
  to reach past its own interface. One output that injects is enough to make
  "mount it with props" untrue of the set, and the exception would have to be
  remembered at every seam.
- **Thread the session through props everywhere**, including `entries` and
  `exec`. Rejected: it makes every output's interface the whole shell, which is
  the shallow end — a large interface in front of no implementation of its own.
  Outputs need the Enquiry draft and a `submit`, not a session.
- **Keep `provideSession`/`injectSession` for a future output that needs the
  session.** Rejected: a seam with no adapter behind it is a hypothetical, and
  it contradicts the rule this record sets. It was deleted along with its
  `InjectionKey`.

## Consequences

**An output's interface is its props and emits, and nothing else.** `Contact`
takes `modelValue`, `state` and `email` and emits `update:modelValue` and
`submit`; `Unknown` takes `cmd` and emits `help`; the rest take the Content
they print. An Output may import code, such as the shared Enquiry schema
`Contact` checks its draft against; it still may not import Content or the
session. Adding a Command means adding an Output with its own props, not
another consumer of the session.

**Props carry Content only.** Interface copy — "command not found", "sending…",
the Help hints — stays in the component that speaks it and never arrives as a
prop, because it does not change when Pavel's life changes.

**`Terminal` is the only place a wiring test can substitute at.** It takes no
props by design, so `test/nuxt/session/terminal.test.ts` mocks the three data
modules with Content the real modules cannot supply and asserts the fixture
reaches each output. Everything else is tested by mounting one component with
props, which is why the outputs reached 100% coverage at all.

**A test that mounts an output never fakes a session.** There is no session to
fake: `useSession()` has one caller, and its own tests call it directly rather
than through a component.

**The login banner is Content too.** It prints `profile.name`, `profile.headline`
and `profile.availability.label`, so the page says one thing about Pavel's
availability rather than the banner and the prompt bar spelling it two ways.
`availability.open` decides only whether that line is accented — the wording is
the Profile's to choose, so a closed availability can say what it likes. The
machine's own name (`ppadron.page`, `ttys002`, the `Last login` stamp) is
interface copy: it belongs to the site, not to the Profile.
