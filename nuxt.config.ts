import tailwindcss from '@tailwindcss/vite'
import { themeScript } from './shared/theme'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: true,
  },

  modules: ['@nuxt/eslint', '@nuxt/fonts', '@nuxt/test-utils/module'],

  app: {
    head: {
      // No `data-theme`: the stylesheet follows the system until the Visitor
      // chooses, and the script applies that choice before first paint. See
      // docs/adr/0011-a-terminal-and-a-teletype.md.
      htmlAttrs: {
        lang: 'en',
      },
      script: [
        { innerHTML: themeScript, tagPosition: 'head' },
      ],
      title: 'Pavel Padron — Frontend Engineer',
      meta: [
        { name: 'description', content: 'Pavel Padron\'s portfolio' },
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
  },

  experimental: {
    // An extracted `_payload.json` serves client-side navigation between
    // prerendered pages, and there is one page. Left on, hydration waits on a
    // fetch of it that adds nothing the inline payload does not already hold.
    payloadExtraction: false,
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
