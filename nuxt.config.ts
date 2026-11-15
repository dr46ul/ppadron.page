import tailwindcss from '@tailwindcss/vite'
import { themeScript } from './shared/theme'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: true,
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/test-utils/module',
    '@nuxtjs/i18n',
  ],

  app: {
    head: {
      // No `data-theme`: the stylesheet follows the system until the Visitor
      // chooses, and the script applies that choice before first paint. See
      // docs/adr/0011-a-terminal-and-a-teletype.md.
      script: [
        { innerHTML: themeScript, tagPosition: 'head' },
      ],
      // `sizes` on the ICO is what lets Chrome pick the SVG over it; browsers
      // without SVG favicons, Safari among them, fall back to the ICO.
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  // Delivering an Enquiry needs a Resend key and the two addresses. All three
  // are empty here and set as Vercel project environment variables, which Nuxt
  // maps from NUXT_RESEND_API_KEY, NUXT_ENQUIRY_TO and NUXT_ENQUIRY_FROM. An
  // unset key makes the send throw rather than sending anonymously.
  runtimeConfig: {
    resendApiKey: '',
    enquiryTo: '',
    enquiryFrom: '',
  },

  // The page ships as a CDN file and only `server/api/` runs as a function:
  // see docs/adr/0008-the-page-is-prerendered-only-the-api-is-a-function.md.
  routeRules: {
    '/': { prerender: true },
    '/es': { prerender: true },
  },

  experimental: {
    // An extracted `_payload.json` serves client-side navigation between
    // prerendered pages, and nothing navigates between the two Locales' pages.
    // Left on, hydration waits on a fetch that adds nothing the inline payload
    // already holds.
    payloadExtraction: false,
  },

  // The URL decides the Locale and the browser's language is never read, so
  // detection is off. See docs/adr/0013-each-locale-is-a-prerendered-page.md.
  i18n: {
    baseUrl: 'https://ppadron.page',
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en', file: 'en.json' },
      { code: 'es', language: 'es', file: 'es.json' },
    ],
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    experimental: {
      // Without it the Messages are served by a Nitro route, a function in
      // front of the page. See ADR-0013.
      prerenderMessages: true,
    },
  },

  css: ['@/assets/css/main.css'],

  // Git worktrees live under `.worktrees/` (docs/agents/worktrees.md). Nuxt
  // only scans `app/`, but the Vite dev server watches the whole root, and
  // without this a worktree's edits would trigger HMR in the main checkout.
  ignore: ['.worktrees/**'],

  fonts: {
    // The typeface is declared as a custom property in main.css, and the
    // module only finds a family it sees in CSS, so it has to read those.
    processCSSVariables: true,
    families: [
      {
        name: 'Courier Prime',
        provider: 'google',
        weights: [400, 700],
      },
    ],
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  // Nuxt's generated projects reach `test/nuxt/` and no other test directory,
  // so without this `nuxt typecheck` never sees the unit or e2e tests. The node
  // project, because neither may lean on auto-imports (docs/agents/testing.md).
  // It has no `#shared` alias of its own, and the `server/utils` the unit tests
  // import reach for one.
  typescript: {
    nodeTsConfig: {
      include: ['../test/unit/**/*', '../test/e2e/**/*'],
      compilerOptions: {
        paths: {
          '#shared': ['../shared'],
          '#shared/*': ['../shared/*'],
        },
      },
    },
  },
})
