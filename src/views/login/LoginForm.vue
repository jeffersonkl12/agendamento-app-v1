<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import * as z from 'zod'
import { AuthHeader, AuthHeaderDescription, AuthHeaderTitle } from '@components/auth/auth-header'
import { AuthInput } from '@components/auth/auth-input'
import { GoogleButton } from '@components/auth/google-button'
import { Button } from '@components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form'
import { Separator } from '@components/ui/separator'
import { useAuth } from '@composables/useAuth'

// O better-auth só tem login por e-mail (sem plugin de username) — §2.
const schema = toTypedSchema(z.object({
  email: z.string({ message: 'Informe seu e-mail' }).trim().min(1, 'Informe seu e-mail').email('Informe um e-mail válido'),
  password: z.string({ message: 'Informe sua senha' }).min(1, 'Informe sua senha'),
}))

const { signIn, signInWithGoogle, isLoading } = useAuth()

async function onSubmit(values: Record<string, unknown>) {
  const result = await signIn({ email: String(values.email), password: String(values.password) })
  if (!result.success && result.message)
    toast.error(result.message)
}

async function onGoogleSignIn() {
  const result = await signInWithGoogle()
  if (!result.success && result.message)
    toast.error(result.message)
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

    <GoogleButton :disabled="isLoading" @click="onGoogleSignIn">
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
        <FormField v-slot="{ componentField }" name="email">
          <FormItem>
            <FormLabel class="sr-only">
              E-mail
            </FormLabel>
            <FormControl>
              <AuthInput
                type="email"
                autocomplete="email"
                inputmode="email"
                placeholder="E-mail"
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
        :disabled="isLoading"
        class="h-12 w-full rounded-xl px-3.5 text-button-strong hover:bg-primary/90"
      >
        {{ isLoading ? 'Entrando...' : 'Entrar' }}
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
