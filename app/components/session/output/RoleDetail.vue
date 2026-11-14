<script lang="ts" setup>
import type { Role } from '~/data/experience'

defineProps<{
  roleName: string
  /**
   * Absent when the name matches no Role. That prints its own line rather than
   * the generic Unknown output: the Visitor got the Command right and the name
   * wrong, so what helps is the list of names.
   */
  role?: Role
}>()

/** The Command that lists the Roles: an identifier, so no Locale touches it. */
const listCommand = 'ls ~/experience'
</script>

<template>
  <div v-if="role">
    <!-- The labels below are paragraphs because the Session's outline stops at
         whoami's title. -->
    <p class="flex flex-wrap items-baseline gap-x-3">
      <span class="text-prose font-semibold">{{ role.company }}</span>
      <span class="text-muted text-meta">
        {{ role.title }}
      </span>
    </p>
    <time
      :datetime="role.since"
      class="text-muted mt-1 block text-meta tabular-nums"
    >
      {{ role.exactPeriod }}
    </time>

    <div class="mt-4 flex max-w-prose flex-col gap-3">
      <p
        v-for="(paragraph, index) in role.account"
        :key="index"
        class="text-prose text-body"
      >
        {{ paragraph }}
      </p>
    </div>

    <div
      v-for="project in role.history"
      :key="project.name"
      class="mt-5"
    >
      <p class="text-muted text-meta">
        {{ project.name }}
      </p>
      <p
        v-for="phase in project.phases"
        :key="phase.name"
        class="mt-1 grid gap-x-6 text-meta sm:grid-cols-[9rem_1fr]"
      >
        <span class="text-muted">{{ phase.name }}</span>
        <span class="text-subtle">{{ phase.tech.join(' · ') }}</span>
      </p>
    </div>

    <template v-if="role.stack.length > 0">
      <p class="text-muted mt-5 text-meta">
        {{ $t('roleDetail.techStack') }}
      </p>
      <p class="text-subtle mt-1 text-meta">
        {{ role.stack.join(' · ') }}
      </p>
    </template>
  </div>

  <p
    v-else
    class="text-error text-meta"
  >
    <i18n-t keypath="roleDetail.notFound" scope="global">
      <template #role>
        {{ roleName }}
      </template>
      <template #list>
        <span class="text-accent">{{ listCommand }}</span>
      </template>
    </i18n-t>
  </p>
</template>
