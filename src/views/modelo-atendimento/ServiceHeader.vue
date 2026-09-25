<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ConfirmDialog } from '@components/shared/confirm-dialog'
import { Button } from '@components/ui/button'
import { Card } from '@components/ui/card'
import { Input } from '@components/ui/input'
import { useServiceTemplateEditor } from '@composables/useServiceTemplateEditor'

const router = useRouter()
const {
  template,
  basePriceReais,
  isInUse,
  isSavingTemplate,
  rename,
  updateBasePrice,
  removeTemplate,
} = useServiceTemplateEditor()

const price = ref<string | number>(basePriceReais.value)
watch(basePriceReais, (value) => {
  price.value = value
})

const isEditingName = ref(false)
const editedName = ref('')
const nameInputRef = ref<InstanceType<typeof Input>>()
const deleteConfirmOpen = ref(false)

async function toggleEditName() {
  if (!isEditingName.value) {
    editedName.value = template.value?.name ?? ''
    isEditingName.value = true
    nextTick(() => nameInputRef.value?.select())
    return
  }

  const result = await rename(editedName.value)
  if (!result.success) {
    toast.error(result.message)
    return
  }
  isEditingName.value = false
  toast.success(result.message)
}

async function saveBasePrice() {
  const result = await updateBasePrice(price.value)
  if (!result)
    return
  if (result.success)
    toast.success(result.message)
  else
    toast.error(result.message)
}

async function confirmDeleteTemplate() {
  deleteConfirmOpen.value = false
  const result = await removeTemplate()
  if (!result.success) {
    toast.error(result.message)
    return
  }
  toast.success(result.message)
  router.push('/modelo-atendimento')
}
</script>

<template>
  <section aria-labelledby="service-name" class="flex flex-col gap-3.5">
    <p class="text-caption-md text-muted-foreground">
      As perguntas que o bot vai enviar no WhatsApp
      <span v-if="isInUse" class="text-primary text-tag"> · em uso pelo bot</span>
    </p>

    <Card class="flex-row items-center justify-between gap-3 rounded-2xl p-3.5 ring-0">
      <h1 id="service-name" class="min-w-0 flex-1 text-foreground text-heading-sm">
        <template v-if="!isEditingName">
          {{ template?.name }}
        </template>
        <Input
          v-else
          ref="nameInputRef"
          v-model="editedName"
          aria-label="Nome do modelo"
          class="h-auto w-full border-0 bg-transparent p-0 text-foreground text-heading-sm focus-visible:ring-0 md:text-heading-sm"
          @keydown.enter.prevent="toggleEditName"
        />
      </h1>

      <Button
        type="button"
        :disabled="isSavingTemplate"
        :class="[
          'h-8 shrink-0 rounded-xl px-3 text-label-strong-lg',
          isEditingName ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-primary-soft text-primary hover:bg-primary-soft/80',
        ]"
        @click="toggleEditName"
      >
        {{ isEditingName ? 'Salvar' : 'Editar nome' }}
      </Button>
    </Card>

    <Card class="gap-3 rounded-2xl p-3.5 ring-0">
      <div class="flex flex-col gap-1">
        <h2 id="service-price-title" class="text-foreground text-item-title">
          Valor base do atendimento
        </h2>
        <p id="service-price-note" class="text-caption-xs text-muted-foreground">
          Opcional. Cobrado sempre, somado ao valor das perguntas.
        </p>
      </div>

      <div
        class="flex h-10.25 items-center gap-1.5 rounded-xl border border-border-subtle px-3.5 focus-within:border-ring"
      >
        <span aria-hidden="true" class="text-caption-lg text-muted-foreground">R$</span>
        <Input
          v-model="price"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.01"
          aria-labelledby="service-price-title"
          aria-describedby="service-price-note"
          class="h-auto border-0 bg-transparent p-0 text-foreground text-paragraph focus-visible:ring-0 md:text-paragraph"
          @blur="saveBasePrice"
          @keydown.enter.prevent="saveBasePrice"
        />
      </div>
    </Card>

    <button
      type="button"
      :disabled="isInUse || isSavingTemplate"
      :title="isInUse ? 'Escolha outro modelo em Configurar agendamentos antes de excluir este.' : undefined"
      class="w-fit self-end text-error text-tag disabled:text-muted-foreground-soft"
      @click="deleteConfirmOpen = true"
    >
      Excluir modelo
    </button>

    <ConfirmDialog
      :open="deleteConfirmOpen"
      title="Excluir este modelo?"
      description="O modelo e todas as perguntas dele serão removidos. Agendamentos antigos não são afetados."
      confirm-label="Excluir"
      @update:open="deleteConfirmOpen = $event"
      @confirm="confirmDeleteTemplate"
    />
  </section>
</template>
