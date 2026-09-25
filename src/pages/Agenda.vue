<script setup lang="ts">
import { reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { AppointmentDetailsSheet } from '@components/agenda/appointment-details-sheet'
import { SegmentedControl } from '@components/shared/segmented-control'
import { useAppointmentAgendaSync } from '@composables/useAppointmentAgenda'
import { useAppointmentCalendar } from '@composables/useAppointmentCalendar'
import { useAppointmentDetails } from '@composables/useAppointmentDetails'
import AppointmentsList from '@views/agenda/AppointmentsList.vue'
import CalendarPicker from '@views/agenda/CalendarPicker.vue'
import DayAppointments from '@views/agenda/DayAppointments.vue'

const VIEW_MODE_OPTIONS = [
  { value: 'calendario', label: 'Calendário' },
  { value: 'lista', label: 'Lista' },
]

useAppointmentAgendaSync()

const { today } = useAppointmentCalendar()
const details = reactive(useAppointmentDetails())

const selectedDate = ref(today.value)
const viewMode = ref('calendario')

async function cancelAppointment() {
  const result = await details.cancel()
  if (result.success)
    toast.success(result.message)
  else
    toast.error(result.message)
}
</script>

<template>
  <h1 class="sr-only">
    Agenda
  </h1>

  <SegmentedControl
    v-model="viewMode"
    :options="VIEW_MODE_OPTIONS"
    aria-label="Modo de visualização"
  />

  <template v-if="viewMode === 'calendario'">
    <CalendarPicker v-model:selected-date="selectedDate" />
    <DayAppointments :selected-date="selectedDate" @select="details.open" />
  </template>
  <AppointmentsList v-else @select="details.open" />

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
</template>
