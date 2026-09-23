<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@libs/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <p
    data-slot="auth-header-description"
    :class="cn('text-center text-caption-lg text-muted-foreground', props.class)"
  >
    <slot />
  </p>
</template>
