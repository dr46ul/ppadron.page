# Pavel Padron's Portfolio

The new version of my personal website and portfolio.

## Architecture

### Deployment & integration

Hosted on [Vercel](https://vercel.com). The site is a single page, prerendered to the CDN at
build time; the contact endpoint deploys as a serverless function through Nitro's hybrid
rendering, so the page stays static while `server/api/` stays dynamic.

`main` deploys to production, `develop` and pull requests get preview deployments.

### Programming language

I use [TypeScript](https://www.typescriptlang.org/), a strongly typed programming language that builds on JavaScript and enables better tooling.

### Framework

Declarative rendering and reactivity, I selected [Vue](https://vuejs.org/).

### Meta-framework

For automation and conventions, I use [Nuxt](https://nuxt.com/).

### Application concerns

- Components: [Daisy UI](https://daisyui.com)
- [Conventional commits](https://www.conventionalcommits.org)
- Transactional email: [Resend](https://resend.com)
- Analytics: [Vercel Analytics](https://vercel.com/docs/analytics) (cookieless)
- Tests: [Vitest](https://vitest.dev) throughout — unit, component (Nuxt environment) and
  end-to-end, the last driving a real browser via
  [`@nuxt/test-utils`](https://nuxt.com/docs/getting-started/testing) and `playwright-core`

## Browser support

This website supports the latest two versions of Chrome, Safari, Edge, Firefox, and Opera —
browsers that support modern JavaScript.

## Documentation

- [`CONTEXT.md`](./CONTEXT.md) — the domain vocabulary this project uses
- [`docs/adr/`](./docs/adr) — architecture decision records
- [`AGENTS.md`](./AGENTS.md) — guidance for AI agents working in this repository
