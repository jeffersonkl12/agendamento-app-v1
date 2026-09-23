<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ref } from 'vue'
import { AppointmentDetailsSheet } from '@components/agenda/appointment-details-sheet'
import { Badge } from '@components/ui/badge'
import { Card } from '@components/ui/card'
import { cn } from '@/libs/utils'
import type { Appointment } from '@data/agendamentos'

// Sem <slot /> por design: o card sempre renderiza os mesmos 4 campos de um Appointment,
// não há conteúdo projetável — props tipadas são o contrato mais honesto aqui (R5).
const props = defineProps<{
  appointment: Appointment
  class?: HTMLAttributes['class']
}>()

const detailsOpen = ref(false)
</script>

<template>
  <button type="button" class="w-full text-left" @click="detailsOpen = true">
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
          {{ appointment.service }}
        </span>
      </div>

      <Badge :variant="appointment.statusVariant" class="h-auto rounded-lg px-2.5 py-1.5 text-overline">
        {{ appointment.statusLabel }}
      </Badge>
    </Card>
  </button>

  <AppointmentDetailsSheet v-model:open="detailsOpen" :appointment="appointment" />
</template>
