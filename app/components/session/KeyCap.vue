<script lang="ts" setup>
/** One key, drawn as a cap: a glyph for the keys that have one, its name otherwise. */
defineProps<{ glyph?: keyof typeof GLYPHS }>()
</script>

<script lang="ts">
const GLYPHS = {
  up: 'M8 13V3M4 7l4-4 4 4',
  down: 'M8 3v10M4 9l4 4 4-4',
  enter: 'M13 3v6H3M6 6 3 9l3 3',
}

const NAMES = {
  up: 'up arrow',
  down: 'down arrow',
  enter: 'enter',
}
</script>

<template>
  <kbd class="kbd kbd-sm">
    <template v-if="glyph">
      <svg aria-hidden="true" viewBox="0 0 16 16"><path :d="GLYPHS[glyph]" /></svg>
      <span class="sr-only">{{ NAMES[glyph] }}</span>
    </template>
    <slot v-else />
  </kbd>
</template>
