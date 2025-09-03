<script lang="ts" setup>
interface Props {
  contentClasses?: string
}
defineProps<Props>()
</script>

<template>
  <div class="mockup-phone">
    <div class="mockup-phone-camera" />
    <div class="mockup-phone-display" :class="contentClasses">
      <slot />
    </div>
  </div>
</template>
