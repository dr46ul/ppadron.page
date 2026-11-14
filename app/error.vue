<script setup lang="ts">
import type { NuxtError } from '#app'

interface Props {
  error: NuxtError
}
defineProps<Props>()

// This page can render because the i18n plugin failed, so a missing translator
// or Message must not take the way home with it.
function translator() {
  try {
    return useI18n()
  }
  catch {
    return undefined
  }
}
const i18n = translator()
const home = computed(() => i18n?.te('error.home')
  ? i18n.t('error.home')
  : 'Go back home')
</script>

<template>
  <div>
    <h1>{{ error.status }}</h1>
    <NuxtLink to="/">
      {{ home }}
    </NuxtLink>
  </div>
</template>
