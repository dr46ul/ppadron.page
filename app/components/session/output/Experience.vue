<script lang="ts" setup>
import type { Role } from '~/data/experience'

defineProps<{ roles: Role[] }>()

const emit = defineEmits<{ open: [slug: string] }>()

/**
 * Selecting the name by dragging across it also ends in a click, which is not a
 * request to open. A pointer click has already collapsed any older selection,
 * so one still standing is this gesture's. The keyboard collapses nothing, and
 * its click (detail 0) has to work with text selected anywhere on the page.
 */
function open(event: MouseEvent, slug: string) {
  if (event.detail > 0 && window.getSelection()!.toString())
    return
  emit('open', slug)
}
</script>

<template>
  <div>
    <!-- ADR-0001: there is no Work section, and a visitor arriving at a
         developer's site will notice. Say why rather than let them wonder. -->
    <p class="text-subtle max-w-prose text-xs">
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
          :class="index === 0 ? 'text-accent' : 'text-muted'"
        >
          {{ role.period }}
        </time>

        <div>
          <!-- The button stops at the name so the summary below stays plain
               text to select. `.stop` because the session behind it would put
               the caret in the prompt and take focus off the list. -->
          <button
            type="button"
            class="group flex w-full flex-wrap items-baseline gap-x-3 text-left select-text pointer-coarse:min-h-11 pointer-coarse:items-center"
            @click.stop="open($event, role.slug)"
          >
            <span class="decoration-edge group-hover:text-accent font-semibold underline underline-offset-4">{{ role.company }}</span>
            <span class="text-muted text-xs">
              {{ role.title }}
            </span>
          </button>
          <p class="text-body mt-1 max-w-prose">
            {{ role.summary }}
          </p>
          <p class="text-subtle mt-1 text-xs">
            {{ role.tech.join(' · ') }}
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>
