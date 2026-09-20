<script lang="ts" setup>
defineProps<{
  borderColor?: string
  displayClasses?: string
}>()
</script>

<template>
  <div
    class="mockup-phone"
    :class="{ [`border-[${borderColor}]`]: borderColor }"
  >
    <div class="mockup-phone-camera" />
    <div class="mockup-phone-display" :class="displayClasses">
      <slot />
    </div>
  </div>
</template>
