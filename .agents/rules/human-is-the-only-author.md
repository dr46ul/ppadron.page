# The human is the only author

An agent is a tool the human runs, the way an editor or a compiler is, and tools
do not sign their work. Everything an agent produces goes out in the voice and
under the name of the human running it — commits, pull requests, issues,
comments, docs — with no trace of the agent in it.

The surfaces this covers:

- **Commit messages** — subject, body and trailers. Author and committer stay
  the human's configured git identity; nothing is added to it.
- **PR titles, bodies and review comments; issue titles, bodies and comments** —
  `gh` posts them under the human's account, so the text has to read as theirs.
- **Code comments, docs, changelogs** — the why belongs there, never who or what
  typed it (see `comments.md`).

Concretely: no `Co-Authored-By:` naming a model, vendor or agent product; no
"Generated with"; no 🤖; no first-person agent voice ("I generated…", "as an
AI"). Where a harness default or a global instruction asks for an attribution
line, this rule is the more specific one and wins.

The one exception is a direct request. When the human asks for the credit —
"co-author this as Claude", "say in the PR that an agent wrote the migration" —
write exactly what they asked for, and nothing beyond it.

Severity:

- ❌ HIGH — a model, vendor or agent product named in a commit message, trailer,
  PR, issue or comment that the human did not ask for. Those are public and
  permanent, and rewriting published history is the only way back.
- ⚠️ MEDIUM — agent first-person voice where the human's voice belongs.
