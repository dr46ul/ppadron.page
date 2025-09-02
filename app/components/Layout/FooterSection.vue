<script lang="ts" setup>
defineProps<MenuSection>()
</script>

<template>
  <nav :id>
    <h6 v-if="heading" class="footer-title">
      {{ heading }}
    </h6>
    <NuxtLink
      v-for="(item, index) in items"
      :key="`option-${index}`"
      :to="item.to || item.href"
      class="link link-hover"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>
