<script setup lang="ts">
import { Card } from '@components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group'
import { type Period, stats } from '@data/home'
import { computed, ref } from 'vue'

const period = ref<Period>('month')

const PERIOD_OPTIONS: { value: Period, label: string }[] = [
  { value: 'month', label: 'Este mês' },
  { value: 'total', label: 'Total' },
]

function isPeriod(value: unknown): value is Period {
  return typeof value === 'string' && value in stats
}

// ToggleGroup type="single" emite undefined ao clicar no item já ativo — ignorado para manter sempre um período selecionado.
function selectPeriod(value: unknown) {
  if (isPeriod(value))
    period.value = value
}

function formatCurrency(value: number, fractionDigits: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

const currentStats = computed(() => stats[period.value])

const statCards = computed(() => [
  { label: 'Faturamento', value: formatCurrency(currentStats.value.revenue, 0) },
  { label: 'Agendamentos', value: String(currentStats.value.appointmentsCount) },
])

const avgTicket = computed(() => formatCurrency(currentStats.value.avgTicket, 2))
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
          {{ stat.value }}
        </dd>
      </Card>
    </dl>

    <Card class="flex-row items-center justify-between gap-4 rounded-xl bg-primary p-4 ring-0">
      <dl class="flex flex-col gap-1.5">
        <dt class="text-label-strong text-primary-soft">
          Ticket médio
        </dt>
        <dd class="font-heading text-metric-sm text-primary-foreground">
          {{ avgTicket }}
        </dd>
      </dl>
      <p class="max-w-28 text-right text-caption text-primary-soft">
        por atendimento no período
      </p>
    </Card>
  </section>
</template>
