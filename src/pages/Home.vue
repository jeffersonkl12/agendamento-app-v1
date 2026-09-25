<script setup lang="ts">
import { useAppointmentAgendaSync } from '@composables/useAppointmentAgenda'
import BotStatus from '@views/home/BotStatus.vue'
import Header from '@views/home/Header.vue'
import Overview from '@views/home/Overview.vue'
import UpcomingAppointments from '@views/home/UpcomingAppointments.vue'

useAppointmentAgendaSync()
</script>

<template>
  <Header />
  <BotStatus />
  <Overview />
  <UpcomingAppointments />
</template>
