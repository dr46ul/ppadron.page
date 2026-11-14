<script lang="ts" setup>
// The module sets no `<html lang>` or `og:*` tags of its own; the head is read
// from it here, and the title and description come from Messages.
const { t } = useI18n()
const head = useLocaleHead({ seo: true })
const title = () => t('head.title')
const description = () => t('head.description')
useHead({
  htmlAttrs: {
    lang: () => head.value.htmlAttrs?.lang,
  },
  link: () => head.value.link,
  meta: () => head.value.meta,
})
useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
})
</script>

<template>
  <div class="bg-base-100 text-base-content min-h-screen antialiased">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
