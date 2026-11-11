# Commands open in a palette

The Prompt bar is the prompt and one labelled button. The button, or ⌘K /
Ctrl+K, opens the Command palette: a modal listing every Command and meta
command beside what it does, the way `help` prints them, with the theme choice
at its foot. Typing narrows the list, ↑ and ↓ move through it, and Enter runs
the highlighted Command.

This supersedes the consequence of ADR-0004 that the commands are listed as
chips above the prompt, and the `dark / light` switch and `theme` chip of
ADR-0011. The reason the chips existed still holds: a Visitor who does not
know `help` exists is the Visitor this page is for. The chips met it by
showing every Command at once, and that is what stopped working:

- **The row grew with the Content.** Every Command added a chip and every
  setting added a control, and the row wrapped. On a phone the Prompt bar
  already took about a third of the screen, and the next setting planned, a
  language, would have taken more.
- **The theme had two controls.** A `theme` chip and a `dark / light` switch
  did the same job side by side.

A labelled button keeps the way in without showing every Command at once. The
Prompt bar stays one row however many Commands there are.

## Considered Options

- **Show the next few Commands.** Two chips for what the Visitor has not read
  yet, plus `mail pavel`, then the full list. Rejected: still two rows on a
  phone, and chips that change while the Visitor reads are a surprise.
- **Settings in a title bar, Commands on Tab.** Settings and availability at
  the top of the screen as a terminal's title bar, and Tab listing the Commands
  zsh-style. Rejected: it splits the chrome between the top and the foot, and
  depends on the Visitor reading a hint to find Tab.
- **The list rising out of the Prompt bar.** The same list, opening upward from
  the bar instead of as a modal. Rejected in favour of a modal, which has room
  for the whole list on a phone and is a pattern every Visitor already knows.

## Consequences

**The theme has three choices.** Light, dark, or follow the system, chosen in
the palette or typed as `theme --light`, `--dark` or `--system`. Following the
system removes the saved choice and `<html data-theme>`, so the stylesheet's
`prefers-color-scheme` query decides again. `theme` on its own still toggles,
and `theme dark`, `theme light`, `dark` and `light` still work.

**Availability is printed in the login banner alone.** The Prompt bar no longer
carries it.

**The palette is a native `<dialog>`.** `showModal()` puts it in the top layer
above the Prompt bar's `backdrop-filter`, makes the page behind it inert, and
closes on Escape without a handler of its own.

**The key caps are one component.** The Recommendations hint, the palette's
hint and the shortcut on the button all use `KeyCap.vue`.
