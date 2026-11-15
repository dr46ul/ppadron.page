<script lang="ts" setup>
// Each Locale is a route of its own, and Nuxt remounts a page whose route
// changes and scrolls it to the top. One key for every Locale keeps the Session
// mounted across a language switch, so the Transcript, the prompt history and
// the Enquiry draft survive it, and no scroll leaves the Visitor where they were.
definePageMeta({ key: 'session', scrollToTop: false })
</script>

<template>
  <SessionTerminal />
</template>
