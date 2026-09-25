<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '@components/ui/button'
import { useSchedulingConfigForm, useSchedulingConfigFormSync } from '@composables/useSchedulingConfigForm'
import Availability from '@views/configurar-agendamentos/Availability.vue'
import ScheduleHours from '@views/configurar-agendamentos/ScheduleHours.vue'
import ServiceTemplate from '@views/configurar-agendamentos/ServiceTemplate.vue'

useSchedulingConfigFormSync()

const {
  enabledDays,
  hours,
  activeTemplateId,
  hoursLabel,
  templateWarning,
  isSaving,
  save,
} = useSchedulingConfigForm()

async function saveConfiguration() {
  const result = await save()
  if (result.success)
    toast.success(result.message)
  else
    toast.error(result.message)
}
</script>

<template>
  <h1 class="sr-only">
    Configurar agendamentos
  </h1>

  <Availability v-model:enabled-days="enabledDays" />
  <ScheduleHours v-model:hours="hours" :label="hoursLabel" />
  <ServiceTemplate v-model:active-template-id="activeTemplateId" :warning="templateWarning" />

  <div class="flex flex-col gap-2">
    <Button
      type="button"
      :disabled="isSaving"
      class="text-button-strong h-12 w-full rounded-2xl"
      @click="saveConfiguration"
    >
      {{ isSaving ? 'Salvando...' : 'Salvar configuração' }}
    </Button>
    <p class="text-center text-caption text-muted-foreground">
      Salvar publica na hora para o bot. Agendamentos já marcados não são alterados.
    </p>
  </div>
</template>
