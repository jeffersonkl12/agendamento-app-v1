<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ChooseTemplateSheet } from '@components/configurar-agendamentos/choose-template-sheet'
import { Card } from '@components/ui/card'
import { useServiceTemplates } from '@composables/useServiceTemplates'

defineProps<{ warning: string | null }>()

const activeTemplateId = defineModel<string | null>('activeTemplateId', { required: true })

const router = useRouter()
const { options, isLoading, createTemplate } = useServiceTemplates()

const chooseTemplateOpen = ref(false)

const selectedTemplate = computed(() => options.value.find(option => option.id === activeTemplateId.value) ?? null)

const questionCountLabel = computed(() => {
  const count = selectedTemplate.value?.questionCount
  if (count === null || count === undefined)
    return ''
  return `${count} ${count === 1 ? 'pergunta' : 'perguntas'}`
})

function selectTemplate(id: string) {
  activeTemplateId.value = id
  chooseTemplateOpen.value = false
}

async function createAndOpenTemplate() {
  const result = await createTemplate()
  if (!result.success || !result.templateId) {
    toast.error(result.message)
    return
  }
  chooseTemplateOpen.value = false
  toast.success('Modelo criado. Dê um nome e adicione as perguntas.')
  router.push(`/modelo-atendimento/${result.templateId}`)
}
</script>

<template>
  <section aria-labelledby="service-template-title" class="flex flex-col gap-2.5">
    <h2 id="service-template-title" class="text-foreground text-tag">
      Modelo usado
    </h2>

    <Card class="flex-row items-center justify-between gap-3 rounded-2xl p-3.5 ring-0">
      <div class="flex min-w-0 flex-col gap-0.5">
        <p class="truncate text-foreground text-item-title">
          {{ selectedTemplate?.name ?? 'Nenhum modelo escolhido' }}
        </p>
        <p v-if="questionCountLabel" class="text-label text-muted-foreground">
          {{ questionCountLabel }}
        </p>
      </div>

      <button type="button" class="shrink-0 text-primary text-tag" @click="chooseTemplateOpen = true">
        Escolher
      </button>
    </Card>

    <p v-if="warning" role="status" class="flex items-start gap-1.5 text-caption-md text-warning">
      <PhWarningCircle class="size-4 shrink-0" aria-hidden="true" />
      {{ warning }}
    </p>

    <ChooseTemplateSheet
      v-model:open="chooseTemplateOpen"
      :options="options"
      :selected-id="activeTemplateId"
      :is-creating="isLoading"
      @select="selectTemplate"
      @create="createAndOpenTemplate"
    />
  </section>
</template>
