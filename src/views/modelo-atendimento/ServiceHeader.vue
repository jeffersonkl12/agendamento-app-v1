<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@components/ui/button'
import { Card } from '@components/ui/card'
import { Input } from '@components/ui/input'
import { service } from '@data/servico'

const price = ref<string | number>(service.price)

const isEditingName = ref(false)
const editedName = ref(service.name)
const nameInputRef = ref<InstanceType<typeof Input>>()

function toggleEditName() {
  if (!isEditingName.value) {
    editedName.value = service.name
    isEditingName.value = true
    nextTick(() => nameInputRef.value?.select())
    return
  }

  const trimmedName = editedName.value.trim()
  if (!trimmedName)
    return

  // TODO: persistir nome do modelo quando a camada dinâmica existir
  isEditingName.value = false
  toast.success('Nome atualizado com sucesso')
}
</script>

<template>
  <section aria-labelledby="service-name" class="flex flex-col gap-3.5">
    <p class="text-caption-md text-muted-foreground">
      As perguntas que o bot vai enviar no WhatsApp
    </p>

    <Card class="flex-row items-center justify-between gap-3 rounded-2xl p-3.5 ring-0">
      <h1 id="service-name" class="min-w-0 flex-1 text-foreground text-heading-sm">
        <template v-if="!isEditingName">
          {{ service.name }}
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
        />
      </div>
    </Card>
  </section>
</template>
