<script lang="ts" setup>
type FooterDirection = 'horizontal' | 'vertical'

interface Props {
  center?: boolean
  breakpoint?: Breakpoint
  direction?: FooterDirection
}

withDefaults(defineProps<Props>(), {
  breakpoint: undefined,
  direction: 'horizontal',
})
</script>

<template>
  <footer
    class="footer p-10"
    :class="{
      [`${breakpoint}:footer-${direction}`]: breakpoint,
      [`footer-${direction}`]: !breakpoint,
      'footer-center': center,
    }"
  >
    <slot />
  </footer>
</template>
