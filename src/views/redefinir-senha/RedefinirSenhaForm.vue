<script setup lang="ts">
import { AuthHeader, AuthHeaderDescription, AuthHeaderTitle } from '@components/auth/auth-header'
import { AuthInput } from '@components/auth/auth-input'
import { Button } from '@components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form'
import { useAuth } from '@composables/useAuth'
import { toTypedSchema } from '@vee-validate/zod'
import { toast } from 'vue-sonner'
import { RouterLink } from 'vue-router'
import * as z from 'zod'

const schema = toTypedSchema(
  z
    .object({
      password: z.string({ message: 'Informe a nova senha.' }).min(1, 'Informe a nova senha.'),
      confirmPassword: z
        .string({ message: 'Confirme a nova senha.' })
        .min(1, 'Confirme a nova senha.'),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: 'As senhas não coincidem.',
      path: ['confirmPassword'],
    }),
)

const { resetPassword, resetTokenError, isLoading } = useAuth()

async function onSubmit(values: Record<string, unknown>) {
  const result = await resetPassword(String(values.password))
  if (result.success && result.message)
    toast.success(result.message)
  else if (result.message)
    toast.error(result.message)
}
</script>

<template>
  <section
    class="flex flex-col items-center justify-center gap-3.5 px-7 pt-20 pb-15"
    aria-labelledby="redefinir-senha-title"
  >
    <AuthHeader>
      <AuthHeaderTitle id="redefinir-senha-title">Criar nova senha</AuthHeaderTitle>
      <AuthHeaderDescription>
        Sua identidade foi confirmada. Defina uma nova senha para acessar sua conta.
      </AuthHeaderDescription>
    </AuthHeader>

    <template v-if="resetTokenError">
      <p role="alert" class="mt-5 text-center text-error text-paragraph">
        {{ resetTokenError }}
      </p>
      <RouterLink to="/recuperar-senha" class="text-primary text-tag">
        Solicitar novo link
      </RouterLink>
    </template>

    <!-- mt-5 reproduz o Spacer (yixVO, 6px) + gap da seção: ~34px entre subtítulo e primeiro campo -->
    <Form
      v-else
      class="mt-5 flex w-full flex-col gap-3.5"
      :validation-schema="schema"
      @submit="onSubmit"
    >
      <FormField v-slot="{ componentField }" name="password">
        <FormItem>
          <FormLabel class="sr-only">Nova senha</FormLabel>
          <FormControl>
            <AuthInput
              type="password"
              placeholder="Nova senha"
              autocomplete="new-password"
              v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="confirmPassword">
        <FormItem>
          <FormLabel class="sr-only">Confirmar nova senha</FormLabel>
          <FormControl>
            <AuthInput
              type="password"
              placeholder="Confirmar nova senha"
              autocomplete="new-password"
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
        Salvar nova senha
      </Button>
    </Form>

    <RouterLink to="/login" class="text-tag text-primary">
      Voltar para o login
    </RouterLink>
  </section>
</template>
