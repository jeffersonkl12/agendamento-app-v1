<script setup lang="ts">
import { AppointmentRow } from '@components/agenda/appointment-row'
import { Skeleton } from '@components/ui/skeleton'
import { useAppointmentAgenda } from '@composables/useAppointmentAgenda'

const emit = defineEmits<{
  select: [id: string]
}>()

const { groupedByDate, isInitialLoading } = useAppointmentAgenda()
</script>

<template>
  <section aria-label="Lista de agendamentos" class="flex flex-col gap-2">
    <div v-if="isInitialLoading" class="flex flex-col gap-2" aria-busy="true">
      <Skeleton v-for="index in 3" :key="index" class="h-16 w-full rounded-2xl" />
    </div>

    <p v-else-if="!groupedByDate.length" class="text-paragraph text-muted-foreground">
      Nenhum agendamento por enquanto. Eles aparecem aqui assim que os clientes agendarem pelo WhatsApp.
    </p>

    <template v-for="group in groupedByDate" v-else :key="group.date">
      <h2 class="text-label-strong text-muted-foreground">
        {{ group.dateLabel }}
      </h2>

      <ul class="flex flex-col gap-2">
        <li v-for="appointment in group.items" :key="appointment.id">
          <AppointmentRow :appointment="appointment" @select="emit('select', $event)" />
        </li>
      </ul>
    </template>
  </section>
</template>
