<script setup lang="ts">
import { computed } from 'vue'
import { AppointmentRow } from '@components/agenda/appointment-row'
import { appointments } from '@data/agendamentos'

const dateHeaderFormatter = new Intl.DateTimeFormat('pt-BR', {
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

interface AppointmentGroup {
  date: string
  dateLabel: string
  items: typeof appointments
}

const groups = computed<AppointmentGroup[]>(() => {
  const sorted = [...appointments].sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))

  const byDate = new Map<string, typeof appointments>()
  for (const appointment of sorted) {
    const bucket = byDate.get(appointment.date) ?? []
    bucket.push(appointment)
    byDate.set(appointment.date, bucket)
  }

  return [...byDate.entries()].map(([date, items]) => ({
    date,
    dateLabel: capitalize(dateHeaderFormatter.format(parseLocalDate(date))),
    items,
  }))
})
</script>

<template>
  <section aria-label="Lista de agendamentos" class="flex flex-col gap-2">
    <template v-for="group in groups" :key="group.date">
      <h2 class="text-label-strong text-muted-foreground">
        {{ group.dateLabel }}
      </h2>

      <ul class="flex flex-col gap-2">
        <li v-for="appointment in group.items" :key="appointment.id">
          <AppointmentRow :appointment="appointment" />
        </li>
      </ul>
    </template>
  </section>
</template>
