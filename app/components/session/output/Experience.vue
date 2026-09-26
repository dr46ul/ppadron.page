<script lang="ts" setup>
import type { Role } from '~/data/experience'

defineProps<{ roles: Role[] }>()
</script>

<template>
  <div>
    <!-- ADR-0001: there is no Work section, and a visitor arriving at a
         developer's site will notice. Say why rather than let them wonder. -->
    <p class="text-base-content/40 max-w-prose text-xs">
      Freelance client work is under NDA, so there is no projects gallery. This
      is the work itself.
    </p>

    <ul class="mt-5 flex flex-col gap-6">
      <li
        v-for="(role, index) in roles"
        :key="role.since"
        :style="{ '--i': index }"
        class="grid gap-x-6 gap-y-1 sm:grid-cols-[8.5rem_1fr]"
      >
        <time
          :datetime="role.since"
          class="text-xs tabular-nums"
          :class="index === 0 ? 'text-accent' : 'text-base-content/40'"
        >
          {{ role.period }}
        </time>

        <div>
          <p class="flex flex-wrap items-baseline gap-x-3">
            <span class="font-semibold">{{ role.company }}</span>
            <span class="text-base-content/45 text-xs">
              {{ role.title }}
            </span>
          </p>
          <p class="text-base-content/75 mt-1 max-w-prose">
            {{ role.summary }}
          </p>
          <p class="text-base-content/35 mt-1 text-xs">
            {{ role.tech.join(' · ') }}
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>
