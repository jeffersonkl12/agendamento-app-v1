<script setup lang="ts">
import type { ServiceQuestion } from '@data/servico'
import { PhTrash } from '@phosphor-icons/vue'
import { ref } from 'vue'
import { AddQuestionSheet } from '@components/modelo-atendimento/add-question-sheet'
import { ConfirmDialog } from '@components/shared/confirm-dialog'
import { Button } from '@components/ui/button'
import { serviceQuestions } from '@data/servico'

function questionMeta(question: ServiceQuestion): string {
  return `${question.typeLabel} · ${question.required ? 'Obrigatória' : 'Opcional'}`
}

const questionToDelete = ref<ServiceQuestion | null>(null)
const deleteConfirmOpen = ref(false)
const addQuestionOpen = ref(false)

function requestDelete(question: ServiceQuestion) {
  questionToDelete.value = question
  deleteConfirmOpen.value = true
}

function confirmDelete() {
  // TODO: disparar exclusão quando a camada dinâmica existir
  deleteConfirmOpen.value = false
}
</script>

<template>
  <section aria-labelledby="questions-list-title" class="flex flex-col gap-3.5">
    <h2 id="questions-list-title" class="sr-only">
      Perguntas do atendimento
    </h2>

    <ul class="flex flex-col gap-2.5">
      <li
        v-for="question in serviceQuestions"
        :key="question.id"
        class="bg-card flex items-center gap-3 rounded-2xl p-3.5"
      >
        <span
          aria-hidden="true"
          class="bg-primary-soft text-primary text-item-title flex size-8.5 shrink-0 items-center justify-center rounded-lg"
        >
          {{ question.icon }}
        </span>

        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 class="text-item-title text-foreground">
            {{ question.title }}
          </h3>
          <p class="text-label text-muted-foreground">
            {{ questionMeta(question) }}
          </p>
        </div>

        <button
          type="button"
          :aria-label="`Excluir pergunta: ${question.title}`"
          class="bg-error-bg text-error flex size-8.5 shrink-0 items-center justify-center rounded-lg"
          @click="requestDelete(question)"
        >
          <PhTrash class="size-4" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <Button
      type="button"
      variant="outline"
      class="border-border-strong text-primary text-item-title h-11.5 w-full rounded-xl bg-transparent"
      @click="addQuestionOpen = true"
    >
      + Adicionar pergunta
    </Button>

    <ConfirmDialog
      :open="deleteConfirmOpen"
      title="Excluir esta pergunta?"
      description="Ela deixará de aparecer no agendamento pelo WhatsApp."
      confirm-label="Excluir"
      @update:open="deleteConfirmOpen = $event"
      @confirm="confirmDelete"
    />

    <AddQuestionSheet v-model:open="addQuestionOpen" />
  </section>
</template>
