<script lang="ts" setup>
import type { Profile } from '~/data/profile'

defineProps<{ profile: Profile }>()
</script>

<template>
  <div>
    <p class="text-lg font-semibold tracking-tight">
      {{ profile.name }}
    </p>
    <p class="text-subtle">
      {{ profile.headline }} · {{ profile.location }}
    </p>
    <!-- The hook carries more weight than the intro it introduces, so it is
         the one line here at full strength. -->
    <p class="text-base-content mt-4 max-w-prose">
      {{ profile.tagline }}
    </p>
    <p class="text-body mt-4 max-w-prose">
      {{ profile.intro }}
    </p>
    <p
      v-if="profile.aside"
      class="text-subtle mt-3 max-w-prose text-xs"
    >
      {{ profile.aside }}
    </p>
  </div>
</template>
