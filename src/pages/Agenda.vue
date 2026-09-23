<script setup lang="ts">
import { ref } from 'vue'
import { SegmentedControl } from '@components/shared/segmented-control'
import AppointmentsList from '@views/agenda/AppointmentsList.vue'
import CalendarPicker from '@views/agenda/CalendarPicker.vue'
import DayAppointments from '@views/agenda/DayAppointments.vue'

const VIEW_MODE_OPTIONS = [
  { value: 'calendario', label: 'Calendário' },
  { value: 'lista', label: 'Lista' },
]

const selectedDate = ref('2026-09-21')
const viewMode = ref('calendario')
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
    <DayAppointments :selected-date="selectedDate" />
  </template>
  <AppointmentsList v-else />
</template>
