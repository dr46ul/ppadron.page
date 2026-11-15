# ppadron.page

The source of [ppadron.page](https://ppadron.page), my personal site. It is written for one
reader: someone deciding whether to hire me for a freelance project. Its one goal is to get
that person to send me a message.

The site is a terminal session. It opens with a login banner and has already run a short
tour (`whoami`, `ls ~/experience`, `cat ~/recommendations`, `mail pavel`, `cat ~/colophon`)
by the time you see it, so you can read the whole page without typing anything. The prompt at
the bottom still works, and ⌘K / Ctrl+K opens a palette with every command. `help` lists
them all.

Built with [Nuxt](https://nuxt.com), [Vue](https://vuejs.org) and TypeScript, styled with
[Tailwind CSS](https://tailwindcss.com) and [daisyUI](https://daisyui.com), tested with
[Vitest](https://vitest.dev), hosted on [Vercel](https://vercel.com). Contact form mail goes
out through [Resend](https://resend.com). Versions are in `package.json`.

## Running it locally

You need the Node version in `.nvmrc` and the pnpm version in `package.json`'s
`packageManager` field, which Corepack installs for you.

```bash
corepack enable
pnpm install
pnpm dev
```

The contact form only sends mail once Resend is configured: copy `.env.example` to `.env`
and fill in the three values. It has to be `.env`. Nuxt never reads `.env.local`, and with
the values empty the form refuses to send.

`pnpm lint`, `pnpm typecheck` and `pnpm test` are what CI runs, and a pull request has to
pass all three. The other scripts are in `package.json`.

## Where to look

- **Words**: [`CONTEXT.md`](./CONTEXT.md) defines Visitor, Session, Command, Output,
  Enquiry and the rest. Read it before naming anything, because the code uses these terms
  exactly.
- **Why it's built this way**: [`docs/adr/`](./docs/adr), one record per decision. Read the
  matching one before you change any of these:
  - adding code that runs on a server, when only the contact endpoint is a function
    ([0008](./docs/adr/0008-the-page-is-prerendered-only-the-api-is-a-function.md))
  - storing an Enquiry anywhere ([0003](./docs/adr/0003-enquiries-are-not-persisted.md))
  - adding a section, nav or route instead of a Command
    ([0004](./docs/adr/0004-the-site-is-a-terminal-session.md))
  - moving Content out of typed modules
    ([0015](./docs/adr/0015-content-is-typed-modules-per-locale.md))
  - theme handling before first paint ([0011](./docs/adr/0011-a-terminal-and-a-teletype.md))
  - adding a locale ([0013](./docs/adr/0013-each-locale-is-a-prerendered-page.md))
- **Content**: what the site says about me lives in `app/data/<locale>/`, and interface copy
  lives in `i18n/locales/`. Edit these files when the facts change. The components only
  print what they're given.
- **Tests**: [`docs/agents/testing.md`](./docs/agents/testing.md). Read it before writing
  one. Everything is written test-first, coverage has to stay at 100%, and the directory a
  test lives in decides how it runs.
- **Security**: [`SECURITY.md`](./SECURITY.md), to report a vulnerability privately.
- **Coding agents**: [`AGENTS.md`](./AGENTS.md), and the house rules in `.agents/rules/`
  that lint enforces.

## Deployment

`main` deploys to production on Vercel, and pull requests get preview deployments. Commits
follow [Conventional Commits](https://www.conventionalcommits.org), checked by a Git hook.

## Browser support

The latest two versions of Chrome, Safari, Edge, Firefox and Opera.
