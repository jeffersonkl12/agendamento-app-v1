<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { SegmentedControl } from '@components/shared/segmented-control'
import { Drawer, DrawerContent } from '@components/ui/drawer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select'

interface ScheduleHoursValue {
  startTime: string
  endTime: string
  intervalMinutes: number
}

const props = defineProps<{
  open: boolean
  hours: ScheduleHoursValue
  timeOptions: readonly string[]
  intervalOptions: readonly number[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [value: ScheduleHoursValue]
}>()

const startTime = ref(props.hours.startTime)
const endTime = ref(props.hours.endTime)
const intervalMinutes = ref(String(props.hours.intervalMinutes))

const segmentedIntervalOptions = computed(() =>
  props.intervalOptions.map(minutes => ({ value: String(minutes), label: `${minutes} min` })),
)

// Rascunho local: reabrir o sheet descarta o que não foi salvo.
watch(() => props.open, (open) => {
  if (!open)
    return
  startTime.value = props.hours.startTime
  endTime.value = props.hours.endTime
  intervalMinutes.value = String(props.hours.intervalMinutes)
})

function save() {
  emit('save', {
    startTime: startTime.value,
    endTime: endTime.value,
    intervalMinutes: Number(intervalMinutes.value),
  })
  emit('update:open', false)
}

function cancel() {
  emit('update:open', false)
}

const triggerClass = 'h-auto w-full rounded-xl border-border-subtle bg-white px-2.75 py-2.75 text-paragraph text-foreground data-[size=default]:h-auto md:text-paragraph'
</script>

<template>
  <Drawer :open="props.open" @update:open="emit('update:open', $event)">
    <DrawerContent
      data-slot="schedule-hours-sheet"
      overlay-class="bg-foreground/45 backdrop-blur-none"
      class="gap-4 px-5 pt-5 pb-7 data-[swipe-direction=down]:rounded-t-3xl"
    >
      <h2 class="text-foreground text-subheading">
        Horário de atendimento
      </h2>

      <div class="flex gap-2.5">
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <label id="schedule-start-time-label" class="text-label-strong text-muted-foreground">Início</label>
          <Select v-model="startTime">
            <SelectTrigger aria-labelledby="schedule-start-time-label" :class="triggerClass">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem v-for="time in props.timeOptions" :key="time" :value="time">
                {{ time }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <label id="schedule-end-time-label" class="text-label-strong text-muted-foreground">Fim</label>
          <Select v-model="endTime">
            <SelectTrigger aria-labelledby="schedule-end-time-label" :class="triggerClass">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem v-for="time in props.timeOptions" :key="time" :value="time">
                {{ time }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-label-strong text-muted-foreground">Intervalo entre atendimentos</span>
        <SegmentedControl
          v-model="intervalMinutes"
          :options="segmentedIntervalOptions"
          aria-label="Intervalo entre atendimentos"
        />
      </div>

      <div class="flex gap-2.5 pt-1.5">
        <button type="button" class="flex-1 rounded-xl bg-surface p-3.5 text-item-title text-foreground" @click="cancel">
          Cancelar
        </button>
        <button type="button" class="flex-1 rounded-xl bg-primary p-3.5 text-item-title text-primary-foreground" @click="save">
          Aplicar
        </button>
      </div>
    </DrawerContent>
  </Drawer>
</template>
