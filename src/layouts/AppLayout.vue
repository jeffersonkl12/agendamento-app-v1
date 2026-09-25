<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { AvatarMenu } from '@components/shared/avatar-menu'
import { LogoutDialog } from '@components/shared/logout-dialog'
import { NavBar } from '@components/shared/nav-bar'
import { NavMenu } from '@components/shared/nav-menu'
import { useAuth } from '@composables/useAuth'
import { useBusinessProfile } from '@composables/useBusinessProfile'

const route = useRoute()
const menuOpen = ref(false)
const logoutOpen = ref(false)

const { initials, load: loadBusinessProfile } = useBusinessProfile()
const { logout } = useAuth()

onMounted(loadBusinessProfile)

async function confirmLogout() {
  const result = await logout()
  if (!result.success && result.message)
    toast.error(result.message)
}
</script>

<template>
  <NavBar @menu-click="menuOpen = true">
    {{ route.meta.title }}
    <template #actions>
      <AvatarMenu :initials="initials" @logout="logoutOpen = true" />
    </template>
  </NavBar>

  <NavMenu v-model:open="menuOpen" />

  <main class="flex flex-col gap-6 px-5 pt-5 pb-6">
    <RouterView />
  </main>

  <LogoutDialog v-model:open="logoutOpen" @confirm="confirmLogout" />
</template>
