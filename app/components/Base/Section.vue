<script lang="ts" setup>
interface Props {
  id: string
  label: string
  noIndexing?: boolean
}
defineProps<Props>()
</script>

<template>
  <div :id class="not-prose text-base-content my-2 lg:my-4 w-full">
    <div class="flex items-center gap-2 pb-3 text-sm font-bold">
      <a
        v-if="!noIndexing"
        :href="`#${id}`"
        class="bg-base-100 hover:bg-primary/10 text-base-content/50 hover:text-base-content border-primary/5 hover:border-primary/10 hover:shadow-base-200 inline-grid size-6 place-content-center rounded-sm border hover:shadow-sm"
      >
        <svg
          id="Flat"
          class="size-3"
          fill="currentColor"
          width="12"
          height="12"
          viewBox="0 0 256 256"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M216,148H172V108h44a12,12,0,0,0,0-24H172V40a12,12,0,0,0-24,0V84H108V40a12,12,0,0,0-24,0V84H40a12,12,0,0,0,0,24H84v40H40a12,12,0,0,0,0,24H84v44a12,12,0,0,0,24,0V172h40v44a12,12,0,0,0,24,0V172h44a12,12,0,0,0,0-24Zm-108,0V108h40v40Z"
          />
        </svg>
      </a>
      <h4 class="text-lg font-semibold">
        {{ label }}
      </h4>
    </div>

    <slot />
  </div>
</template>
