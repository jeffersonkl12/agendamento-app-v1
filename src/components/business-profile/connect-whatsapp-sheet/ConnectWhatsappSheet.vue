<script setup lang="ts">
import { PhCopy } from '@phosphor-icons/vue'
import { computed, onUnmounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@components/ui/button'
import { Drawer, DrawerClose, DrawerContent } from '@components/ui/drawer'
import { Input } from '@components/ui/input'
import { Spinner } from '@components/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/ui/tooltip'
import { useWhatsappConnection } from '@composables/useWhatsappConnection'
import { copyToClipboard } from '@libs/clipboard'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const {
  isConnected,
  qrCode,
  pairingCode,
  isGeneratingQr,
  errorMessage,
  connect,
  startPolling,
  stopPolling,
} = useWhatsappConnection()

// O painel só atende prestadores no Brasil — o DDI (55) é fixo, então o campo só pede DDD + número.
const BRAZIL_COUNTRY_CODE = '55'
// DDD (2) + celular (9, sempre começando em 9 desde a mudança do plano de numeração) — o WhatsApp
// exige esse formato pro código de pareamento funcionar; nunca o de fixo (8 dígitos locais), senão
// um número incompleto passa por completo (ex.: "(88) 9975-9855" parece pronto, mas falta um 9).
const PHONE_LOCAL_DIGITS = 9
const MAX_PHONE_DIGITS = 2 + PHONE_LOCAL_DIGITS

// Máscara aplicada enquanto digita: (DD) DDDDD-DDDD.
function formatBrazilianPhone(digits: string): string {
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`

  const ddd = digits.slice(0, 2)
  const rest = digits.slice(2)
  const localPart = rest.slice(0, 5)
  const suffix = rest.slice(5)

  return suffix ? `(${ddd}) ${localPart}-${suffix}` : `(${ddd}) ${localPart}`
}

// back-api.md §4: o código de pareamento só vem se o telefone for enviado na chamada — por
// isso ele é pedido antes da primeira tentativa.
const phoneDigits = ref('')
// Reformatar em cada tecla (inserindo "(", ")", "-") entra em conflito com o cursor do input e
// perde dígito no meio da digitação. Mostrar os dígitos crus enquanto o campo está focado e só
// aplicar a máscara ao desfocar evita esse problema por completo.
const isPhoneFieldFocused = ref(false)
const phoneNumberDisplay = computed({
  get: () => (isPhoneFieldFocused.value ? phoneDigits.value : formatBrazilianPhone(phoneDigits.value)),
  set: (value: string) => {
    phoneDigits.value = value.replace(/\D/g, '').slice(0, MAX_PHONE_DIGITS)
  },
})
const hasRequestedConnection = ref(false)

async function requestConnection() {
  // Número incompleto passa pela validação genérica do backend (só checa 10-15 dígitos) e falha
  // só depois, na hora de digitar o código no celular — travar aqui evita essa volta desnecessária.
  if (phoneDigits.value && phoneDigits.value.length !== MAX_PHONE_DIGITS) {
    toast.error('Informe o DDD e os 9 dígitos do celular, ex.: (11) 99999-9999.')
    return
  }

  hasRequestedConnection.value = true
  const fullPhoneNumber = phoneDigits.value ? `${BRAZIL_COUNTRY_CODE}${phoneDigits.value}` : undefined
  const result = await connect(fullPhoneNumber)
  if (result.success) startPolling()
  else toast.error(result.message)
}

const copyTooltipOpen = ref(false)
const justCopied = ref(false)
let copyTooltipTimeout: ReturnType<typeof setTimeout> | undefined

async function copyPairingCode() {
  if (!pairingCode.value) return

  const succeeded = await copyToClipboard(pairingCode.value)
  if (!succeeded) {
    toast.error('Não foi possível copiar. Selecione o código e copie manualmente.')
    return
  }

  clearTimeout(copyTooltipTimeout)
  justCopied.value = true
  copyTooltipOpen.value = true
  copyTooltipTimeout = setTimeout(() => {
    copyTooltipOpen.value = false
    justCopied.value = false
  }, 1500)
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    hasRequestedConnection.value = false
    phoneDigits.value = ''
    isPhoneFieldFocused.value = false
  }
  else {
    stopPolling()
    clearTimeout(copyTooltipTimeout)
    copyTooltipOpen.value = false
    justCopied.value = false
  }
})

watch(isConnected, (connected) => {
  if (connected) {
    stopPolling()
    toast.success('WhatsApp conectado.')
    emit('update:open', false)
  }
})

onUnmounted(() => {
  stopPolling()
  clearTimeout(copyTooltipTimeout)
})
</script>

<template>
  <Drawer :open="props.open" @update:open="emit('update:open', $event)">
    <DrawerContent
      data-slot="connect-whatsapp-sheet"
      overlay-class="bg-foreground/45 backdrop-blur-none"
      class="items-center gap-4 px-5 pt-5 pb-7 data-[swipe-direction=down]:rounded-t-3xl"
    >
      <h2 id="connect-whatsapp-title" class="text-foreground text-subheading">
        Conectar WhatsApp
      </h2>

      <template v-if="!hasRequestedConnection">
        <p class="text-center text-label-lg text-muted-foreground">
          Vai conectar pelo mesmo celular que está usando agora? Informe o número pra receber um código — sem precisar de outro aparelho pra escanear o QR.
        </p>

        <div class="flex w-full flex-col gap-1.5">
          <label for="whatsapp-connect-phone" class="text-label text-muted-foreground">
            Número de WhatsApp (opcional)
          </label>
          <Input
            id="whatsapp-connect-phone"
            v-model="phoneNumberDisplay"
            type="text"
            inputmode="numeric"
            placeholder="(11) 99999-9999"
            autocomplete="tel-national"
            maxlength="15"
            @focus="isPhoneFieldFocused = true"
            @blur="isPhoneFieldFocused = false"
          />
        </div>

        <Button type="button" class="h-11 w-full rounded-xl text-button" @click="requestConnection">
          Continuar
        </Button>
      </template>

      <template v-else>
        <p class="text-center text-label-lg text-muted-foreground">
          Escaneie o QR code com outro celular ou, se estiver no mesmo aparelho, digite o código abaixo em WhatsApp → Aparelhos conectados → Conectar com número de telefone.
        </p>

        <div class="flex size-56 items-center justify-center rounded-2xl bg-card">
          <Spinner v-if="isGeneratingQr" class="size-8 text-muted-foreground" />
          <img
            v-else-if="qrCode"
            :src="qrCode"
            alt="QR code para conectar o WhatsApp do seu negócio"
            class="size-full rounded-2xl object-contain"
          >
          <p v-else class="px-4 text-center text-caption-md text-muted-foreground">
            {{ errorMessage ?? 'Não foi possível gerar o QR code.' }}
          </p>
        </div>

        <div v-if="pairingCode" class="flex w-full items-center justify-between gap-3 rounded-xl bg-card p-3.5">
          <span class="text-heading-sm text-foreground tracking-widest">{{ pairingCode }}</span>
          <TooltipProvider>
            <Tooltip v-model:open="copyTooltipOpen">
              <TooltipTrigger as-child>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Copiar código de conexão"
                  @click="copyPairingCode"
                >
                  <PhCopy class="size-5" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {{ justCopied ? 'Copiado!' : 'Copiar código' }}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <button
          v-if="!isGeneratingQr"
          type="button"
          class="text-primary text-tag"
          @click="requestConnection"
        >
          Gerar novo QR code
        </button>
      </template>

      <DrawerClose class="flex w-full items-center justify-center rounded-xl bg-surface p-3.25 text-foreground text-item-title">
        Fechar
      </DrawerClose>
    </DrawerContent>
  </Drawer>
</template>
