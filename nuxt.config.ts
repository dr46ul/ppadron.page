// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true,
  },
  modules: ['@nuxt/eslint', '@nuxt/fonts', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  ui: {
    prefix: 'Nuxt',
    fonts: true,
    colorMode: false,
    theme: {
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error'],
      transitions: true,
      defaultVariants: {
        color: 'primary',
        size: 'lg',
      },
    },
  },
})
