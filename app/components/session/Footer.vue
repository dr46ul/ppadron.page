<script lang="ts" setup>
import type { Profile } from '~/data/profile'

defineProps<{ profile: Profile, year: string }>()
</script>

<template>
  <footer
    class="session-gutter text-meta flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
  >
    <p class="text-subtle">
      © {{ year }} {{ profile.name }}
    </p>
    <p class="text-subtle flex gap-4">
      <a
        class="hover:text-base-content"
        :href="profile.links.github"
        rel="noopener"
        @click.stop
      >
        GitHub
      </a>
      <a
        class="hover:text-base-content"
        :href="profile.links.linkedin"
        rel="noopener"
        @click.stop
      >
        LinkedIn
      </a>
    </p>
  </footer>
</template>
