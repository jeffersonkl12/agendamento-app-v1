<script setup lang="ts">
import type { Component } from 'vue'
import { PhCalendar, PhClipboardText, PhHouse, PhSlidersHorizontal, PhX } from '@phosphor-icons/vue'
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@components/ui/sheet'

interface NavItem {
  label: string
  to: string
  icon: Component
}

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const route = useRoute()

const navItems: NavItem[] = [
  { label: 'Início', to: '/', icon: PhHouse },
  { label: 'Agenda', to: '/agenda', icon: PhCalendar },
  { label: 'Modelo de atendimento', to: '/modelo-atendimento', icon: PhClipboardText },
  { label: 'Configurar agendamentos', to: '/configurar-agendamentos', icon: PhSlidersHorizontal },
]

watch(() => route.path, () => emit('update:open', false))
</script>

<template>
  <Sheet :open="props.open" @update:open="emit('update:open', $event)">
    <SheetContent
      data-slot="nav-menu"
      side="left"
      :show-close-button="false"
      overlay-class="bg-foreground/45 backdrop-blur-none"
      class="gap-1 pt-13.5 px-4.5 pb-5 data-[side=left]:w-72.5 data-[side=left]:border-r-0"
    >
      <div class="flex items-center justify-between pb-5">
        <SheetTitle as-child>
          <span class="text-muted-foreground text-overline-lg">MENU</span>
        </SheetTitle>

        <SheetClose
          aria-label="Fechar menu"
          class="bg-surface text-primary flex size-8 items-center justify-center rounded-lg"
        >
          <PhX class="size-3.75" aria-hidden="true" />
        </SheetClose>
      </div>

      <nav aria-label="Menu de navegação" class="flex flex-col gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-3 rounded-xl px-3 py-3.25 text-item-title',
            route.path === item.to ? 'bg-primary-soft text-primary' : 'text-foreground',
          ]"
        >
          <component :is="item.icon" class="size-4.75" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </SheetContent>
  </Sheet>
</template>
