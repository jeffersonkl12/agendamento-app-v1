<script setup lang="ts">
import { ConfirmDialog } from '@components/shared/confirm-dialog'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()
</script>

<template>
  <!-- RN-AU05: logout sempre pede confirmação; quem usa decide o que fazer no confirm. -->
  <ConfirmDialog
    :open="props.open"
    title="Sair da conta?"
    description="Você vai precisar entrar de novo para acessar a plataforma."
    confirm-label="Sair"
    @update:open="emit('update:open', $event)"
    @confirm="emit('confirm')"
  />
</template>
