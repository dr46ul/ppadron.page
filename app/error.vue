<script setup lang="ts">
import type { NuxtError } from '#app'

interface Props {
  error: NuxtError
}
defineProps<Props>()
</script>

<template>
  <div>
    <h1>{{ error.status }}</h1>
    <NuxtLink to="/">
      Go back home
    </NuxtLink>
  </div>
</template>
