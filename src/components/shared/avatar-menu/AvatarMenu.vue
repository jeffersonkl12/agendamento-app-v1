<script setup lang="ts">
import { PhSignOut, PhUser } from '@phosphor-icons/vue'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/ui/dropdown-menu'

const props = defineProps<{
  initials: string
}>()

const emit = defineEmits<{
  logout: []
}>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger
      aria-label="Abrir menu do perfil"
      class="bg-primary text-primary-foreground text-tag focus-visible:ring-ring flex size-8.5 items-center justify-center rounded-full outline-none focus-visible:ring-2"
    >
      <span v-if="props.initials">{{ props.initials }}</span>
      <PhUser v-else class="size-4" aria-hidden="true" />
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
      :side-offset="10"
      class="ring-foreground/6 w-40 rounded-xl p-1.5 shadow-lg"
    >
      <DropdownMenuItem as-child class="gap-2.5 rounded-lg px-3 py-2.75 text-tag-lg">
        <RouterLink to="/perfil">
          <PhUser class="size-4" aria-hidden="true" />
          Perfil
        </RouterLink>
      </DropdownMenuItem>

      <DropdownMenuItem
        variant="destructive"
        class="gap-2.5 rounded-lg px-3 py-2.75 text-tag-lg"
        @click="emit('logout')"
      >
        <PhSignOut class="size-4" aria-hidden="true" />
        Sair
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
