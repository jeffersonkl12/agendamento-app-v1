<script setup lang="ts">
import type { WeekdayKey } from '@composables/useSchedulingConfigForm'
import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group'
import { WEEKDAYS } from '@composables/useSchedulingConfigForm'

const enabledDays = defineModel<WeekdayKey[]>('enabledDays', { required: true })
</script>

<template>
  <section aria-labelledby="availability-days-title" class="flex flex-col gap-5">
    <p class="text-caption-md text-muted-foreground">
      Defina quando você está disponível
    </p>

    <div class="flex flex-col gap-2.5">
      <h2 id="availability-days-title" class="text-foreground text-tag">
        Dias da semana
      </h2>

      <ToggleGroup
        v-model="enabledDays"
        type="multiple"
        :spacing="2"
        aria-labelledby="availability-days-title"
        class="w-full flex-wrap"
      >
        <ToggleGroupItem
          v-for="day in WEEKDAYS"
          :key="day.key"
          :value="day.key"
          class="h-9.5 rounded-xl bg-surface px-3.5 text-muted-foreground text-tag hover:bg-surface hover:text-muted-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {{ day.label }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  </section>
</template>
