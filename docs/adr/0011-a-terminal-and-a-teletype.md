# A terminal and a teletype

The Session now prints in two themes, and a Visitor can switch between them.
`terminal` is the dark screen; `teletype` is the light one, the session as the
first terminals printed it, in dark ink on printer paper with a red half to the
ribbon. A Visitor who never chose follows their system. The `theme` Command
and a `dark / light` switch in the Prompt bar change it, and the choice is kept
for the next visit.

This supersedes two consequences of ADR-0004: that there is no light theme, and
the Dracula-derived palette. The Session itself is untouched. The reason is
reading comfort, which the dark-only design had stopped providing:

- **Too small.** Prose was 14px, metadata 12px, chips 11px, the RUN label
  10px. Most of what a Visitor read was below a comfortable size.
- **Too bright, on the wrong hue.** Paper-white text at 18:1 on a saturated
  violet smears at the edges for readers with astigmatism, and the violet sat
  opposite the amber accent, so the two vibrated.
- **A thin face.** IBM Plex Mono is wide and light, and at 13px on a dark
  screen it looked spindly.

ADR-0004 removed the light theme because the daylight version "read as a
document in a monospace font". The teletype answers that by being a printout,
not a dimmed screen: a tty was a teleprinter before it was a display, so ink on
paper is a terminal's own history rather than a departure from it.

## A theme is a palette

Both themes set the page in **Courier Prime**, which is Courier redrawn for
screens: heavier strokes, a larger x-height, and it reads as typed output,
which is what a teletype session was. The typeface, the type sizes, the
spacing and the layout are declared once, outside the themes. Switching
changes the colours and nothing else, so the page never reflows under the
Visitor's eyes and a line they were reading stays where it was.

Every size a component uses is a role (`text-machine`, `text-prose`,
`text-meta`, `text-label`, `text-name`). Nothing a Visitor reads is smaller than
the meta step.

**Terminal.** A cool graphite base and off-white text at about 16:1, under the
glare of pure white and still far above AAA. Amber stays the accent.

**Teletype.** Near-neutral off-white paper, cool near-black ink at about 16:1,
and ribbon red as the only accent. Errors share the red, the way a ledger
printed negatives in red.

## Considered Options

- **Dark only, retuned.** The same palette work and a better face, keeping
  ADR-0004 as written. Rejected: it fixes the glare and the size but leaves a
  daylight reader with no light page.
- **A typeface per theme.** The dark prototype paired Atkinson Hyperlegible
  Mono and Next, so commands stayed mono and paragraphs did not. Rejected:
  switching would reflow the whole page, and a theme that changes more than
  colour stops being a theme and becomes a second design to maintain.
- **Always dark until the Visitor switches.** Rejected in favour of following
  the system. A Visitor who set their device to light has already said what
  they find comfortable.

## Consequences

**The inline `<head>` script is back**, the mechanism ADR-0002 described and
ADR-0004 removed. It is in `shared/theme.ts` and runs only for a Visitor who
chose: it reads the saved theme and sets `<html data-theme>` before first
paint. Everyone else gets no attribute, and the stylesheet resolves the theme
from `prefers-color-scheme` with no JavaScript at all. It cannot move into a
plugin or a component, which would run after paint and flash the wrong theme.

**The choice is kept in `localStorage`, not a cookie.** ADR-0002 chose a
cookie, but the page is prerendered (ADR-0008) and no server ever reads it, so
a cookie would only be sent with every request for nothing. The script reads
storage before paint, which is the one thing a cookie offered.

**`theme` is a meta command.** It acts on the Session rather than printing an
Output, like `clear`: the page changing is the answer. On its own it toggles;
`theme dark` and `theme light`, or just `dark` and `light`, set one. It is a
chip, so a Visitor never has to know it exists.

**A theme may declare only colours.** `theme-tokens.test.ts` fails if the two
theme declarations differ in anything but colour, or if either names a
typeface or a type size.

**The column is 72rem.** It is the width the RUN row needs to stay on one
line; prose keeps its own measure inside it.
