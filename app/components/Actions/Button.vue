<script lang="ts" setup>
interface Props {
  color?: BaseColor
  style?: ButtonStyle
  size?: Breakpoint
  modifier?: ButtonModifier
  active?: boolean
  disabled?: boolean
}
withDefaults(defineProps<Props>(), {
  color: 'primary',
  style: undefined,
  behavior: 'active',
  size: 'sm',
  modifier: undefined,
  disabled: undefined,
})
</script>

<template>
  <button
    class="btn"
    :class="{
      [`btn-${color}`]: color,
      [`btn-${style}`]: style,
      'btn-active': active && !disabled,
      'btn-disabled': disabled,
      [`btn-${size}`]: size,
      [`btn-${modifier}`]: modifier,
    }"
    :disabled
  >
    <slot />
  </button>
</template>
