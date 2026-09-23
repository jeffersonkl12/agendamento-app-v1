<script setup lang="ts">
import { appointments } from '@data/agendamentos'
import { computed, ref } from 'vue'
import { cn } from '@/libs/utils'

interface CalendarDay {
  iso: string
  day: number
  ariaLabel: string
  hasAppointment: boolean
}

// Célula vazia completa a última semana — o design nunca mostra dias do mês seguinte.
type CalendarCell = CalendarDay | null

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
// Leitura não confirmada no Pencil: o destaque do dia 20 é tratado como "hoje" estático.
const TODAY_ISO = '2026-09-20'

const selectedDate = defineModel<string>('selectedDate', { required: true })

const currentMonth = ref(new Date(2026, 8, 1))

const appointmentDates = new Set(appointments.map(appointment => appointment.date))

const monthLabel = computed(
  () => `${MONTH_NAMES[currentMonth.value.getMonth()]} ${currentMonth.value.getFullYear()}`,
)

const weeks = computed(() => buildWeeks(currentMonth.value))

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// new Date normaliza dia <= 0 para o mês anterior (ex.: 2026-09-00 → 31 de agosto).
function createDay(year: number, monthIndex: number, day: number): CalendarDay {
  const date = new Date(year, monthIndex, day)
  const iso = toIsoDate(date)
  const hasAppointment = appointmentDates.has(iso)
  const dateLabel = `${date.getDate()} de ${MONTH_NAMES[date.getMonth()].toLowerCase()} de ${date.getFullYear()}`
  return {
    iso,
    day: date.getDate(),
    // O dot é aria-hidden; a informação "tem agendamento" chega ao leitor de tela por aqui.
    ariaLabel: hasAppointment ? `${dateLabel}, com agendamento` : dateLabel,
    hasAppointment,
  }
}

function buildWeeks(month: Date): CalendarCell[][] {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const leadingDays = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

  const cells: CalendarCell[] = []
  for (let offset = leadingDays; offset > 0; offset--)
    cells.push(createDay(year, monthIndex, 1 - offset))
  for (let day = 1; day <= daysInMonth; day++)
    cells.push(createDay(year, monthIndex, day))
  while (cells.length % 7 !== 0)
    cells.push(null)

  const rows: CalendarCell[][] = []
  for (let index = 0; index < cells.length; index += 7)
    rows.push(cells.slice(index, index + 7))
  return rows
}

function shiftMonth(delta: number) {
  const month = currentMonth.value
  currentMonth.value = new Date(month.getFullYear(), month.getMonth() + delta, 1)
}
</script>

<template>
  <section aria-labelledby="agenda-month-label" class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <button
        type="button"
        aria-label="Mês anterior"
        class="flex size-8 items-center justify-center rounded-lg bg-surface text-primary text-tag"
        @click="shiftMonth(-1)"
      >
        ‹
      </button>
      <h2 id="agenda-month-label" aria-live="polite" class="font-heading text-heading-lg text-foreground">
        {{ monthLabel }}
      </h2>
      <button
        type="button"
        aria-label="Próximo mês"
        class="flex size-8 items-center justify-center rounded-lg bg-surface text-primary text-tag"
        @click="shiftMonth(1)"
      >
        ›
      </button>
    </div>

    <div class="flex flex-col gap-4">
      <div aria-hidden="true" class="grid grid-cols-7 gap-x-1">
        <span
          v-for="weekday in WEEKDAY_LABELS"
          :key="weekday"
          class="text-center text-muted-foreground-soft text-overline-sm"
        >
          {{ weekday }}
        </span>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <template v-for="(week, weekIndex) in weeks" :key="weekIndex">
          <template v-for="(cell, cellIndex) in week" :key="cell?.iso ?? `empty-${weekIndex}-${cellIndex}`">
            <button
              v-if="cell"
              type="button"
              :aria-label="cell.ariaLabel"
              :aria-pressed="cell.iso === selectedDate"
              :aria-current="cell.iso === TODAY_ISO ? 'date' : undefined"
              :class="cn(
                'flex h-9.5 flex-col items-center justify-center gap-0.5 rounded-xl text-foreground text-tag-lg',
                cell.iso === TODAY_ISO && 'bg-primary-soft',
                cell.iso === selectedDate && 'bg-primary text-primary-foreground',
              )"
              @click="selectedDate = cell.iso"
            >
              {{ cell.day }}
              <span
                v-if="cell.hasAppointment"
                aria-hidden="true"
                :class="cn('size-1 rounded-full', cell.iso === selectedDate ? 'bg-primary-foreground' : 'bg-marker')"
              />
            </button>
            <span v-else aria-hidden="true" class="h-9.5" />
          </template>
        </template>
      </div>
    </div>
  </section>
</template>
