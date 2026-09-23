<script setup lang="ts">
import type { Appointment } from '@data/agendamentos'
import { ref } from 'vue'
import { AppointmentDetailsSheet } from '@components/agenda/appointment-details-sheet'
import { Badge } from '@components/ui/badge'
import { Card } from '@components/ui/card'
import { upcomingAppointments } from '@data/agendamentos'

const selectedAppointment = ref<Appointment | null>(null)
const detailsOpen = ref(false)

function openDetails(appointment: Appointment) {
  selectedAppointment.value = appointment
  detailsOpen.value = true
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

    <ul class="flex flex-col gap-2.5">
      <li v-for="appointment in upcomingAppointments" :key="appointment.id">
        <button type="button" class="w-full text-left" @click="openDetails(appointment)">
          <Card class="flex-row items-center gap-3.5 rounded-xl p-4 ring-0">
            <div class="flex w-14 shrink-0 flex-col items-center">
              <span class="text-muted-foreground text-overline">{{ appointment.day }}</span>
              <span class="text-foreground text-heading-sm">{{ appointment.time }}</span>
            </div>

            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <p class="truncate text-foreground text-item-title">
                {{ appointment.clientName }}
              </p>
              <p class="truncate text-caption text-muted-foreground">
                {{ appointment.service }}
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

    <AppointmentDetailsSheet v-model:open="detailsOpen" :appointment="selectedAppointment" />
  </section>
</template>
