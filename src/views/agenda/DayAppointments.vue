<script setup lang="ts">
import { computed } from 'vue'
import { AppointmentRow } from '@components/agenda/appointment-row'
import { appointments } from '@data/agendamentos'

const props = defineProps<{ selectedDate: string }>()

const dayLabelFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

// `new Date('YYYY-MM-DD')` é interpretado como UTC e volta um dia em fusos negativos (BRT);
// montar a data pelos componentes garante o dia local correto.
function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const dayLabel = computed(() => capitalize(dayLabelFormatter.format(parseLocalDate(props.selectedDate))))

const dayAppointments = computed(() => appointments.filter(appointment => appointment.date === props.selectedDate))
</script>

<template>
  <section aria-labelledby="day-appointments-title" class="flex flex-col gap-4">
    <header>
      <h2 id="day-appointments-title" class="text-item-title text-foreground">
        {{ dayLabel }}
      </h2>
    </header>

    <ul v-if="dayAppointments.length" class="flex flex-col gap-3">
      <li v-for="appointment in dayAppointments" :key="appointment.id">
        <AppointmentRow :appointment="appointment" />
      </li>
    </ul>

    <p v-else class="text-paragraph text-muted-foreground">
      Nenhum agendamento neste dia
    </p>
  </section>
</template>
