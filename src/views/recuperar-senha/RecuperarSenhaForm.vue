<script setup lang="ts">
import { AuthInput } from '@components/auth/auth-input'
import { Button } from '@components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form'
import { toTypedSchema } from '@vee-validate/zod'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import * as z from 'zod'

const schema = toTypedSchema(
  z.object({
    email: z
      .string({ message: 'Informe seu e-mail' })
      .trim()
      .min(1, 'Informe seu e-mail')
      .email('Informe um e-mail válido'),
  }),
)

function onSubmit() {
  // TODO: enviar link de recuperação quando a camada de auth (service/store) existir — ver Decisão 5 do manifesto
  toast.success('Se o e-mail estiver cadastrado, você receberá um link em instantes.')
}
</script>

<template>
  <section
    class="flex flex-col items-center justify-center gap-3.5 px-7 pt-20 pb-15"
    aria-labelledby="recuperar-senha-title"
  >
    <div class="flex size-14 items-center justify-center rounded-2xl bg-primary">
      <span class="text-mark text-primary-foreground">SB</span>
    </div>

    <h1 id="recuperar-senha-title" class="text-center font-heading text-metric text-foreground">
      Recuperar senha
    </h1>

    <p class="text-center text-caption-lg text-muted-foreground">
      Informe seu e-mail e enviaremos um link para redefinir sua senha
    </p>

    <Form
      :validation-schema="schema"
      class="mt-1.5 flex w-full flex-col gap-3.5"
      @submit="onSubmit"
    >
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

      <Button
        type="submit"
        class="h-12 w-full rounded-xl px-3.5 text-button-strong hover:bg-primary/90"
      >
        Enviar link de recuperação
      </Button>
    </Form>

    <RouterLink to="/login" class="text-tag text-primary">
      Voltar para o login
    </RouterLink>
  </section>
</template>
