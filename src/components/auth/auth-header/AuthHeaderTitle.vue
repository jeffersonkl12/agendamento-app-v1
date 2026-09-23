<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@libs/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <h1
    data-slot="auth-header-title"
    :class="cn('text-center font-heading text-metric text-foreground', props.class)"
  >
    <slot />
  </h1>
</template>
