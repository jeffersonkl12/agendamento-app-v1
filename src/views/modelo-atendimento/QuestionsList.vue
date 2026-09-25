<script setup lang="ts">
import type { QuestionDraft, QuestionListItem, QuestionType } from '@composables/useServiceTemplateEditor'
import { PhTrash } from '@phosphor-icons/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { AddQuestionSheet } from '@components/modelo-atendimento/add-question-sheet'
import { ConfirmDialog } from '@components/shared/confirm-dialog'
import { Button } from '@components/ui/button'
import { Skeleton } from '@components/ui/skeleton'
import { useServiceTemplateEditor } from '@composables/useServiceTemplateEditor'

const QUESTION_TYPE_DISPLAY: Record<QuestionType, { icon: string, label: string }> = {
  SINGLE: { icon: '◉', label: 'Escolha única' },
  MULTI: { icon: '☰', label: 'Múltipla escolha' },
  BOOLEAN: { icon: '✓', label: 'Sim ou não' },
  TEXT: { icon: 'Aa', label: 'Texto livre' },
  NUMBER: { icon: '#', label: 'Número' },
}

const {
  questions,
  isLastQuestionOfActiveTemplate,
  isQuestionsBusy,
  addQuestion,
  removeQuestion,
} = useServiceTemplateEditor()

function questionMeta(question: QuestionListItem): string {
  return `${QUESTION_TYPE_DISPLAY[question.type].label} · ${question.required ? 'Obrigatória' : 'Opcional'}`
}

const questionToDelete = ref<QuestionListItem | null>(null)
const deleteConfirmOpen = ref(false)
const addQuestionOpen = ref(false)

// RN-C03: se for a última pergunta do modelo em uso, o bot para de agendar — o aviso muda.
const deleteDescription = computed(() => isLastQuestionOfActiveTemplate.value
  ? 'É a última pergunta do modelo em uso: sem perguntas, o bot para de aceitar agendamentos.'
  : 'Ela deixará de aparecer no agendamento pelo WhatsApp. Agendamentos antigos não são afetados.')

function requestDelete(question: QuestionListItem) {
  questionToDelete.value = question
  deleteConfirmOpen.value = true
}

async function confirmDelete() {
  deleteConfirmOpen.value = false
  if (!questionToDelete.value)
    return
  const result = await removeQuestion(questionToDelete.value.id)
  questionToDelete.value = null
  if (result.success)
    toast.success(result.message)
  else
    toast.error(result.message)
}

async function submitQuestion(draft: QuestionDraft) {
  const result = await addQuestion(draft)
  if (!result.success) {
    toast.error(result.message)
    return
  }
  addQuestionOpen.value = false
  toast.success(result.message)
}
</script>

<template>
  <section aria-labelledby="questions-list-title" class="flex flex-col gap-3.5">
    <h2 id="questions-list-title" class="sr-only">
      Perguntas do atendimento
    </h2>

    <ul v-if="questions.length" class="flex flex-col gap-2.5">
      <li
        v-for="question in questions"
        :key="question.id"
        class="flex items-center gap-3 rounded-2xl bg-card p-3.5"
      >
        <span
          aria-hidden="true"
          class="flex size-8.5 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-item-title text-primary"
        >
          {{ QUESTION_TYPE_DISPLAY[question.type].icon }}
        </span>

        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 class="text-foreground text-item-title">
            {{ question.title }}
          </h3>
          <p class="text-label text-muted-foreground">
            {{ questionMeta(question) }}
          </p>
        </div>

        <button
          type="button"
          :aria-label="`Excluir pergunta: ${question.title}`"
          class="flex size-8.5 shrink-0 items-center justify-center rounded-lg bg-error-bg text-error"
          @click="requestDelete(question)"
        >
          <PhTrash class="size-4" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <div v-else-if="isQuestionsBusy" class="flex flex-col gap-2.5" aria-busy="true">
      <Skeleton v-for="index in 3" :key="index" class="h-16 w-full rounded-2xl" />
    </div>

    <p v-else class="text-paragraph text-muted-foreground">
      Nenhuma pergunta ainda. Um modelo sem perguntas não pode ser usado pelo bot.
    </p>

    <Button
      type="button"
      variant="outline"
      class="h-11.5 w-full rounded-xl border-border-strong bg-transparent text-item-title text-primary"
      @click="addQuestionOpen = true"
    >
      + Adicionar pergunta
    </Button>

    <ConfirmDialog
      :open="deleteConfirmOpen"
      title="Excluir esta pergunta?"
      :description="deleteDescription"
      confirm-label="Excluir"
      @update:open="deleteConfirmOpen = $event"
      @confirm="confirmDelete"
    />

    <AddQuestionSheet
      v-model:open="addQuestionOpen"
      :is-submitting="isQuestionsBusy"
      @submit="submitQuestion"
    />
  </section>
</template>
