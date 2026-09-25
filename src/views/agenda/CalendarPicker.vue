<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppointmentCalendar } from '@composables/useAppointmentCalendar'
import { parseLocalDate } from '@/libs/format'
import { cn } from '@/libs/utils'

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const selectedDate = defineModel<string>('selectedDate', { required: true })

const { today, buildMonthWeeks, formatMonthLabel } = useAppointmentCalendar()

const initialDate = parseLocalDate(selectedDate.value)
const currentYear = ref(initialDate.getFullYear())
const currentMonthIndex = ref(initialDate.getMonth())

const monthLabel = computed(() => formatMonthLabel(currentYear.value, currentMonthIndex.value))

const weeks = computed(() => buildMonthWeeks(currentYear.value, currentMonthIndex.value))

function shiftMonth(delta: number) {
  const month = new Date(currentYear.value, currentMonthIndex.value + delta, 1)
  currentYear.value = month.getFullYear()
  currentMonthIndex.value = month.getMonth()
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
          <template v-for="(cell, cellIndex) in week" :key="cell?.date ?? `empty-${weekIndex}-${cellIndex}`">
            <button
              v-if="cell"
              type="button"
              :aria-label="cell.ariaLabel"
              :aria-pressed="cell.date === selectedDate"
              :aria-current="cell.date === today ? 'date' : undefined"
              :class="cn(
                'flex h-9.5 flex-col items-center justify-center gap-0.5 rounded-xl text-foreground text-tag-lg',
                cell.state === 'unavailable' && 'text-muted-foreground-soft',
                cell.isToday && 'bg-primary-soft',
                cell.date === selectedDate && 'bg-primary text-primary-foreground',
              )"
              @click="selectedDate = cell.date"
            >
              {{ cell.day }}
              <span
                v-if="cell.state === 'has-appointments'"
                aria-hidden="true"
                :class="cn('size-1 rounded-full', cell.date === selectedDate ? 'bg-primary-foreground' : 'bg-marker')"
              />
            </button>
            <span v-else aria-hidden="true" class="h-9.5" />
          </template>
        </template>
      </div>
    </div>
  </section>
</template>
