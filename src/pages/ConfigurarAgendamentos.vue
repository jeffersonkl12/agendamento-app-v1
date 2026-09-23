<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '@components/ui/button'
import Availability from '@views/configurar-agendamentos/Availability.vue'
import ScheduleHours from '@views/configurar-agendamentos/ScheduleHours.vue'
import ServiceTemplate from '@views/configurar-agendamentos/ServiceTemplate.vue'

function saveConfiguration() {
  // TODO: persistir configuração quando a camada dinâmica existir
  toast.success('Configuração salva com sucesso')
}
</script>

<template>
  <h1 class="sr-only">
    Configurar agendamentos
  </h1>

  <Availability />
  <ScheduleHours />
  <ServiceTemplate />

  <Button
    type="button"
    class="text-button-strong h-12 w-full rounded-2xl"
    @click="saveConfiguration"
  >
    Salvar configuração
  </Button>
</template>
