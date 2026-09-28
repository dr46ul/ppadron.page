<script lang="ts" setup>
import type { Recommendation } from '~/data/recommendations'

defineProps<{ recommendations: Recommendation[] }>()
</script>

<template>
  <div>
    <!-- CONTEXT.md: say plainly where these come from, rather than letting a
         visitor infer client references. -->
    <p class="text-subtle max-w-prose text-xs">
      Verbatim from LinkedIn. Colleagues and managers, not clients.
    </p>

    <ul class="mt-5 flex flex-col gap-6">
      <li
        v-for="(recommendation, index) in recommendations"
        :key="index"
        :style="{ '--i': index }"
        class="border-accent/30 max-w-prose border-l pl-4"
      >
        <blockquote class="text-body">
          {{ recommendation.quote }}
        </blockquote>
        <p class="text-subtle mt-2 text-xs">
          <span class="text-body">
            {{ recommendation.name }}
          </span>
          —
          <span>
            {{ recommendation.title }}, {{ recommendation.company }}
          </span>
        </p>
      </li>
    </ul>
  </div>
</template>
