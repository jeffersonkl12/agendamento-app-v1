<script setup lang="ts">
import type { AppointmentAnswerItem } from '@composables/useAppointmentDetails'
import type { AppointmentSummary } from '@composables/useAppointmentSummary'
import { computed, ref } from 'vue'
import { ConfirmDialog } from '@components/shared/confirm-dialog'
import { Badge } from '@components/ui/badge'
import { Drawer, DrawerClose, DrawerContent } from '@components/ui/drawer'
import { Skeleton } from '@components/ui/skeleton'
import { parseLocalDate } from '@/libs/format'

const WEEKDAYS = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO']
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

const props = defineProps<{
  open: boolean
  appointment: AppointmentSummary | null
  answers: AppointmentAnswerItem[]
  serviceLabel: string
  baseValueLabel: string | null
  canCancel: boolean
  isLoading: boolean
  isCancelling: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'cancel': []
}>()

const formattedDate = computed(() => {
  if (!props.appointment)
    return ''
  const date = parseLocalDate(props.appointment.date)
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} DE ${MONTHS[date.getMonth()]} · ${props.appointment.time}`
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
  cancelConfirmOpen.value = false
  emit('cancel')
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

        <div v-if="isLoading" class="flex flex-col gap-2.5 rounded-xl bg-background p-3.5" aria-busy="true">
          <Skeleton class="h-5 w-full rounded-md" />
          <Skeleton class="h-5 w-3/4 rounded-md" />
        </div>

        <dl v-else class="flex flex-col gap-2.5 rounded-xl bg-background p-3.5">
          <div class="flex items-center justify-between gap-3">
            <dt class="text-caption-lg text-muted-foreground">
              Serviço
            </dt>
            <dd class="text-right text-foreground text-tag-lg">
              {{ serviceLabel }}
            </dd>
          </div>

          <div v-for="answer in answers" :key="answer.id" class="flex items-start justify-between gap-3">
            <dt class="text-caption-lg text-muted-foreground">
              {{ answer.title }}
            </dt>
            <dd class="flex flex-col items-end text-right">
              <span class="text-foreground text-tag-lg">{{ answer.answer }}</span>
              <span v-if="answer.priceLabel" class="text-caption text-muted-foreground">+ {{ answer.priceLabel }}</span>
            </dd>
          </div>

          <div v-if="baseValueLabel" class="flex items-center justify-between gap-3">
            <dt class="text-caption-lg text-muted-foreground">
              Valor base
            </dt>
            <dd class="text-foreground text-tag-lg">
              {{ baseValueLabel }}
            </dd>
          </div>

          <div class="flex items-center justify-between gap-3 border-border-subtle border-t pt-2.5">
            <dt class="text-item-title text-foreground">
              Total
            </dt>
            <dd class="text-foreground text-item-title">
              {{ appointment.totalValueLabel }}
            </dd>
          </div>
        </dl>

        <div class="flex gap-2.5">
          <DrawerClose class="flex-1 rounded-xl bg-surface p-3.5 text-foreground text-item-title">
            Fechar
          </DrawerClose>

          <button
            v-if="canCancel"
            type="button"
            :disabled="isCancelling"
            class="flex-1 rounded-xl bg-error-bg p-3.5 text-error text-item-title disabled:opacity-60"
            @click="requestCancel"
          >
            Cancelar agendamento
          </button>
        </div>
      </template>
    </DrawerContent>
  </Drawer>

  <!-- §12#9: o cancelamento ainda não notifica o cliente no WhatsApp — o prestador precisa saber disso. -->
  <ConfirmDialog
    :open="cancelConfirmOpen"
    title="Cancelar este agendamento?"
    description="O horário será liberado. O cliente ainda não é avisado automaticamente pelo WhatsApp — avise-o você."
    confirm-label="Cancelar"
    @update:open="cancelConfirmOpen = $event"
    @cancel="backToDetails"
    @confirm="confirmCancel"
  />
</template>
