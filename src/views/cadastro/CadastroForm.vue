<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { RouterLink } from 'vue-router'
import * as z from 'zod'
import { AuthInput } from '@components/auth/auth-input'
import { GoogleButton } from '@components/auth/google-button'
import { Button } from '@components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form'
import { Separator } from '@components/ui/separator'

const MESSAGE_CLASS = 'text-label text-error'

const schema = toTypedSchema(
  z
    .object({
      name: z.string({ message: 'Informe seu nome' }).min(1, 'Informe seu nome'),
      email: z
        .string({ message: 'Informe seu e-mail' })
        .min(1, 'Informe seu e-mail')
        .email('Informe um e-mail válido'),
      password: z.string({ message: 'Informe uma senha' }).min(1, 'Informe uma senha'),
      confirmPassword: z.string({ message: 'Confirme sua senha' }).min(1, 'Confirme sua senha'),
    })
    .refine(values => values.password === values.confirmPassword, {
      message: 'As senhas não coincidem.',
      path: ['confirmPassword'],
    }),
)

function onSubmit() {
  // TODO: implementar quando a camada de auth (service/store) existir — ver Decisão 5 do manifesto
}

function onGoogleSignIn() {
  // TODO: implementar quando a camada de auth existir — ver Decisão 5 do manifesto
}
</script>

<template>
  <section
    class="flex flex-col items-center justify-center gap-3.5 px-7 pt-20 pb-15"
    aria-labelledby="cadastro-title"
  >
    <div class="flex size-14 items-center justify-center rounded-2xl bg-primary">
      <span class="text-mark text-primary-foreground">SB</span>
    </div>

    <h1 id="cadastro-title" class="text-center font-heading text-metric text-foreground">
      Criar sua conta
    </h1>

    <p class="text-center text-caption-lg text-muted-foreground">
      Comece a organizar sua agenda em minutos
    </p>

    <GoogleButton @click="onGoogleSignIn">Cadastrar com Google</GoogleButton>

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
        <FormField v-slot="{ componentField }" name="name">
          <FormItem>
            <FormLabel class="sr-only">
              Nome
            </FormLabel>
            <FormControl>
              <AuthInput
                type="text"
                autocomplete="name"
                placeholder="Nome"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage :class="MESSAGE_CLASS" />
          </FormItem>
        </FormField>

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
            <FormMessage :class="MESSAGE_CLASS" />
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
                autocomplete="new-password"
                placeholder="Senha"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage :class="MESSAGE_CLASS" />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="confirmPassword">
          <FormItem>
            <FormLabel class="sr-only">
              Confirmar senha
            </FormLabel>
            <FormControl>
              <AuthInput
                type="password"
                autocomplete="new-password"
                placeholder="Confirmar senha"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage :class="MESSAGE_CLASS" />
          </FormItem>
        </FormField>
      </div>

      <Button
        type="submit"
        class="h-12 w-full rounded-xl px-3.5 text-button-strong hover:bg-primary/90"
      >
        Criar conta
      </Button>
    </Form>

    <p class="flex gap-1 text-caption-md text-muted-foreground">
      Já tem conta?
      <RouterLink to="/login" class="text-tag text-primary">
        Entrar
      </RouterLink>
    </p>
  </section>
</template>
