<script setup lang="ts">
import { ref, watch } from 'vue'
import { SegmentedControl } from '@components/shared/segmented-control'
import { Drawer, DrawerContent } from '@components/ui/drawer'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select'
import { scheduleSettings } from '@data/configuracao'

const INTERVAL_OPTIONS = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
]

function buildTimeOptions(): string[] {
  const times: string[] = []
  for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
    const hours = Math.floor(minutes / 60).toString().padStart(2, '0')
    const mins = (minutes % 60).toString().padStart(2, '0')
    times.push(`${hours}:${mins}`)
  }
  return times
}

const TIME_OPTIONS = buildTimeOptions()

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const startTime = ref(scheduleSettings.startTime)
const endTime = ref(scheduleSettings.endTime)
const intervalMinutes = ref(String(scheduleSettings.intervalMinutes))

watch(() => props.open, (open) => {
  if (!open)
    return
  startTime.value = scheduleSettings.startTime
  endTime.value = scheduleSettings.endTime
  intervalMinutes.value = String(scheduleSettings.intervalMinutes)
})

function save() {
  // TODO: persistir horário de atendimento quando a camada dinâmica existir
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
              <SelectItem v-for="time in TIME_OPTIONS" :key="time" :value="time">
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
              <SelectItem v-for="time in TIME_OPTIONS" :key="time" :value="time">
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
          :options="INTERVAL_OPTIONS"
          aria-label="Intervalo entre atendimentos"
        />
      </div>

      <div class="flex gap-2.5 pt-1.5">
        <button type="button" class="flex-1 rounded-xl bg-surface p-3.5 text-item-title text-foreground" @click="cancel">
          Cancelar
        </button>
        <button type="button" class="flex-1 rounded-xl bg-primary p-3.5 text-item-title text-primary-foreground" @click="save">
          Salvar
        </button>
      </div>
    </DrawerContent>
  </Drawer>
</template>
