<script lang="ts" setup>
/**
 * One key, drawn as a cap: a glyph for the keys that have one, its name otherwise.
 * A glyph cap drops the library's inline padding so it stays square, and every cap
 * drops the thicker bottom edge, which pushes the content off centre. A named key
 * is trimmed to its letters so they sit in the middle rather than leaning high.
 */
defineProps<{ glyph?: keyof typeof KEYS }>()

const { t } = useI18n()

/** Spoken names, with every Message key written out as a literal. */
const names = computed(() => ({
  up: t('keys.up'),
  down: t('keys.down'),
  enter: t('keys.enter'),
}) satisfies Record<keyof typeof KEYS, string>)
</script>

<script lang="ts">
const KEYS = {
  up: { path: 'M8 13V3M4 7l4-4 4 4' },
  down: { path: 'M8 3v10M4 9l4 4 4-4' },
  enter: { path: 'M13 3v6H3M6 6 3 9l3 3' },
}
</script>

<template>
  <kbd class="kbd kbd-sm border-b" :class="glyph && 'px-0'">
    <template v-if="glyph">
      <svg aria-hidden="true" viewBox="0 0 16 16"><path :d="KEYS[glyph].path" /></svg>
      <span class="sr-only">{{ names[glyph] }}</span>
    </template>
    <span v-else class="centre-on-letters"><slot /></span>
  </kbd>
</template>
