<script setup lang="ts">
import type { NuxtError } from '#app'

interface Props {
  error: NuxtError
}
defineProps<Props>()

// This page can render because the i18n plugin failed, so a missing translator
// must not take the way home with it.
function homeLabel() {
  try {
    return useI18n().t('error.home')
  }
  catch {
    return 'Go back home'
  }
}
const home = homeLabel()
</script>

<template>
  <div>
    <h1>{{ error.status }}</h1>
    <NuxtLink to="/">
      {{ home }}
    </NuxtLink>
  </div>
</template>
