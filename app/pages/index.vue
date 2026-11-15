<script lang="ts" setup>
// Each Locale is a route of its own, and Nuxt remounts a page whose route
// changes. One key for every Locale keeps the Session mounted across a language
// switch, so the Transcript, the prompt history and the Enquiry draft survive it.
definePageMeta({ key: 'session' })
</script>

<template>
  <SessionTerminal />
</template>
