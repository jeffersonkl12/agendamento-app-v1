<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { useBusinessProfile } from '@composables/useBusinessProfile'

const { businessName, photoUrl, initials, isSaving, saveBusinessName } = useBusinessProfile()

const isEditingName = ref(false)
const editedName = ref('')
const nameInputRef = ref<InstanceType<typeof Input>>()

function startEditing() {
  editedName.value = businessName.value ?? ''
  isEditingName.value = true
  nextTick(() => nameInputRef.value?.select())
}

async function saveName() {
  const result = await saveBusinessName(editedName.value)
  if (!result.success) {
    toast.error(result.message)
    return
  }
  isEditingName.value = false
  toast.success(result.message)
}

function toggleEditName() {
  if (isEditingName.value)
    saveName()
  else
    startEditing()
}
</script>

<template>
  <section class="flex flex-col gap-6" aria-labelledby="profile-header-name">
    <p class="text-caption-md text-muted-foreground">
      Seus dados e assinatura
    </p>

    <div class="flex flex-col items-center gap-2.5">
      <Avatar class="size-21">
        <AvatarImage v-if="photoUrl" :src="photoUrl" :alt="`Foto de ${businessName ?? 'seu negócio'}`" />
        <AvatarFallback class="bg-primary-soft text-label-lg text-primary">
          {{ initials || 'Sua foto' }}
        </AvatarFallback>
      </Avatar>
    </div>

    <div class="flex items-center justify-between gap-3 rounded-2xl bg-card p-3.5">
      <div class="flex min-w-0 flex-1 flex-col">
        <h2 id="profile-header-name" class="text-heading-sm text-foreground">
          <Input
            v-if="isEditingName"
            ref="nameInputRef"
            v-model="editedName"
            aria-label="Nome do negócio"
            maxlength="255"
            class="h-auto w-full border-0 bg-transparent p-0 text-foreground text-heading-sm focus-visible:ring-0 md:text-heading-sm"
            @keydown.enter.prevent="saveName"
          />
          <template v-else>
            {{ businessName ?? 'Seu negócio ainda não tem nome' }}
          </template>
        </h2>
        <p class="text-label text-muted-foreground">
          Nome do seu negócio — é assim que o bot se apresenta no WhatsApp
        </p>
      </div>
      <Button
        type="button"
        :disabled="isSaving"
        :aria-label="isEditingName ? 'Salvar nome do negócio' : 'Editar nome do negócio'"
        :class="[
          'h-8 shrink-0 rounded-xl px-3 text-label-strong-lg',
          isEditingName ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-primary-soft text-primary hover:bg-primary-soft/80',
        ]"
        @click="toggleEditName"
      >
        {{ isEditingName ? 'Salvar' : (businessName ? 'Editar' : 'Definir') }}
      </Button>
    </div>
  </section>
</template>
