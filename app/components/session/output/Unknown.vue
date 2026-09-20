<script lang="ts" setup>
defineProps<{ cmd: string }>()

const { exec } = injectSession()
</script>

<template>
  <p class="text-error text-xs">
    {{ cmd }}: command not found — try
    <button
      type="button"
      class="text-accent underline"
      @click.stop="exec('help')"
    >
      help
    </button>
  </p>
</template>
