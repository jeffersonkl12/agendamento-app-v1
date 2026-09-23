<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group'
import { cn } from '@/libs/utils'

export interface SegmentedControlOption {
  value: string
  label: string
}

const props = defineProps<{
  modelValue: string
  options: SegmentedControlOption[]
  ariaLabel?: string
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ToggleGroup type="single" emite undefined ao clicar no item já ativo — ignorado para manter sempre um valor selecionado.
function select(value: unknown) {
  if (typeof value === 'string')
    emit('update:modelValue', value)
}
</script>

<template>
  <ToggleGroup
    type="single"
    data-slot="segmented-control"
    :model-value="props.modelValue"
    :spacing="1"
    :aria-label="props.ariaLabel"
    :class="cn('h-11 w-full rounded-xl bg-surface p-1', props.class)"
    @update:model-value="select"
  >
    <ToggleGroupItem
      v-for="option in props.options"
      :key="option.value"
      :value="option.value"
      class="h-full flex-1 rounded-lg text-muted-foreground text-tag data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
    >
      {{ option.label }}
    </ToggleGroupItem>
  </ToggleGroup>
</template>
