# Static prerendering with an inline theme script, not SSR

> **Superseded by [ADR-0004](./0004-the-site-is-a-terminal-session.md) and
> [ADR-0008](./0008-the-page-is-prerendered-only-the-api-is-a-function.md).**
> ADR-0004 made the site dark only, which removed the theme toggle, the cookie
> and the inline `<head>` script described below. ADR-0008 now carries the
> decision that outlived them — the page is prerendered to the CDN and only
> `server/api/` runs as a function — and is the first record of it that the
> build actually implements. Kept for the reasoning against SSR, which ADR-0008
> cites.
>
> [ADR-0011](./0011-a-terminal-and-a-teletype.md) brings the inline `<head>`
> script back for a second theme, keeping the choice in `localStorage` rather
> than a cookie.

The site offers a light/dark toggle (`corporate` / `dracula`) whose choice must survive a reload without a flash of the wrong theme. The obvious implementation is SSR with a cookie: the server reads the theme per request and emits the right `data-theme`. We chose static prerendering instead, and handle the override with a small inline `<head>` script that reads the cookie and sets `data-theme` before first paint. The contact endpoint still deploys as a serverless function via Nitro's hybrid rendering, so the page is CDN-static while `server/api/contact.post.ts` is dynamic.

The reason this works cheaply is that daisyUI's `--default` / `--prefersdark` flags already resolve first-time visitors correctly through a pure CSS media query, with no JavaScript at all. The inline script therefore only has to handle visitors who have explicitly overridden their OS preference — a minority — rather than deciding the theme for everyone.

## Considered Options

- **SSR on Vercel.** Rejected: paying for a serverless render on every visit, plus cold starts, to read one cookie on a page with zero dynamic data is the wrong trade. Static gives better TTFB on a site whose performance is part of the pitch.
- **`theme-change` / localStorage** (what the daisyUI docs suggest). Rejected: the server cannot read localStorage, so every visit paints one theme and snaps to the other. On a site built to demonstrate frontend competence, that flash is the one bug the audience is qualified to notice.
- **Static with no script.** Rejected: correct for the majority, but visitors who chose a theme get a flash on every page load.

## Consequences

There is a raw inline script in `<head>`. It is deliberate: do not replace it with `useCookie` or move it into a plugin or component, because anything that runs after hydration runs after first paint, which reintroduces the flash. If the site ever gains genuinely dynamic content and moves to SSR, this script can be deleted and replaced with a server-side cookie read — but that is the trigger for revisiting, not a general cleanup.

The e2e suite asserts the CSS-resolved default rather than a cookie-driven server render.
