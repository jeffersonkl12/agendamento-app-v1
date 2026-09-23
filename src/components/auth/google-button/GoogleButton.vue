<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import IconGoogle from '@components/icons/IconGoogle.vue'
import { Button } from '@components/ui/button'
import { cn } from '@libs/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Button
    data-slot="google-button"
    type="button"
    variant="outline"
    :class="
      cn(
        'h-12 w-full gap-2.5 rounded-xl border-[1.5px] border-border-subtle bg-card px-3.5 text-button-strong text-foreground',
        props.class,
      )
    "
  >
    <IconGoogle class="size-4.5" aria-hidden="true" />
    <slot />
  </Button>
</template>
