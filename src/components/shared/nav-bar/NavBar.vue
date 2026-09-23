<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { PhList } from '@phosphor-icons/vue'
import { cn } from '@/libs/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{
  menuClick: []
}>()
</script>

<template>
  <header
    data-slot="nav-bar"
    :class="cn('bg-background text-foreground border-foreground/8 flex h-15 w-full items-center justify-between border-b px-5', props.class)"
  >
    <button
      type="button"
      aria-label="Abrir menu"
      class="bg-surface text-primary focus-visible:ring-ring flex size-9.5 items-center justify-center rounded-xl outline-none focus-visible:ring-2"
      @click="emit('menuClick')"
    >
      <PhList class="size-5" aria-hidden="true" />
    </button>

    <div class="text-heading-sm">
      <slot />
    </div>

    <div class="flex items-center">
      <slot name="actions" />
    </div>
  </header>
</template>
