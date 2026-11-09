<script lang="ts" setup>
import type { Recommendation } from '~/data/recommendations'

defineProps<{ recommendations: Recommendation[] }>()
</script>

<template>
  <div>
    <!-- CONTEXT.md: say plainly where these come from, rather than letting a
         visitor infer client references. -->
    <p class="text-subtle max-w-prose text-meta">
      Verbatim from LinkedIn. Colleagues and managers, not clients.
    </p>

    <ul class="mt-5 flex flex-col gap-8">
      <li
        v-for="(recommendation, index) in recommendations"
        :key="index"
        :style="{ '--i': index }"
        class="border-accent/45 max-w-prose border-l-2 pl-4"
      >
        <blockquote class="text-prose text-body flex flex-col gap-2">
          <p
            v-for="(paragraph, paragraphIndex) in recommendation.quote"
            :key="paragraphIndex"
          >
            {{ paragraph }}
          </p>
        </blockquote>
        <p class="text-subtle mt-2 text-meta">
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
