<script setup lang="ts">
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Button } from '@components/ui/button'
import { Skeleton } from '@components/ui/skeleton'
import { useServiceTemplateEditor, useServiceTemplateEditorSync } from '@composables/useServiceTemplateEditor'
import QuestionsList from '@views/modelo-atendimento/QuestionsList.vue'
import ServiceHeader from '@views/modelo-atendimento/ServiceHeader.vue'

useServiceTemplateEditorSync()

const router = useRouter()
const { template, isInitialLoading, isNotFound, hasNoTemplates, isSavingTemplate, createTemplate } = useServiceTemplateEditor()

async function createFirstTemplate() {
  const result = await createTemplate()
  if (!result.success || !result.templateId) {
    toast.error(result.message)
    return
  }
  toast.success('Modelo criado. Dê um nome e adicione as perguntas.')
  router.push(`/modelo-atendimento/${result.templateId}`)
}
</script>

<template>
  <div v-if="isInitialLoading" class="flex flex-col gap-3.5" aria-busy="true">
    <h1 class="sr-only">
      Modelo de atendimento
    </h1>
    <Skeleton class="h-15 w-full rounded-2xl" />
    <Skeleton class="h-28 w-full rounded-2xl" />
  </div>

  <section v-else-if="isNotFound" class="flex flex-col items-start gap-3">
    <h1 class="text-foreground text-heading-sm">
      Modelo não encontrado
    </h1>
    <p class="text-paragraph text-muted-foreground">
      Ele pode ter sido excluído.
    </p>
    <RouterLink to="/modelo-atendimento" class="text-primary text-tag">
      Ver modelo em uso
    </RouterLink>
  </section>

  <section v-else-if="hasNoTemplates" class="flex flex-col items-start gap-3">
    <h1 class="text-foreground text-heading-sm">
      Crie seu primeiro modelo
    </h1>
    <p class="text-paragraph text-muted-foreground">
      O modelo define o valor base e as perguntas que o bot faz no WhatsApp antes de agendar.
    </p>
    <Button
      type="button"
      :disabled="isSavingTemplate"
      class="text-button-strong h-12 w-full rounded-2xl"
      @click="createFirstTemplate"
    >
      Criar modelo
    </Button>
  </section>

  <template v-else-if="template">
    <ServiceHeader :key="template.id" />
    <QuestionsList />
  </template>
</template>
