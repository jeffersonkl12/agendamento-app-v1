<script setup lang="ts">
import type { ScheduleHours } from '@composables/useSchedulingConfigForm'
import { ref } from 'vue'
import { ScheduleHoursSheet } from '@components/configurar-agendamentos/schedule-hours-sheet'
import { Card } from '@components/ui/card'
import { INTERVAL_OPTIONS, TIME_OPTIONS } from '@composables/useSchedulingConfigForm'

defineProps<{ label: string }>()

const hours = defineModel<ScheduleHours>('hours', { required: true })

const scheduleHoursOpen = ref(false)
</script>

<template>
  <section aria-labelledby="schedule-hours-title" class="flex flex-col gap-2.5">
    <h2 id="schedule-hours-title" class="text-foreground text-tag">
      Horário e intervalo
    </h2>

    <Card class="flex-row items-center justify-between gap-3 rounded-2xl p-3.5 ring-0">
      <p class="text-foreground text-paragraph-strong">
        {{ label }}
      </p>
      <button
        type="button"
        class="shrink-0 text-primary text-tag"
        @click="scheduleHoursOpen = true"
      >
        Editar
      </button>
    </Card>

    <ScheduleHoursSheet
      v-model:open="scheduleHoursOpen"
      :hours="hours"
      :time-options="TIME_OPTIONS"
      :interval-options="INTERVAL_OPTIONS"
      @save="hours = $event"
    />
  </section>
</template>
