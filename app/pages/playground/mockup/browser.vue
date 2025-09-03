<script lang="ts" setup>
const url = 'https://ppadron.com'
</script>

<template>
  <div class="flex flex-col items-center gap-6 w-auto m-auto max-w-7xl p-8">
    <MockupBrowser :url> browser mockup with border </MockupBrowser>

    <MockupBrowser :url borderless>
      browser mockup with background color
    </MockupBrowser>
  </div>
</template>
