<script lang="ts" setup>
defineProps<{ cmd: string }>()

/** The session decides what `help` means; this only reports the ask. */
const emit = defineEmits<{ help: [] }>()
</script>

<template>
  <p class="text-error text-meta">
    {{ cmd }}: command not found — try
    <button
      type="button"
      class="link link-accent"
      @click.stop="emit('help')"
    >
      help
    </button>
  </p>
</template>
