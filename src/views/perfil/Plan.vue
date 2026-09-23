<script setup lang="ts">
import { plan } from '@data/plano'
</script>

<template>
  <section aria-labelledby="plan-title" class="flex flex-col gap-3">
    <h2 id="plan-title" class="text-foreground text-tag">
      Seu plano
    </h2>

    <div class="flex flex-col gap-1 rounded-2xl bg-primary p-5">
      <p class="text-label-strong text-primary-soft">
        {{ plan.renewalLabel }}
      </p>
      <p class="font-heading text-metric-xs text-primary-foreground">
        {{ plan.name }}
      </p>
      <p class="text-caption-md text-primary-soft">
        {{ plan.price }}
      </p>
    </div>
  </section>
</template>
