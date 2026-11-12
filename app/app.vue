<script lang="ts" setup>
// The module sets no `<html lang>` of its own; the head is read from it here.
const head = useLocaleHead()
useHead({
  htmlAttrs: {
    lang: () => head.value.htmlAttrs?.lang,
  },
})
</script>

<template>
  <div class="bg-base-100 text-base-content min-h-screen antialiased">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
