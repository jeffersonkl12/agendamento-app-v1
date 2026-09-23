<script setup lang="ts">
import { Drawer, DrawerClose, DrawerContent } from '@components/ui/drawer'
import { service, serviceQuestions } from '@data/servico'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

<template>
  <Drawer :open="props.open" @update:open="emit('update:open', $event)">
    <DrawerContent
      data-slot="choose-template-sheet"
      overlay-class="bg-foreground/45 backdrop-blur-none"
      class="gap-4 px-5 pt-5 pb-7 data-[swipe-direction=down]:rounded-t-3xl"
    >
      <h2 class="text-foreground text-subheading">
        Modelos disponíveis
      </h2>
      <p class="text-label-lg text-muted-foreground">
        Escolha o modelo usado nesses agendamentos
      </p>

      <div class="flex items-center gap-3 rounded-xl border border-primary bg-primary-soft p-3.5">
        <span aria-hidden="true" class="size-5 shrink-0 rounded-full border-2 border-primary bg-primary" />

        <div class="flex min-w-0 flex-1 flex-col gap-px">
          <p class="text-item-title text-foreground">
            {{ service.name }}
          </p>
          <p class="text-label text-muted-foreground">
            {{ serviceQuestions.length }} perguntas · em uso
          </p>
        </div>

        <RouterLink
          to="/modelo-atendimento"
          class="shrink-0 text-tag text-primary"
          @click="emit('update:open', false)"
        >
          Abrir
        </RouterLink>
      </div>

      <DrawerClose class="flex items-center justify-center rounded-xl bg-surface p-3.25 text-item-title text-foreground">
        Fechar
      </DrawerClose>
    </DrawerContent>
  </Drawer>
</template>
