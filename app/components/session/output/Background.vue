<script lang="ts" setup>
import type { Profile } from '~/data/profile'

defineProps<{ profile: Profile }>()
</script>

<template>
  <div>
    <div class="flex max-w-prose flex-col gap-3">
      <p
        v-for="(paragraph, index) in profile.background"
        :key="index"
        class="text-prose text-body"
      >
        {{ paragraph }}
      </p>
    </div>

    <template v-if="profile.skills.length > 0">
      <p class="text-muted mt-5 text-meta">
        {{ $t('background.skills') }}
      </p>
      <p class="text-subtle mt-1 text-meta">
        {{ profile.skills.join(' · ') }}
      </p>
    </template>

    <p class="text-muted mt-5 text-meta">
      {{ $t('background.education') }}
    </p>
    <p class="text-body mt-1">
      {{ profile.education.degree }}
    </p>
    <p class="text-subtle mt-1 text-meta">
      {{ profile.education.faculty }}
    </p>
    <p class="text-subtle text-meta">
      {{ profile.education.institution }} · {{ profile.education.year }}
    </p>
  </div>
</template>
