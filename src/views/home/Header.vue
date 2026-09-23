<script setup lang="ts">
import { business } from '@data/business'
</script>

<template>
  <section aria-labelledby="home-greeting" class="flex flex-col gap-1">
    <h1 id="home-greeting" class="font-heading text-display text-foreground">
      Olá, {{ business.name }}
    </h1>
    <p class="text-muted-foreground text-paragraph">
      Resumo do seu negócio
    </p>
  </section>
</template>
