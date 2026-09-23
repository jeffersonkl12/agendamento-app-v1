<script setup lang="ts">
import { ref } from 'vue'
import { ScheduleHoursSheet } from '@components/configurar-agendamentos/schedule-hours-sheet'
import { Card } from '@components/ui/card'
import { scheduleSettings } from '@data/configuracao'

const scheduleHoursOpen = ref(false)
</script>

<template>
  <section aria-labelledby="schedule-hours-title" class="flex flex-col gap-2.5">
    <h2 id="schedule-hours-title" class="text-foreground text-tag">
      Horário e intervalo
    </h2>

    <Card class="flex-row items-center justify-between gap-3 rounded-2xl p-3.5 ring-0">
      <p class="text-foreground text-paragraph-strong">
        {{ scheduleSettings.startTime }} às {{ scheduleSettings.endTime }} · intervalo
        {{ scheduleSettings.intervalMinutes }} min
      </p>
      <button
        type="button"
        class="shrink-0 text-primary text-tag"
        @click="scheduleHoursOpen = true"
      >
        Editar
      </button>
    </Card>

    <ScheduleHoursSheet v-model:open="scheduleHoursOpen" />
  </section>
</template>
