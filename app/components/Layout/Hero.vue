<script lang="ts" setup>
interface Props {
  contentClasses?: string
  overlayImage?: string
  parallax?: boolean
}
const props = defineProps<Props>()

const overlay = computed(() =>
  props.overlayImage ? `url(${props.overlayImage})` : 'none',
)
</script>

<template>
  <div class="hero min-h-screen">
    <div
      v-if="overlayImage"
      class="hero-overlay"
      :class="{ 'is-parallax': parallax }"
    />
    <div class="hero-content" :class="contentClasses">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.hero-overlay {
  background-image: v-bind(overlay);
  background-repeat: no-repeat;
  background-size: cover;
}

.is-parallax {
  background-attachment: fixed;
}
</style>
