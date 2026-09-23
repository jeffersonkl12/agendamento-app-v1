// DADOS ESTÁTICOS — trocar por camada dinâmica (service/store/composable) quando a skill existir.
// Assinaturas e tipos são o contrato; não alterar sem atualizar o manifesto.

export interface Business {
  name: string
  initials: string
}

export const business: Business = { name: 'Studio Bella', initials: 'SB' }
