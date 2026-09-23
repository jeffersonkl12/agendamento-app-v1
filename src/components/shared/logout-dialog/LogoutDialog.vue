<script setup lang="ts">
import { ConfirmDialog } from '@components/shared/confirm-dialog'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function confirmLogout() {
  // TODO: disparar logout quando a camada dinâmica existir
}
</script>

<template>
  <ConfirmDialog
    :open="props.open"
    title="Sair da conta?"
    description="Você vai precisar entrar de novo para acessar a plataforma."
    confirm-label="Sair"
    @update:open="emit('update:open', $event)"
    @confirm="confirmLogout"
  />
</template>
