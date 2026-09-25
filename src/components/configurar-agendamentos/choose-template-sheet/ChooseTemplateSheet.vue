<script setup lang="ts">
import { Drawer, DrawerClose, DrawerContent } from '@components/ui/drawer'
import { cn } from '@/libs/utils'

interface TemplateOption {
  id: string
  name: string
  questionCount: number | null
  isInUse: boolean
}

const props = defineProps<{
  open: boolean
  options: TemplateOption[]
  selectedId: string | null
  isCreating?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'select': [id: string]
  'create': []
}>()

function describe(option: TemplateOption): string {
  const count = option.questionCount === null
    ? 'carregando perguntas'
    : `${option.questionCount} ${option.questionCount === 1 ? 'pergunta' : 'perguntas'}`
  return option.isInUse ? `${count} · em uso` : count
}
</script>

<template>
  <Drawer :open="props.open" @update:open="emit('update:open', $event)">
    <DrawerContent
      data-slot="choose-template-sheet"
      overlay-class="bg-foreground/45 backdrop-blur-none"
      class="gap-4 px-5 pt-5 pb-7 data-[swipe-direction=down]:rounded-t-3xl"
    >
      <h2 id="choose-template-title" class="text-foreground text-subheading">
        Modelos disponíveis
      </h2>
      <p class="text-label-lg text-muted-foreground">
        Escolha o modelo usado nesses agendamentos
      </p>

      <ul v-if="props.options.length" role="radiogroup" aria-labelledby="choose-template-title" class="flex flex-col gap-2">
        <li
          v-for="option in props.options"
          :key="option.id"
          :class="cn(
            'flex items-center gap-3 rounded-xl border p-3.5',
            option.id === props.selectedId ? 'border-primary bg-primary-soft' : 'border-border-subtle bg-background',
          )"
        >
          <button
            type="button"
            role="radio"
            :aria-checked="option.id === props.selectedId"
            class="flex min-w-0 flex-1 items-center gap-3 text-left"
            @click="emit('select', option.id)"
          >
            <span
              aria-hidden="true"
              :class="cn(
                'size-5 shrink-0 rounded-full border-2',
                option.id === props.selectedId ? 'border-primary bg-primary' : 'border-border-strong bg-background',
              )"
            />
            <span class="flex min-w-0 flex-1 flex-col gap-px">
              <span class="truncate text-foreground text-item-title">{{ option.name }}</span>
              <span class="text-label text-muted-foreground">{{ describe(option) }}</span>
            </span>
          </button>

          <RouterLink
            :to="`/modelo-atendimento/${option.id}`"
            class="shrink-0 text-primary text-tag"
            :aria-label="`Abrir modelo ${option.name}`"
            @click="emit('update:open', false)"
          >
            Abrir
          </RouterLink>
        </li>
      </ul>

      <p v-else class="text-muted-foreground text-paragraph">
        Você ainda não tem modelos. Crie o primeiro para o bot saber o que perguntar.
      </p>

      <button
        type="button"
        :disabled="props.isCreating"
        class="w-fit text-primary text-tag disabled:opacity-60"
        @click="emit('create')"
      >
        + Novo modelo
      </button>

      <DrawerClose class="flex items-center justify-center rounded-xl bg-surface p-3.25 text-foreground text-item-title">
        Fechar
      </DrawerClose>
    </DrawerContent>
  </Drawer>
</template>
