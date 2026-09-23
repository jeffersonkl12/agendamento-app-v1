<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { PhX } from '@phosphor-icons/vue'
import { RadioGroupItem } from 'reka-ui'
import { useFieldArray, useForm } from 'vee-validate'
import { watch } from 'vue'
import * as z from 'zod'
import { Drawer, DrawerContent } from '@components/ui/drawer'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form'
import { Input } from '@components/ui/input'
import { RadioGroup } from '@components/ui/radio-group'
import { Switch } from '@components/ui/switch'
import { cn } from '@/libs/utils'

type QuestionType = 'texto' | 'escolha-unica' | 'multipla-escolha' | 'numero' | 'sim-nao'

interface QuestionTypeOption {
  value: QuestionType
  label: string
  hint: string
}

const QUESTION_TYPES: QuestionTypeOption[] = [
  { value: 'texto', label: 'Texto livre', hint: 'Cliente escreve o que quiser, sem opções fixas' },
  { value: 'escolha-unica', label: 'Escolha única', hint: 'Cliente escolhe só uma opção da lista' },
  { value: 'multipla-escolha', label: 'Múltipla escolha', hint: 'Cliente pode marcar mais de uma opção' },
  { value: 'numero', label: 'Número', hint: 'Cliente informa uma quantidade' },
  { value: 'sim-nao', label: 'Sim ou não', hint: 'Resposta simples, sim ou não' },
]

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const schema = toTypedSchema(z.object({
  question: z.string().min(1, 'Informe a pergunta'),
  required: z.boolean(),
  type: z.enum(['texto', 'escolha-unica', 'multipla-escolha', 'numero', 'sim-nao']),
  options: z.array(z.object({ label: z.string(), price: z.string() })),
  unitPrice: z.string(),
  yesPrice: z.string(),
  noPrice: z.string(),
}))

const { handleSubmit, values, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    question: '',
    required: true,
    type: 'texto',
    options: [{ label: '', price: '' }, { label: '', price: '' }],
    unitPrice: '',
    yesPrice: '',
    noPrice: '',
  },
})

const { fields: optionFields, push: pushOption, remove: removeOption } = useFieldArray<{ label: string, price: string }>('options')

function addOption() {
  pushOption({ label: '', price: '' })
}

const onSubmit = handleSubmit(() => {
  // TODO: persistir a nova pergunta quando a camada dinâmica existir
  emit('update:open', false)
})

function cancel() {
  emit('update:open', false)
}

watch(() => props.open, (open) => {
  if (!open)
    resetForm()
})
</script>

