<script setup lang="ts">
import type { MetricsPeriod } from '@composables/useAppointmentMetrics'
import { computed, ref } from 'vue'
import { Card } from '@components/ui/card'
import { Skeleton } from '@components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group'
import { useAppointmentMetrics } from '@composables/useAppointmentMetrics'

const period = ref<MetricsPeriod>('month')

const PERIOD_OPTIONS: { value: MetricsPeriod, label: string }[] = [
  { value: 'month', label: 'Este mês' },
  { value: 'total', label: 'Total' },
]

const { metricsByPeriod, isInitialLoading } = useAppointmentMetrics()

function isPeriod(value: unknown): value is MetricsPeriod {
  return PERIOD_OPTIONS.some(option => option.value === value)
}

// ToggleGroup type="single" emite undefined ao clicar no item já ativo — ignorado para manter sempre um período selecionado.
function selectPeriod(value: unknown) {
  if (isPeriod(value))
    period.value = value
}

const currentMetrics = computed(() => metricsByPeriod.value[period.value])

const statCards = computed(() => [
  { label: 'Faturamento', value: currentMetrics.value.revenueLabel },
  { label: 'Agendamentos', value: String(currentMetrics.value.appointmentsCount) },
])
</script>

<template>
  <section aria-label="Resumo do período" class="flex flex-col gap-3">
    <ToggleGroup
      type="single"
      :model-value="period"
      :spacing="1"
      aria-label="Período"
      class="h-11 w-full rounded-xl bg-surface p-1"
      @update:model-value="selectPeriod"
    >
      <ToggleGroupItem
        v-for="option in PERIOD_OPTIONS"
        :key="option.value"
        :value="option.value"
        class="h-full flex-1 rounded-lg text-muted-foreground text-tag aria-pressed:bg-primary aria-pressed:text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        {{ option.label }}
      </ToggleGroupItem>
    </ToggleGroup>

    <dl class="grid grid-cols-2 gap-3">
      <Card
        v-for="stat in statCards"
        :key="stat.label"
        class="gap-1.5 rounded-xl p-4 ring-0"
      >
        <dt class="text-label-strong text-muted-foreground">
          {{ stat.label }}
        </dt>
        <dd class="font-heading text-foreground text-metric">
          <Skeleton v-if="isInitialLoading" class="h-8 w-20 rounded-md" />
          <template v-else>
            {{ stat.value }}
          </template>
        </dd>
      </Card>
    </dl>

    <Card class="flex-row items-center justify-between gap-4 rounded-xl bg-primary p-4 ring-0">
      <dl class="flex flex-col gap-1.5">
        <dt class="text-label-strong text-primary-soft">
          Ticket médio
        </dt>
        <dd class="font-heading text-metric-sm text-primary-foreground">
          <Skeleton v-if="isInitialLoading" class="h-7 w-24 rounded-md bg-primary-soft/40" />
          <template v-else>
            {{ currentMetrics.averageTicketLabel }}
          </template>
        </dd>
      </dl>
      <p class="max-w-28 text-right text-caption text-primary-soft">
        por atendimento confirmado no período
      </p>
    </Card>
  </section>
</template>
