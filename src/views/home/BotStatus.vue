<script setup lang="ts">
import { PhWarningCircle } from '@phosphor-icons/vue'
import { onMounted } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert'
import { useOnboardingStatus } from '@composables/useOnboardingStatus'

const { isLoaded, isBotReady, pendingItems, loadStatus } = useOnboardingStatus()

onMounted(loadStatus)
</script>

<template>
  <Alert
    v-if="isLoaded && !isBotReady"
    class="gap-y-1.5 rounded-2xl border-warning bg-warning-bg p-3.5 text-warning"
  >
    <PhWarningCircle class="size-5" aria-hidden="true" />
    <AlertTitle class="text-foreground text-item-title">
      Seu bot ainda não está agendando
    </AlertTitle>
    <AlertDescription class="text-muted-foreground text-caption-md">
      <p>Conclua os passos abaixo para o WhatsApp começar a receber agendamentos:</p>
      <ul class="flex flex-col gap-1">
        <li v-for="item in pendingItems" :key="item.id">
          <RouterLink :to="item.to" class="text-primary text-tag">
            {{ item.label }} <span aria-hidden="true">→</span>
          </RouterLink>
        </li>
      </ul>
    </AlertDescription>
  </Alert>
</template>
