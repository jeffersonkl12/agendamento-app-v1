<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { AppointmentSummary } from '@composables/useAppointmentSummary'
import { Badge } from '@components/ui/badge'
import { Card } from '@components/ui/card'
import { cn } from '@/libs/utils'

// Sem <slot /> por design: o card sempre renderiza os mesmos 4 campos de um agendamento,
// não há conteúdo projetável — props tipadas são o contrato mais honesto aqui (R5).
const props = defineProps<{
  appointment: AppointmentSummary
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <button type="button" class="w-full text-left" @click="emit('select', props.appointment.id)">
    <Card
      data-slot="appointment-row"
      :class="cn('flex-row items-center gap-4 rounded-2xl px-4 py-3.5 ring-0', props.class)"
    >
      <span class="w-11 shrink-0 text-item-title text-foreground">
        {{ appointment.time }}
      </span>

      <div class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-item-title text-foreground">
          {{ appointment.clientName }}
        </span>
        <span class="truncate text-label-lg text-muted-foreground">
          {{ appointment.templateName }}
        </span>
      </div>

      <Badge :variant="appointment.statusVariant" class="h-auto rounded-lg px-2.5 py-1.5 text-overline">
        {{ appointment.statusLabel }}
      </Badge>
    </Card>
  </button>
</template>
