<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { AvatarMenu } from '@components/shared/avatar-menu'
import { NavBar } from '@components/shared/nav-bar'
import { NavMenu } from '@components/shared/nav-menu'

const route = useRoute()
const menuOpen = ref(false)
</script>

<template>
  <NavBar @menu-click="menuOpen = true">
    {{ route.meta.title }}
    <template #actions>
      <AvatarMenu />
    </template>
  </NavBar>

  <NavMenu v-model:open="menuOpen" />

  <main class="flex flex-col gap-6 px-5 pt-5 pb-6">
    <RouterView />
  </main>
</template>
