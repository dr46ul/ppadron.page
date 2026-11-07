<script lang="ts" setup>
import type { Profile } from '~/data/profile'

defineProps<{ profile: Profile }>()
</script>

<template>
  <div>
    <!-- The labels below are paragraphs because the Session's outline stops at
         whoami's title. -->
    <div class="flex max-w-prose flex-col gap-3">
      <p
        v-for="(paragraph, index) in profile.background"
        :key="index"
        class="text-body"
      >
        {{ paragraph }}
      </p>
    </div>

    <template v-if="profile.skills.length > 0">
      <p class="text-muted mt-5 text-xs">
        Skills
      </p>
      <p class="text-subtle mt-1 text-xs">
        {{ profile.skills.join(' · ') }}
      </p>
    </template>

    <p class="text-muted mt-5 text-xs">
      Education
    </p>
    <p class="text-body mt-1">
      {{ profile.education.degree }}
    </p>
    <p class="text-subtle mt-1 text-xs">
      {{ profile.education.faculty }}
    </p>
    <p class="text-subtle text-xs">
      {{ profile.education.institution }} · {{ profile.education.year }}
    </p>
  </div>
</template>
