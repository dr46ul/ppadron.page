<script lang="ts" setup>
interface MockupCodeLineObject {
  content: string
  prefix?: string
  class?: string
}

defineProps<{
  lines?: MockupCodeLineObject[]
  hidePrefix?: boolean
}>()
</script>

<template>
  <div class="mockup-code w-full">
    <slot>
      <!-- By position: the lines are printed once and never reordered, and two
           of them can share their content. -->
      <template v-for="(line, index) in lines" :key="index">
        <MockupCodeLine :prefix="line.prefix" :class="line.class" :hide-prefix>
          {{ line.content }}
        </MockupCodeLine>
      </template>
    </slot>
  </div>
</template>
