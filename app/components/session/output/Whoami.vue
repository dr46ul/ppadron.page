<script lang="ts" setup>
import type { Profile } from '~/data/profile'

defineProps<{ profile: Profile }>()
</script>

<template>
  <div>
    <p class="text-lg font-semibold tracking-tight">
      {{ profile.name }}
    </p>
    <p class="text-base-content/50">
      {{ profile.headline }} · {{ profile.location }}
    </p>
    <p class="text-base-content/80 mt-4 max-w-prose">
      {{ profile.intro }}
    </p>
    <p
      v-if="profile.aside"
      class="text-base-content/50 mt-3 max-w-prose text-xs"
    >
      {{ profile.aside }}
    </p>
  </div>
</template>
