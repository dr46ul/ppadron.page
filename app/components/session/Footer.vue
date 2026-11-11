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
    <!-- The library's link draws its focus ring in the text colour; without
         `link-accent` the ring is set back to the accent here. -->
    <p class="text-subtle flex gap-4">
      <a
        class="link link-hover focus-visible:outline-accent"
        :href="profile.links.github"
        rel="noopener"
        @click.stop
      >
        GitHub
      </a>
      <a
        class="link link-hover focus-visible:outline-accent"
        :href="profile.links.linkedin"
        rel="noopener"
        @click.stop
      >
        LinkedIn
      </a>
    </p>
  </footer>
</template>
