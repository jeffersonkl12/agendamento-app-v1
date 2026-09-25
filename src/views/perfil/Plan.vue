<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import { onMounted } from 'vue'
import { Alert, AlertDescription } from '@components/ui/alert'
import { Skeleton } from '@components/ui/skeleton'
import { useSubscriptionSummary } from '@composables/useSubscriptionSummary'

const {
  hasSubscription,
  planName,
  priceLabel,
  renewalLabel,
  statusWarning,
  isInitialLoading,
  load,
} = useSubscriptionSummary()

onMounted(load)
</script>

<template>
  <section aria-labelledby="plan-title" class="flex flex-col gap-3">
    <h2 id="plan-title" class="text-foreground text-tag">
      Seu plano
    </h2>

    <Skeleton v-if="isInitialLoading" class="h-27 w-full rounded-2xl" />

    <template v-else-if="hasSubscription">
      <div class="flex flex-col gap-1 rounded-2xl bg-primary p-5">
        <p class="text-label-strong text-primary-soft">
          {{ renewalLabel }}
        </p>
        <p class="font-heading text-metric-xs text-primary-foreground">
          {{ planName }}
        </p>
        <p class="text-caption-md text-primary-soft">
          {{ priceLabel }}
        </p>
      </div>

      <Alert
        v-if="statusWarning"
        variant="destructive"
        class="rounded-2xl border-error bg-error-bg p-3.5 text-error"
      >
        <PhWarningCircle class="size-5" aria-hidden="true" />
        <AlertDescription class="text-caption-md text-error">
          {{ statusWarning }}
        </AlertDescription>
      </Alert>
    </template>

    <p v-else class="rounded-2xl bg-card p-5 text-muted-foreground text-paragraph">
      Nenhum plano ativo no momento.
    </p>
  </section>
</template>
