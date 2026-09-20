<script lang="ts" setup>
/**
 * ADR-0001 makes this repository the site's compensating public work sample,
 * which is why the source link is given this much room rather than being
 * buried in a row of social icons.
 */
</script>

<template>
  <div>
    <p class="text-base-content/75 max-w-prose">
      No projects gallery, so this page is the work sample: a statically
      prerendered Nuxt site with one serverless function behind the form, and
      the whole of it is readable.
    </p>
    <p>
      <a
        class="text-accent mt-3 inline-block hover:underline"
        href="https://github.com/dr46ul/ppadron.page"
        rel="noopener"
        @click.stop
      >
        → github.com/dr46ul/ppadron.page
      </a>
    </p>
    <p class="text-base-content/35 mt-4 text-xs">
      vue · nuxt · typescript · tailwind · daisyui · vitest · vercel
    </p>
    <p class="text-base-content/35 mt-6 text-xs">
      © {{ new Date().getFullYear() }} Pavel Padron ·
      <a
        class="hover:text-base-content"
        href="https://github.com/dr46ul"
        rel="noopener"
        @click.stop
      >
        GitHub
      </a>
      ·
      <a data-placeholder class="hover:text-base-content" href="#" @click.stop
        >[LinkedIn]</a
      >
    </p>
  </div>
</template>
