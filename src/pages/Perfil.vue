<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@components/ui/button'
import { LogoutDialog } from '@components/shared/logout-dialog'
import Plan from '@views/perfil/Plan.vue'
import ProfileHeader from '@views/perfil/ProfileHeader.vue'

const logoutOpen = ref(false)
</script>

<template>
  <h1 class="sr-only">
    Perfil
  </h1>

  <ProfileHeader />
  <Plan />

  <Button
    type="button"
    variant="destructive"
    class="text-button-strong h-12 w-full rounded-2xl bg-error-bg hover:bg-error-bg/80"
    @click="logoutOpen = true"
  >
    Sair da conta
  </Button>

  <LogoutDialog v-model:open="logoutOpen" />
</template>
