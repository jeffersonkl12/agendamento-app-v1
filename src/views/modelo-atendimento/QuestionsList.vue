<script setup lang="ts">
import type { QuestionDraft, QuestionListItem, QuestionType } from '@composables/useServiceTemplateEditor'
import { PhTrash } from '@phosphor-icons/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { QuestionFormSheet } from '@components/modelo-atendimento/question-form-sheet'
import { ConfirmDialog } from '@components/shared/confirm-dialog'
import { Button } from '@components/ui/button'
import { Skeleton } from '@components/ui/skeleton'
import { useServiceTemplateEditor } from '@composables/useServiceTemplateEditor'

const QUESTION_TYPE_DISPLAY: Record<QuestionType, { icon: string, label: string }> = {
  single_choice: { icon: '◉', label: 'Escolha única' },
  multiple_choice: { icon: '☰', label: 'Múltipla escolha' },
  yes_no: { icon: '✓', label: 'Sim ou não' },
  free_text: { icon: 'Aa', label: 'Texto livre' },
  number: { icon: '#', label: 'Número' },
}

const {
  questions,
  isQuestionsBusy,
  addQuestion,
  questionDraft,
  editQuestion,
  removeQuestion,
} = useServiceTemplateEditor()

function questionMeta(question: QuestionListItem): string {
  return `${QUESTION_TYPE_DISPLAY[question.type].label} · ${question.required ? 'Obrigatória' : 'Opcional'}`
}

const questionToDelete = ref<QuestionListItem | null>(null)
const deleteConfirmOpen = ref(false)
const questionSheetOpen = ref(false)
const questionToEdit = ref<QuestionListItem | null>(null)
const editingDraft = computed(() => questionToEdit.value ? questionDraft(questionToEdit.value.id) ?? undefined : undefined)

// Excluir também remove as opções da pergunta (cascata no back); agendamentos antigos guardam a resposta.
const deleteDescription = 'Ela e as opções dela deixarão de aparecer no agendamento pelo WhatsApp. Agendamentos antigos não são afetados.'

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

function requestEdit(question: QuestionListItem) {
  questionToEdit.value = question
  questionSheetOpen.value = true
}

function requestAdd() {
  questionToEdit.value = null
  questionSheetOpen.value = true
}

async function submitQuestion(draft: QuestionDraft) {
  const result = questionToEdit.value
    ? await editQuestion(questionToEdit.value.id, draft)
    : await addQuestion(draft)
  if (!result.success) {
    toast.error(result.message)
    return
  }
  questionSheetOpen.value = false
  questionToEdit.value = null
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
        <button
          type="button"
          :aria-label="`Editar pergunta: ${question.title}`"
          class="flex min-w-0 flex-1 items-center gap-3 text-left"
          @click="requestEdit(question)"
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
        </button>

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
      Nenhuma pergunta ainda. O questionário é opcional.
    </p>

    <Button
      type="button"
      variant="outline"
      class="h-11.5 w-full rounded-xl border-border-strong bg-transparent text-item-title text-primary"
      @click="requestAdd"
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

    <QuestionFormSheet
      v-model:open="questionSheetOpen"
      :initial-values="editingDraft"
      :is-submitting="isQuestionsBusy"
      @submit="submitQuestion"
    />
  </section>
</template>
