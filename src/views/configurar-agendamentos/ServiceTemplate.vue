<script setup lang="ts">
import { ref } from 'vue'
import { ChooseTemplateSheet } from '@components/configurar-agendamentos/choose-template-sheet'
import { Card } from '@components/ui/card'
import { service, serviceQuestions } from '@data/servico'

const chooseTemplateOpen = ref(false)
</script>

<template>
  <section aria-labelledby="service-template-title" class="flex flex-col gap-2.5">
    <h2 id="service-template-title" class="text-foreground text-tag">
      Modelo usado
    </h2>

    <Card class="flex-row items-center justify-between gap-3 rounded-2xl p-3.5 ring-0">
      <div class="flex flex-col gap-0.5">
        <p class="text-foreground text-item-title">
          {{ service.name }}
        </p>
        <p class="text-label text-muted-foreground">
          {{ serviceQuestions.length }} perguntas
        </p>
      </div>

      <button type="button" class="shrink-0 text-primary text-tag" @click="chooseTemplateOpen = true">
        Escolher
      </button>
    </Card>

    <ChooseTemplateSheet v-model:open="chooseTemplateOpen" />
  </section>
</template>
