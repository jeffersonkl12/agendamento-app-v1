<script setup lang="ts">
import { computed } from 'vue'
import { AppointmentRow } from '@components/agenda/appointment-row'
import { Skeleton } from '@components/ui/skeleton'
import { useAppointmentAgenda } from '@composables/useAppointmentAgenda'
import { formatWeekdayDayMonth } from '@/libs/format'

const props = defineProps<{ selectedDate: string }>()

const emit = defineEmits<{
  select: [id: string]
}>()

const { summariesOn, isInitialLoading } = useAppointmentAgenda()

const dayLabel = computed(() => formatWeekdayDayMonth(props.selectedDate))

const dayAppointments = computed(() => summariesOn(props.selectedDate))
</script>

<template>
  <section aria-labelledby="day-appointments-title" class="flex flex-col gap-4">
    <header>
      <h2 id="day-appointments-title" class="text-item-title text-foreground">
        {{ dayLabel }}
      </h2>
    </header>

    <div v-if="isInitialLoading" class="flex flex-col gap-3" aria-busy="true">
      <Skeleton v-for="index in 2" :key="index" class="h-16 w-full rounded-2xl" />
    </div>

    <ul v-else-if="dayAppointments.length" class="flex flex-col gap-3">
      <li v-for="appointment in dayAppointments" :key="appointment.id">
        <AppointmentRow :appointment="appointment" @select="emit('select', $event)" />
      </li>
    </ul>

    <p v-else class="text-paragraph text-muted-foreground">
      Nenhum agendamento neste dia
    </p>
  </section>
</template>
