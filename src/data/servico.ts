// DADOS ESTÁTICOS — trocar por camada dinâmica (service/store/composable) quando a skill existir.
// Assinaturas e tipos são o contrato; não alterar sem atualizar o manifesto.

export interface Service {
  name: string
  price: number
}

export interface ServiceQuestion {
  id: string
  icon: string
  title: string
  typeLabel: string
  required: boolean
}

export const service: Service = { name: 'Dia de Spa Relax', price: 10 }

export const serviceQuestions: ServiceQuestion[] = [
  { id: '1', icon: '◉', title: 'Tipo de tratamento desejado', typeLabel: 'Escolha única', required: true },
  { id: '2', icon: '✓', title: 'Quer incluir massagem nos pés?', typeLabel: 'Sim ou não', required: true },
  { id: '3', icon: 'Aa', title: 'Alguma preferência ou observação?', typeLabel: 'Texto livre', required: false },
  { id: '4', icon: '#', title: 'Quantas pessoas vão participar?', typeLabel: 'Número', required: false },
]
