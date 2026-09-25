<script setup lang="ts">
import { AuthHeader, AuthHeaderDescription, AuthHeaderTitle } from '@components/auth/auth-header'
import { AuthInput } from '@components/auth/auth-input'
import { Button } from '@components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form'
import { useAuth } from '@composables/useAuth'
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

const { requestPasswordReset, isLoading } = useAuth()

async function onSubmit(values: Record<string, unknown>) {
  const result = await requestPasswordReset(String(values.email))
  if (result.success && result.message)
    toast.success(result.message)
  else if (result.message)
    toast.error(result.message)
}
</script>

<template>
  <section
    class="flex flex-col items-center justify-center gap-3.5 px-7 pt-20 pb-15"
    aria-labelledby="recuperar-senha-title"
  >
    <AuthHeader>
      <AuthHeaderTitle id="recuperar-senha-title">
        Recuperar senha
      </AuthHeaderTitle>
      <AuthHeaderDescription>
        Informe seu e-mail e enviaremos um link para redefinir sua senha
      </AuthHeaderDescription>
    </AuthHeader>

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
        :disabled="isLoading"
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
