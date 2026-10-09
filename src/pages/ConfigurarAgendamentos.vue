<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '@components/ui/button'
import { useSchedulingConfigForm, useSchedulingConfigFormSync } from '@composables/useSchedulingConfigForm'
import Availability from '@views/configurar-agendamentos/Availability.vue'
import ScheduleHours from '@views/configurar-agendamentos/ScheduleHours.vue'
import ServiceTemplate from '@views/configurar-agendamentos/ServiceTemplate.vue'

useSchedulingConfigFormSync()

const {
  openDays,
  hours,
  selectedTemplateId,
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

  <ServiceTemplate v-model:selected-template-id="selectedTemplateId" :warning="templateWarning" />
  <Availability v-model:open-days="openDays" />
  <ScheduleHours v-model:hours="hours" :label="hoursLabel" />

  <div class="flex flex-col gap-2">
    <Button
      type="button"
      :disabled="isSaving"
      class="text-button-strong h-12 w-full rounded-2xl"
      @click="saveConfiguration"
    >
      {{ isSaving ? 'Salvando...' : 'Salvar agenda' }}
    </Button>
    <p class="text-center text-caption text-muted-foreground">
      Salvar publica na hora para o assistente. Agendamentos já marcados não são alterados.
    </p>
  </div>
</template>
