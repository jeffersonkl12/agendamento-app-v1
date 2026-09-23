// DADOS ESTÁTICOS — trocar por camada dinâmica (service/store/composable) quando a skill existir.
// Assinaturas e tipos são o contrato; não alterar sem atualizar o manifesto.

export interface Plan {
  name: string
  price: string
  renewalLabel: string
}

export const plan: Plan = {
  name: 'Plano Essencial',
  price: 'R$ 49,90/mês',
  renewalLabel: 'Renova em 12 de outubro',
}
