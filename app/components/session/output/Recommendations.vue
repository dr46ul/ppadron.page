<script lang="ts" setup>
import { recommendations } from '~/data/recommendations'
</script>

<template>
  <div>
    <!-- CONTEXT.md: say plainly where these come from, rather than letting a
         visitor infer client references. -->
    <p class="text-base-content/40 max-w-prose text-xs">
      Verbatim from LinkedIn. Colleagues and managers, not clients.
    </p>

    <ul class="mt-5 flex flex-col gap-6">
      <li
        v-for="(recommendation, index) in recommendations"
        :key="index"
        :style="{ '--i': index }"
        class="border-accent/30 max-w-prose border-l pl-4"
      >
        <blockquote data-placeholder class="text-base-content/85">
          {{ recommendation.quote }}
        </blockquote>
        <p class="text-base-content/45 mt-2 text-xs">
          <span data-placeholder class="text-base-content/70">
            {{ recommendation.name }}
          </span>
          —
          <span data-placeholder>
            {{ recommendation.title }}, {{ recommendation.company }}
          </span>
        </p>
      </li>
    </ul>
  </div>
</template>
