# The site is a terminal session

The page renders as one terminal session. A login banner opens it, the content
is printed as the output of commands (`whoami`, `ls ~/experience`,
`mail pavel`), and a working prompt sits at the foot of the page. There is no
navigation bar, no section anchors, and no scroll-spy.

This replaces an earlier layout that dressed a conventional scrolling page in
terminal costume — monospace headings written as `$ ~/experience`, a blinking
caret, keyboard chips advertising `[E]` `[R]` `[C]` — while behaving like a
document. Three things were wrong with it, and all three are the same mistake:

- It contained a **picture of a terminal** (a `mockup-code` block in the hero)
  inside a page already pretending to be one.
- The **keys were advertised but not load-bearing**. `[E]` scrolled to an
  anchor, with no feedback that the key had been received.
- It ran **two type systems**: a 7rem uppercase poster headline above 13px
  monospace body copy, and marketing whitespace (`py-24`) inside a register
  that has none.

The resolution is to stop dressing and commit. If the page says it is a
terminal, the terminal has to be real.

## Considered Options

- **Keep the metaphor as chrome, move the content to an editorial layout.**
  Rejected, but it was close: separating monospace-as-interface from
  serif-as-voice does fix the type collision, and a ⌘K palette is a keyboard
  promise a page can keep. It gives up the thing that made the page memorable.
- **A full TUI**: fixed viewport, split pane, `j`/`k` selection, vim status
  line. Rejected: the strongest keyboard story of the options, but it puts a
  prospective client inside a modal editor they did not ask to learn, and a
  page that cannot be scrolled cannot be skimmed.
- **Keep the structure, fix only the tone** — drop the poster type, make the
  terminal a texture rather than a claim. Rejected as the smallest honest fix
  rather than the right one.

## Consequences

**The transcript is printed on load and is never animated.** A Visitor must be
able to read the entire page by scrolling, without typing anything and without
waiting for a typewriter. The prompt is an additional affordance for the
curious, never the only way in. Commands the Visitor runs themselves _do_
print a line at a time, because that is the difference between reading a
transcript and operating a machine.

**The commands are listed as chips above the prompt, not behind `help`.** A
Visitor who does not already know that `help` exists is exactly the Visitor
this page is for.

**The scrollback is capped** (14 blocks) and the Enquiry form is a singleton.
Both exist because the page can be driven indefinitely: without the cap the DOM
grows without bound, and a second copy of the form would be a second form bound
to the same state.

**There is no light theme.** _Superseded by
[ADR-0011](./0011-a-terminal-and-a-teletype.md), which adds a light theme, the
teletype, and brings back the inline `<head>` script._ A terminal is a dark surface in any light, and the
daylight version of this design read as a document in a monospace font rather
than as a machine. Removing it also removes the theme cookie, the toggle, and
the inline `<head>` script that ADR-0002 introduced to resolve it before first
paint — see that record for what remains of it.

**The palette is declared, not borrowed.** _The Dracula-derived palette below
is superseded by [ADR-0011](./0011-a-terminal-and-a-teletype.md); the themes
are still declared in `main.css` rather than borrowed._ It began as daisyUI's `dracula` and
is now written out in full in `app/assets/css/main.css` as a theme named
`terminal`, with daisyUI's built-in themes switched off entirely. The hues are
unchanged — no new colour entered the system — but the theme name reaches the
browser in `<html data-theme>`, and that is not a place to advertise a
third-party identity. Writing the tokens out also puts the values the
components actually depend on in the repository rather than in `node_modules`,
and drops ~7kB of stock light and dark theme CSS that nothing could select.

**Content lives in `app/data/`, not in components.** Output components render
Roles and Recommendations; `useSession.ts` owns what a command _means_. Adding
a section means adding a command and an output component, not a page section.
