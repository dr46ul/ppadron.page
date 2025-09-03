<script lang="ts" setup>
interface Props {
  url?: string
  borderless?: boolean
  contentClasses?: string
}
withDefaults(defineProps<Props>(), {
  url: undefined,
  borderless: false,
  contentClasses: 'h-80',
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
        [contentClasses]: contentClasses,
        'border-t border-base-300': !borderless,
      }"
    >
      <slot />
    </div>
  </div>
</template>
