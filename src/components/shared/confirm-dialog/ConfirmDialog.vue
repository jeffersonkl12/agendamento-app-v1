<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@components/ui/alert-dialog'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
}>(), {
  cancelLabel: 'Voltar',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()
</script>

<template>
  <AlertDialog :open="props.open" @update:open="emit('update:open', $event)">
    <AlertDialogContent
      data-slot="confirm-dialog"
      overlay-class="bg-foreground/45 backdrop-blur-none"
      class="ring-0 gap-2 rounded-2xl p-5.5 data-[size=default]:max-w-77.5"
    >
      <AlertDialogTitle as-child>
        <h2 class="text-heading-sm text-foreground text-center">
          {{ title }}
        </h2>
      </AlertDialogTitle>

      <AlertDialogDescription as-child>
        <p class="text-caption-md text-muted-foreground text-center">
          {{ description }}
        </p>
      </AlertDialogDescription>

      <div class="flex w-full gap-2.5 pt-2.5">
        <AlertDialogCancel
          variant="ghost"
          class="h-auto flex-1 rounded-xl bg-surface p-3 text-tag-lg text-foreground hover:bg-surface/80"
          @click="emit('cancel')"
        >
          {{ cancelLabel }}
        </AlertDialogCancel>

        <AlertDialogAction
          variant="default"
          class="h-auto flex-1 rounded-xl bg-error p-3 text-tag-lg text-white hover:bg-error/90"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </AlertDialogAction>
      </div>
    </AlertDialogContent>
  </AlertDialog>
</template>
