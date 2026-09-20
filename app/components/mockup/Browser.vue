<script lang="ts" setup>
withDefaults(
  defineProps<{
    url?: string
    hideBorder?: boolean
  }>(),
  {
    url: 'https://...',
    hideBorder: false,
  },
)
</script>

<template>
  <div class="mockup-browser border border-base-300 w-full">
    <div class="mockup-browser-toolbar">
      <div class="input">
        {{ url }}
      </div>
    </div>
    <div
      class="grid place-content-center h-80"
      :class="{ 'border-t border-base-300': !hideBorder }"
    >
      <slot />
    </div>
  </div>
</template>
