<script lang="ts" setup>
import type { Profile } from '~/data/profile'

defineProps<{
  profile: Profile
  /** The Command that prints the longer story; a name, so it is never translated. */
  backgroundCommand: string
}>()

/** The session decides what the background means; this only reports the ask. */
const emit = defineEmits<{ background: [] }>()
</script>

<template>
  <div>
    <h1 class="text-name font-semibold tracking-tight">
      {{ profile.name }}
    </h1>
    <p class="text-subtle text-meta mt-1">
      {{ profile.headline }} · {{ profile.location }}
    </p>
    <!-- The hook carries more weight than the intro it introduces, so it is
         the one line here at full strength. -->
    <p class="text-prose text-base-content mt-4 max-w-prose">
      {{ profile.tagline }}
    </p>
    <p class="text-prose text-body mt-4 max-w-prose">
      {{ profile.intro }}
    </p>
    <p
      v-if="profile.aside"
      class="text-subtle mt-3 max-w-prose text-meta"
    >
      {{ profile.aside }}
    </p>
    <p class="text-subtle mt-3 max-w-prose text-meta">
      <i18n-t keypath="whoami.more" scope="global">
        <template #background>
          <button
            type="button"
            class="link link-accent"
            @click.stop="emit('background')"
          >
            {{ backgroundCommand }}
          </button>
        </template>
      </i18n-t>
    </p>
  </div>
</template>
