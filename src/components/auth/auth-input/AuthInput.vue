<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Input } from '@components/ui/input'
import { cn } from '@libs/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Input
    data-slot="auth-input"
    :class="
      cn(
        'h-11.25 rounded-[12px] border-[1.5px] border-border-subtle bg-card px-3.5 text-paragraph text-foreground md:text-paragraph aria-invalid:border-error aria-invalid:ring-0',
        props.class,
      )
    "
  />
</template>
