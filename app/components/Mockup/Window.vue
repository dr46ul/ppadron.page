<script lang="ts" setup>
interface Props {
  borderless?: boolean
  contentClasses?: string
}
withDefaults(defineProps<Props>(), {
  borderless: false,
  contentClasses: 'h-80',
})
</script>

<template>
  <div class="mockup-window border border-base-300 w-full">
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
