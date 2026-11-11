<script lang="ts" setup>
/**
 * One key, drawn as a cap: a glyph for the keys that have one, its name otherwise.
 * A glyph cap drops the library's inline padding so it stays square, and every cap
 * drops the thicker bottom edge, which pushes the content off centre.
 */
defineProps<{ glyph?: keyof typeof KEYS }>()
</script>

<script lang="ts">
const KEYS = {
  up: { name: 'up arrow', path: 'M8 13V3M4 7l4-4 4 4' },
  down: { name: 'down arrow', path: 'M8 3v10M4 9l4 4 4-4' },
  enter: { name: 'enter', path: 'M13 3v6H3M6 6 3 9l3 3' },
}
</script>

<template>
  <kbd class="kbd kbd-sm border-b" :class="glyph && 'px-0'">
    <template v-if="glyph">
      <svg aria-hidden="true" viewBox="0 0 16 16"><path :d="KEYS[glyph].path" /></svg>
      <span class="sr-only">{{ KEYS[glyph].name }}</span>
    </template>
    <slot v-else />
  </kbd>
</template>
