<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@libs/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div data-slot="auth-header" :class="cn('flex flex-col items-center gap-3.5', props.class)">
    <div class="flex size-14 items-center justify-center rounded-2xl bg-primary">
      <span class="text-mark text-primary-foreground">SB</span>
    </div>

    <slot />
  </div>
</template>
