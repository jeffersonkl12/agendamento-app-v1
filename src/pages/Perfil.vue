<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { LogoutDialog } from '@components/shared/logout-dialog'
import { Button } from '@components/ui/button'
import { useAuth } from '@composables/useAuth'
import ProfileHeader from '@views/perfil/ProfileHeader.vue'
import WhatsappConnection from '@views/perfil/WhatsappConnection.vue'

const logoutOpen = ref(false)

const { logout } = useAuth()

async function confirmLogout() {
  const result = await logout()
  if (!result.success && result.message)
    toast.error(result.message)
}
</script>

<template>
  <h1 class="sr-only">
    Perfil
  </h1>

  <ProfileHeader />
  <WhatsappConnection />

  <Button
    type="button"
    variant="destructive"
    class="text-button-strong h-12 w-full rounded-2xl bg-error-bg hover:bg-error-bg/80"
    @click="logoutOpen = true"
  >
    Sair da conta
  </Button>

  <LogoutDialog v-model:open="logoutOpen" @confirm="confirmLogout" />
</template>
