<script setup lang="ts">
import type { Appointment } from '@data/agendamentos'
import { computed, ref } from 'vue'
import { ConfirmDialog } from '@components/shared/confirm-dialog'
import { Badge } from '@components/ui/badge'
import { Drawer, DrawerClose, DrawerContent } from '@components/ui/drawer'

const WEEKDAYS = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO']
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

const props = defineProps<{
  open: boolean
  appointment: Appointment | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const formattedDate = computed(() => {
  if (!props.appointment)
    return ''
  const [year, month, day] = props.appointment.date.split('-').map(Number)
  const weekday = new Date(year, month - 1, day).getDay()
  return `${WEEKDAYS[weekday]}, ${day} DE ${MONTHS[month - 1]} · ${props.appointment.time}`
})

const cancelConfirmOpen = ref(false)

function requestCancel() {
  emit('update:open', false)
  cancelConfirmOpen.value = true
}

function backToDetails() {
  cancelConfirmOpen.value = false
  emit('update:open', true)
}

function confirmCancel() {
  // TODO: disparar cancelamento quando a camada dinâmica existir
  cancelConfirmOpen.value = false
}
</script>

<template>
  <Drawer :open="props.open" @update:open="emit('update:open', $event)">
    <DrawerContent
      data-slot="appointment-details-sheet"
      overlay-class="bg-foreground/45 backdrop-blur-none"
      class="gap-4.5 px-5 pt-5 pb-7.5 data-[swipe-direction=down]:rounded-t-3xl"
    >
      <template v-if="appointment">
        <div class="flex items-start justify-between gap-3">
          <div class="flex flex-col gap-1.5">
            <span class="text-muted-foreground text-overline-md">{{ formattedDate }}</span>
            <p class="font-heading text-display-sm text-foreground">
              {{ appointment.clientName }}
            </p>
          </div>

          <Badge :variant="appointment.statusVariant" class="h-auto shrink-0 rounded-md px-2.25 py-1.25 text-overline">
            {{ appointment.statusLabel }}
          </Badge>
        </div>

        <div class="flex flex-col gap-2.5 rounded-xl bg-background p-3.5">
          <div class="flex items-center justify-between gap-3">
            <span class="text-caption-lg text-muted-foreground">Serviço</span>
            <span class="text-tag-lg text-foreground">{{ appointment.service }}</span>
          </div>

          <div v-if="appointment.addon" class="flex items-center justify-between gap-3">
            <span class="text-caption-lg text-muted-foreground">{{ appointment.addon.label }}</span>
            <span class="text-tag-lg text-foreground">{{ appointment.addon.value }}</span>
          </div>
        </div>

        <div class="flex gap-2.5">
          <DrawerClose class="flex-1 rounded-xl bg-surface p-3.5 text-item-title text-foreground">
            Fechar
          </DrawerClose>

          <button
            type="button"
            class="flex-1 rounded-xl bg-error-bg p-3.5 text-item-title text-error"
            @click="requestCancel"
          >
            Cancelar agendamento
          </button>
        </div>
      </template>
    </DrawerContent>
  </Drawer>

  <ConfirmDialog
    :open="cancelConfirmOpen"
    title="Cancelar este agendamento?"
    description="O cliente será avisado pelo WhatsApp."
    confirm-label="Cancelar"
    @update:open="cancelConfirmOpen = $event"
    @cancel="backToDetails"
    @confirm="confirmCancel"
  />
</template>
