<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { RouterLink } from 'vue-router'
import * as z from 'zod'
import { AuthHeader, AuthHeaderDescription, AuthHeaderTitle } from '@components/auth/auth-header'
import { AuthInput } from '@components/auth/auth-input'
import { GoogleButton } from '@components/auth/google-button'
import { Button } from '@components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form'
import { Separator } from '@components/ui/separator'

const schema = toTypedSchema(z.object({
  identifier: z.string({ message: 'Informe seu e-mail ou usuário' }).min(1, 'Informe seu e-mail ou usuário'),
  password: z.string({ message: 'Informe sua senha' }).min(1, 'Informe sua senha'),
}))

function onSubmit() {
  // TODO: autenticar quando a camada de auth (service/store) existir — ver Decisão 5 do manifesto
}

function onGoogleSignIn() {
  // TODO: login com Google quando a camada de auth existir — ver Decisão 5 do manifesto
}
</script>

<template>
  <section
    class="flex flex-col items-center justify-center gap-3.5 px-7 pt-20 pb-15"
    aria-labelledby="login-title"
  >
    <AuthHeader>
      <AuthHeaderTitle id="login-title">
        Bem-vindo de volta
      </AuthHeaderTitle>
      <AuthHeaderDescription>
        Entre para gerenciar seus agendamentos
      </AuthHeaderDescription>
    </AuthHeader>

    <GoogleButton @click="onGoogleSignIn">
      Continuar com Google
    </GoogleButton>

    <div class="flex w-full items-center gap-2.5">
      <Separator class="flex-1 bg-border-subtle" />
      <span class="text-label text-muted-foreground-soft">ou</span>
      <Separator class="flex-1 bg-border-subtle" />
    </div>

    <Form
      :validation-schema="schema"
      class="flex w-full flex-col gap-3.5"
      @submit="onSubmit"
    >
      <div class="flex flex-col gap-2.5">
        <FormField v-slot="{ componentField }" name="identifier">
          <FormItem>
            <FormLabel class="sr-only">
              E-mail ou usuário
            </FormLabel>
            <FormControl>
              <AuthInput
                type="text"
                autocomplete="username"
                placeholder="E-mail ou usuário"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="password">
          <FormItem>
            <FormLabel class="sr-only">
              Senha
            </FormLabel>
            <FormControl>
              <AuthInput
                type="password"
                autocomplete="current-password"
                placeholder="Senha"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <div class="flex justify-end">
        <RouterLink to="/recuperar-senha" class="text-tag-sm text-primary">
          Esqueci minha senha
        </RouterLink>
      </div>

      <Button
        type="submit"
        class="h-12 w-full rounded-xl px-3.5 text-button-strong hover:bg-primary/90"
      >
        Entrar
      </Button>
    </Form>

    <p class="flex gap-1 text-caption-md text-muted-foreground">
      Não tem conta?
      <RouterLink to="/cadastro" class="text-tag text-primary">
        Criar conta
      </RouterLink>
    </p>
  </section>
</template>
