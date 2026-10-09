<script setup lang="ts">
import { PhCheckCircle, PhWhatsappLogo } from '@phosphor-icons/vue'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { ConnectWhatsappSheet } from '@components/business-profile/connect-whatsapp-sheet'
import { ConfirmDialog } from '@components/shared/confirm-dialog'
import { Button } from '@components/ui/button'
import { useWhatsappConnection } from '@composables/useWhatsappConnection'

const { isConnected, load, disconnect } = useWhatsappConnection()

onMounted(load)

const sheetOpen = ref(false)
const disconnectOpen = ref(false)

async function confirmDisconnect() {
  const result = await disconnect()
  if (!result.success) {
    toast.error(result.message)
    return
  }
  toast.success(result.message)
}
</script>

<template>
  <section class="flex flex-col gap-3 rounded-2xl bg-card p-3.5" aria-labelledby="whatsapp-connection-title">
    <div class="flex items-center gap-3">
      <PhWhatsappLogo class="size-6 shrink-0 text-primary" weight="fill" aria-hidden="true" />
      <div class="flex min-w-0 flex-1 flex-col">
        <h2 id="whatsapp-connection-title" class="text-foreground text-item-title">
          WhatsApp
        </h2>
        <p class="text-label text-muted-foreground">
          {{ isConnected ? 'Seu bot está conectado e recebendo mensagens.' : 'Conecte o WhatsApp para o bot atender seus clientes.' }}
        </p>
      </div>
    </div>

    <p v-if="isConnected" class="flex items-center gap-1.5 text-caption-md text-success">
      <PhCheckCircle class="size-4" weight="fill" aria-hidden="true" />
      Conectado
    </p>

    <Button
      v-if="isConnected"
      type="button"
      variant="ghost"
      class="h-8 w-fit rounded-xl bg-error-bg px-3 text-error text-label-strong-lg hover:bg-error-bg/80"
      @click="disconnectOpen = true"
    >
      Desconectar
    </Button>
    <Button
      v-else
      type="button"
      class="h-8 w-fit rounded-xl bg-primary-soft px-3 text-label-strong-lg text-primary hover:bg-primary-soft/80"
      @click="sheetOpen = true"
    >
      Conectar WhatsApp
    </Button>
  </section>

  <ConnectWhatsappSheet v-model:open="sheetOpen" />

  <ConfirmDialog
    v-model:open="disconnectOpen"
    title="Desconectar WhatsApp?"
    description="O bot para de receber e responder mensagens até você conectar de novo."
    confirm-label="Desconectar"
    @confirm="confirmDisconnect"
  />
</template>
