<script setup lang="ts">
import { computed } from 'vue'
import { useBusinessProfile } from '@composables/useBusinessProfile'

const { businessName } = useBusinessProfile()

const greeting = computed(() => (businessName.value ? `Olá, ${businessName.value}` : 'Olá!'))
</script>

<template>
  <section aria-labelledby="home-greeting" class="flex flex-col gap-1">
    <h1 id="home-greeting" class="font-heading text-display text-foreground">
      {{ greeting }}
    </h1>
    <p class="text-muted-foreground text-paragraph">
      Resumo do seu negócio
    </p>
  </section>
</template>
