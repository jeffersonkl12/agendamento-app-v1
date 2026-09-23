<script setup lang="ts">
import { Avatar, AvatarFallback } from '@components/ui/avatar'
import { Button } from '@components/ui/button'
import { business } from '@data/business'
</script>

<template>
  <section class="flex flex-col gap-6" aria-labelledby="profile-header-name">
    <p class="text-caption-md text-muted-foreground">
      Seus dados e assinatura
    </p>

    <div class="flex flex-col items-center gap-2.5">
      <Avatar class="size-21">
        <AvatarFallback class="bg-primary-soft text-label-lg text-primary">
          Sua foto
        </AvatarFallback>
      </Avatar>
      <p class="text-label-strong-lg text-primary">
        Toque para definir uma foto
      </p>
    </div>

    <div class="flex items-center justify-between gap-3 rounded-2xl bg-card p-3.5">
      <div class="flex min-w-0 flex-col">
        <h2 id="profile-header-name" class="text-heading-sm text-foreground">
          {{ business.name }}
        </h2>
        <p class="text-label text-muted-foreground">
          Nome do seu negócio
        </p>
      </div>
      <Button
        type="button"
        aria-label="Editar nome do negócio"
        class="h-8 rounded-xl bg-primary-soft px-3 text-label-strong-lg text-primary hover:bg-primary-soft/80"
      >
        Editar
      </Button>
    </div>
  </section>
</template>
