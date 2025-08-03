<script setup lang="ts">
import type { NuxtError } from '#app'

type Props = {
  error: NuxtError
}
defineProps<Props>()
</script>

<template>
  <div>
    <h1>{{ error.statusCode }}</h1>
    <NuxtLink to="/">Go back home</NuxtLink>
  </div>
</template>