<template>
  <Drawer :open="props.open" @update:open="emit('update:open', $event)">
    <DrawerContent
      data-slot="add-question-sheet"
      overlay-class="bg-foreground/45 backdrop-blur-none"
      class="gap-3.5 overflow-y-auto px-5 pt-5 pb-7 data-[swipe-direction=down]:rounded-t-3xl"
    >
      <form class="flex flex-col gap-3.5" @submit="onSubmit">
        <h2 class="text-foreground text-subheading">
          Nova pergunta
        </h2>

        <FormField v-slot="{ componentField }" name="question">
          <FormItem class="gap-1.5">
            <FormLabel class="text-label-strong-lg text-muted-foreground">
              Qual é a pergunta?
            </FormLabel>
            <FormControl>
              <div class="rounded-xl border border-border-subtle px-3.5 focus-within:border-ring">
                <Input
                  v-bind="componentField"
                  placeholder="Ex: Tipo de tratamento desejado"
                  class="h-auto border-0 bg-transparent p-3 text-paragraph text-foreground focus-visible:ring-0 md:text-paragraph"
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div class="flex items-center justify-between gap-3 rounded-xl bg-background p-3">
          <div class="flex w-42.5 flex-col gap-px">
            <p class="text-tag-lg text-foreground">
              Pergunta obrigatória
            </p>
            <p class="text-caption-xs text-muted-foreground">
              O cliente precisa responder para concluir o agendamento
            </p>
          </div>

          <FormField v-slot="{ value, handleChange }" name="required">
            <Switch size="lg" :model-value="value" @update:model-value="handleChange" />
          </FormField>
        </div>

        <div class="flex flex-col gap-2">
          <p class="text-label-strong-lg text-muted-foreground">
            Tipo de resposta
          </p>

          <FormField v-slot="{ value, handleChange }" name="type">
            <RadioGroup :model-value="value" class="flex flex-col gap-2" @update:model-value="handleChange">
              <RadioGroupItem
                v-for="option in QUESTION_TYPES"
                :key="option.value"
                :value="option.value"
                as-child
              >
                <button
                  type="button"
                  :class="cn(
                    'flex items-center gap-3 rounded-xl border p-3 text-left',
                    value === option.value ? 'border-primary bg-primary-soft' : 'border-border-subtle bg-background',
                  )"
                >
                  <span
                    aria-hidden="true"
                    :class="cn(
                      'flex size-5 shrink-0 rounded-full border-2',
                      value === option.value ? 'border-primary bg-primary' : 'border-border-strong bg-background',
                    )"
                  />
                  <span class="flex flex-col gap-px">
                    <span class="text-tag-lg text-foreground">{{ option.label }}</span>
                    <span class="text-caption-xs text-muted-foreground">{{ option.hint }}</span>
                  </span>
                </button>
              </RadioGroupItem>
            </RadioGroup>
          </FormField>
        </div>

        <div v-if="values.type === 'escolha-unica' || values.type === 'multipla-escolha'" class="flex flex-col gap-2">
          <p class="text-label-strong-lg text-muted-foreground">
            Opções
          </p>
          <p class="text-caption-xs text-muted-foreground">
            Se uma opção tiver um custo diferente, informe o valor. Deixe em branco se não houver custo extra.
          </p>

          <div class="flex flex-col gap-2">
            <div v-for="(field, index) in optionFields" :key="field.key" class="flex items-center gap-2">
              <FormField v-slot="{ componentField }" :name="`options[${index}].label`">
                <Input
                  v-bind="componentField"
                  :placeholder="`Opção ${index + 1}`"
                  class="h-auto w-41 rounded-xl border border-border-subtle px-3.5 py-3 text-paragraph text-foreground focus-visible:ring-0 md:text-paragraph"
                />
              </FormField>

              <FormField v-slot="{ componentField }" :name="`options[${index}].price`">
                <div class="flex w-30 items-center gap-1 rounded-lg border border-border-subtle p-2.5">
                  <span class="text-caption-lg text-muted-foreground">R$</span>
                  <Input
                    v-bind="componentField"
                    type="number"
                    inputmode="decimal"
                    placeholder="0,00"
                    class="h-auto border-0 bg-transparent p-0 text-tag-lg text-foreground focus-visible:ring-0 md:text-tag-lg"
                  />
                </div>
              </FormField>

              <button
                type="button"
                aria-label="Remover opção"
                class="flex size-8.5 shrink-0 items-center justify-center rounded-lg bg-error-bg text-error"
                @click="removeOption(index)"
              >
                <PhX class="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <button type="button" class="w-fit text-tag text-primary" @click="addOption">
            + Adicionar opção
          </button>
        </div>

        <div v-else-if="values.type === 'numero'" class="flex flex-col gap-2">
          <p class="text-label-strong-lg text-muted-foreground">
            Valor por unidade
          </p>
          <p class="text-caption-xs text-muted-foreground">
            Opcional. O número informado pelo cliente é multiplicado por esse valor.
          </p>

          <FormField v-slot="{ componentField }" name="unitPrice">
            <div class="flex items-center gap-1 rounded-lg border border-border-subtle p-2.5">
              <span class="text-caption-lg text-muted-foreground">R$</span>
              <Input
                v-bind="componentField"
                type="number"
                inputmode="decimal"
                placeholder="0,00"
                class="h-auto border-0 bg-transparent p-0 text-tag-lg text-foreground focus-visible:ring-0 md:text-tag-lg"
              />
            </div>
          </FormField>
        </div>

        <div v-else-if="values.type === 'sim-nao'" class="flex flex-col gap-2">
          <p class="text-label-strong-lg text-muted-foreground">
            Valor por resposta
          </p>
          <p class="text-caption-xs text-muted-foreground">
            Se a resposta "Sim" tiver um custo extra, informe o valor. Deixe em branco se não houver custo.
          </p>

          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <span class="w-10 text-tag-lg text-foreground">Sim</span>
              <FormField v-slot="{ componentField }" name="yesPrice">
                <div class="flex flex-1 items-center gap-1 rounded-lg border border-border-subtle p-2.5">
                  <span class="text-caption-lg text-muted-foreground">R$</span>
                  <Input
                    v-bind="componentField"
                    type="number"
                    inputmode="decimal"
                    placeholder="0,00"
                    class="h-auto border-0 bg-transparent p-0 text-tag-lg text-foreground focus-visible:ring-0 md:text-tag-lg"
                  />
                </div>
              </FormField>
            </div>

            <div class="flex items-center gap-2">
              <span class="w-10 text-tag-lg text-foreground">Não</span>
              <FormField v-slot="{ componentField }" name="noPrice">
                <div class="flex flex-1 items-center gap-1 rounded-lg border border-border-subtle p-2.5">
                  <span class="text-caption-lg text-muted-foreground">R$</span>
                  <Input
                    v-bind="componentField"
                    type="number"
                    inputmode="decimal"
                    placeholder="0,00"
                    class="h-auto border-0 bg-transparent p-0 text-tag-lg text-foreground focus-visible:ring-0 md:text-tag-lg"
                  />
                </div>
              </FormField>
            </div>
          </div>
        </div>

        <div class="flex gap-2.5 pt-2">
          <button type="button" class="flex-1 rounded-xl bg-surface p-3.5 text-item-title text-foreground" @click="cancel">
            Cancelar
          </button>
          <button type="submit" class="flex-1 rounded-xl bg-primary p-3.5 text-item-title text-primary-foreground">
            Salvar pergunta
          </button>
        </div>
      </form>
    </DrawerContent>
  </Drawer>
</template>
