import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: true,
  },

  modules: ['@nuxt/eslint', '@nuxt/fonts', '@nuxt/test-utils/module'],

  app: {
    head: {
      htmlAttrs: {
        'lang': 'en',
        'data-theme': 'terminal',
      },
      title: 'Pavel Padron — Frontend Engineer',
      meta: [{ name: 'description', content: 'Pavel Padron\'s portfolio' }],
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
    // The page is a terminal, so one register and one family.
    families: [
      { name: 'IBM Plex Mono', provider: 'google', weights: [400, 500, 600, 700] },
    ],
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
