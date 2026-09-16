import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
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

  css: ['@/assets/css/main.css'],

  fonts: {
    // One register, one family. The serif went with the editorial layout.
    families: [
      { name: 'IBM Plex Mono', provider: 'google', weights: [400, 500, 600, 700] },
    ],
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
