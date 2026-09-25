<script setup lang="ts">
import { reactive } from 'vue'
import { toast } from 'vue-sonner'
import { AppointmentDetailsSheet } from '@components/agenda/appointment-details-sheet'
import { Badge } from '@components/ui/badge'
import { Card } from '@components/ui/card'
import { Skeleton } from '@components/ui/skeleton'
import { useAppointmentDetails } from '@composables/useAppointmentDetails'
import { useAppointmentMetrics } from '@composables/useAppointmentMetrics'

const { upcomingAppointments, isInitialLoading } = useAppointmentMetrics()
const details = reactive(useAppointmentDetails())

async function cancelAppointment() {
  const result = await details.cancel()
  if (result.success)
    toast.success(result.message)
  else
    toast.error(result.message)
}
</script>

<template>
  <section aria-labelledby="home-upcoming-appointments" class="flex flex-col gap-3">
    <header class="flex items-center justify-between gap-3">
      <h2 id="home-upcoming-appointments" class="text-foreground text-subheading">
        Próximos agendamentos
      </h2>
      <RouterLink to="/agenda" class="text-primary text-tag">
        Ver agenda <span aria-hidden="true">→</span>
      </RouterLink>
    </header>

    <div v-if="isInitialLoading" class="flex flex-col gap-2.5" aria-busy="true">
      <Skeleton v-for="index in 3" :key="index" class="h-18 w-full rounded-xl" />
    </div>

    <p v-else-if="!upcomingAppointments.length" class="text-paragraph text-muted-foreground">
      Nenhum agendamento próximo.
    </p>

    <ul v-else class="flex flex-col gap-2.5">
      <li v-for="appointment in upcomingAppointments" :key="appointment.id">
        <button type="button" class="w-full text-left" @click="details.open(appointment.id)">
          <Card class="flex-row items-center gap-3.5 rounded-xl p-4 ring-0">
            <div class="flex w-14 shrink-0 flex-col items-center">
              <span class="text-muted-foreground text-overline">{{ appointment.dayLabel }}</span>
              <span class="text-foreground text-heading-sm">{{ appointment.time }}</span>
            </div>

            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <p class="truncate text-foreground text-item-title">
                {{ appointment.clientName }}
              </p>
              <p class="truncate text-caption text-muted-foreground">
                {{ appointment.templateName }}
              </p>
            </div>

            <Badge
              :variant="appointment.statusVariant"
              class="h-auto rounded-lg border-0 px-2.5 py-1 text-overline"
            >
              {{ appointment.statusLabel }}
            </Badge>
          </Card>
        </button>
      </li>
    </ul>

    <AppointmentDetailsSheet
      v-model:open="details.isOpen"
      :appointment="details.summary"
      :answers="details.answers"
      :service-label="details.serviceLabel"
      :base-value-label="details.baseValueLabel"
      :can-cancel="details.canCancel"
      :is-loading="details.isDetailLoading"
      :is-cancelling="details.isCancelling"
      @cancel="cancelAppointment"
    />
  </section>
</template>
