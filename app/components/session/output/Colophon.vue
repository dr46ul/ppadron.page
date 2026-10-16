<script lang="ts" setup>
/**
 * ADR-0001 makes this repository the site's compensating public work sample,
 * which is why the source link is given this much room rather than being
 * buried in a row of social icons.
 */
import type { Profile } from '~/data/profile'

const props = defineProps<{ profile: Profile, year: number }>()

/** The repo URL as a terminal would print a path: no scheme in the way. */
const repoLabel = computed(() =>
  props.profile.links.repo.replace(/^https?:\/\//, ''),
)
</script>

<template>
  <div>
    <p class="text-body max-w-prose">
      No projects gallery, so this page is the work sample: a statically
      prerendered Nuxt site with one serverless function behind the form, and
      the whole of it is readable.
    </p>
    <p>
      <a
        class="text-accent mt-3 inline-block hover:underline"
        :href="profile.links.repo"
        rel="noopener"
        @click.stop
      >
        → {{ repoLabel }}
      </a>
    </p>
    <p
      v-if="profile.stack.length > 0"
      class="text-subtle mt-4 text-xs"
    >
      {{ profile.stack.join(' · ') }}
    </p>
    <p class="text-subtle mt-6 text-xs">
      © {{ year }} {{ profile.name }} ·
      <a
        class="hover:text-base-content"
        :href="profile.links.github"
        rel="noopener"
        @click.stop
      >
        GitHub
      </a>
      ·
      <a
        class="hover:text-base-content"
        :href="profile.links.linkedin"
        rel="noopener"
        @click.stop
      >
        LinkedIn
      </a>
    </p>
  </div>
</template>
