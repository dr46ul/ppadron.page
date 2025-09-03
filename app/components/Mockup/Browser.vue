<script lang="ts" setup>
interface Props {
  url?: string
  borderless?: boolean
  height?: number
}
withDefaults(defineProps<Props>(), {
  url: undefined,
  borderless: false,
  height: 80,
})
</script>

<template>
  <div class="mockup-browser border-base-300 border w-full">
    <div class="mockup-browser-toolbar">
      <div class="input">
        {{ url }}
      </div>
    </div>
    <div
      class="grid place-content-center"
      :class="{
        'border-t border-base-300': !borderless,
        [`h-${height}`]: height,
      }"
    >
      <slot />
    </div>
  </div>
</template>
