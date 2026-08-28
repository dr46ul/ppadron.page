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
        lang: 'en',
        'data-theme': 'dracula',
      },
      title: 'Pavel Padron',
      meta: [{ name: 'description', content: "Pavel Padron's portfolio" }],
    },
    pageTransition: {
      name: 'page',
      mode: 'out-in',
    },
  },

  css: ['@/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },
})
