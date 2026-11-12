# Each Locale is a prerendered page

The Session is served in two Locales: English, the default, at `/`, and Spanish
at `/es`. Each is its own prerendered page with its own `<html lang>`, title,
description and `hreflang` alternates. The library is `@nuxtjs/i18n` 10, which
runs vue-i18n 11 underneath, with the `prefix_except_default` URL strategy.

The URL decides the Locale. The site never detects the browser's language and
never redirects by it. A Visitor changes Locale from the Command palette or with
a meta command at the prompt, and the URL changes with it.

This record supersedes nothing. It extends ADR-0008 to a second page and is
written so that ADR-0008 stays true: the Messages are prerendered as static files beside the pages, so
the page and its Messages are still files, and only the API is a function.

## Considered Options

- **vue-i18n with a hand-written plugin.** Rejected: it has no routes, no head
  tags and no `hreflang`, and a second Locale with its own URL would mean
  writing all of them. vue-i18n's own Nuxt page recommends the module.
- **`nuxt-i18n-micro`.** Rejected: it also prerenders a page per Locale, but it
  has one maintainer and a far smaller following. It is not vue-i18n either, so
  the date formats ADR-0009 shaped for vue-i18n would have to be reshaped.
- **Paraglide JS, or a library with no Nuxt module** (`i18next-vue`, `vue-intl`,
  `fluent-vue`, `typesafe-i18n`). Rejected for the same reason: none keeps
  vue-i18n's shapes, and each would leave the routing and head to be written by
  hand.
- **`no_prefix`, one URL for every Locale.** Rejected: the served HTML would
  always be English, the translation would appear only after hydration, and a
  search engine would never see a Spanish page.
- **Detect the browser's language and redirect from `/`.** Rejected: a server
  redirect needs a function in front of the page, which ADR-0008 rejects. A
  client redirect after load would show one page and then swap it for another.
  Either way, the URL a Visitor opens would no longer be the page they get.
- **Typed message keys** (`experimental.typedOptionsAndMessages`). Rejected for
  now: the flag is experimental. Lint is the check that a key exists.

## Consequences

**Messages are prerendered with `experimental.prerenderMessages`.** Without it,
the module serves a Locale's Messages from a Nitro route, and that would put a
function in front of every page. With it, `nuxt build` writes them under
`.output/public/_i18n/` as static files. `nuxt generate` stays banned for
ADR-0008's reason. That the Vercel preset deploys no Messages function with
this setting is inferred from the module's docs. A spike on a Vercel preview,
with English alone, proves it before any copy moves. The same spike also checks
that the prerendered page still exists, that hydration is clean, what the client
bundle gained, and that pnpm's `trustPolicy` accepts the new dependency tree.

**Every Locale has a prerender rule.** ADR-0008's route rule for `/` gains one
for `/es` when Spanish lands. ADR-0008 turned payload extraction off because
there was one page. Now there are two, and a switch between them is a
client-side navigation, so that reason needs checking before Spanish lands.

**Messages live where the module looks for them.** The Interface copy is one
JSON file per Locale in `i18n/locales/`, so a whole translation can be read and
edited in one place. The date formats and plural rules go in the module's
vue-i18n config, `i18n/i18n.config.ts`. `i18n/` is outside the coverage gate,
so any function written for this work, such as a plural rule or a Locale
lookup, lives in `app/utils/` or `shared/`, where the gate reaches it.

**Content does not live in Messages.** It is typed modules per Locale, which
ADR-0015 records.

**The head comes from the module.** `<html lang>`, `hreflang`, the canonical
link and `og:locale` are generated against `https://ppadron.page`. The `lang`
hardcoded in `nuxt.config.ts` goes.

**"Nothing hardcoded" is a lint gate.** `@intlify/eslint-plugin-vue-i18n`
fails the branch on raw text in a template, on a key missing from a Locale,
and on a Message nothing reads. The em dash stays in Message files, because
the rule against it is off on purpose.

**Identifiers are never translated.** Command names and aliases, the domain,
the tty name, key caps, glyphs, and the names of companies, people and
technologies read the same in every Locale.
