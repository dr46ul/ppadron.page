---
paths:
  - '**'
---

# Comments say why, never what

A comment earns its line only where the why isn't recoverable from the code. Everything else is a line the next change has to keep true.

Enforced at every review level, and no repo document overrides it.

A comment is required wherever the diff introduces one of these — a reader with the code in front of them still can't get there:

- **Something the code doesn't show.** It is correct for a reason the call site hides: an ordering the framework imposes, the shape the API actually returns, the race the guard closes.
- **A product decision.** The behaviour is a choice someone made rather than a consequence of the code — a rounding rule, an exclusion, a default a clinic asked for. Unexplained, the next change reads it as a bug and "fixes" it.
- **An obscure reason.** The workaround for an upstream bug, the constant that has to match a value elsewhere, the branch that exists for one legacy tenant.

Everywhere else:

- **Reasons, not restatements.** A paraphrase of the line below, a note that something was fixed, or the ticket copied out at five call sites all go.
- **No ticket ids, dates, authors, or change history.** That belongs in the commit message — the tracker may be gone one day, the code won't.
- **Only comments this branch is responsible for.** `git blame -L <line>,<line> <file>` settles it: either the comment was written on this branch, or it predates the branch and the diff made it wrong by changing the code beneath it. A comment that predates the fixed point and still reads true belongs to another change.
- **Reread and cut.** The first draft is always longer than the reason it carries.
- **Where the comment exists because the code is opaque**, the fix is a clearer name or a smaller function, and the comment goes away with it.

Severity:

- ❌ HIGH — the comment contradicts the code it sits above. A reader who trusts it is misled, which makes it a defect rather than a style note.
- ❌ HIGH — a product decision or an upstream workaround lands with no why. The reason exists only in someone's head, and the next reader deletes the behaviour as dead or wrong.
- ⚠️ MEDIUM — a ticket id, date, author, or change-history line inside a comment. It rots in place and sends the next reader to a tracker instead of to the code.
- 💡 SUGGESTION — a comment restating what the code already says, or several sentences carrying one sentence of reason.
