// DADOS ESTÁTICOS — trocar por camada dinâmica (service/store/composable) quando a skill existir.
// Assinaturas e tipos são o contrato; não alterar sem atualizar o manifesto.

export interface Stats {
  revenue: number
  appointmentsCount: number
  avgTicket: number
}

export type Period = 'month' | 'total'

// O design (Pencil) só mostra o estado "Este mês" do segmented control — os valores
// de "Total" abaixo são mock ilustrativo, sem referência de design (ver docs/build-handoff-home.md).
export const stats: Record<Period, Stats> = {
  month: { revenue: 3240, appointmentsCount: 42, avgTicket: 77.14 },
  total: { revenue: 28960, appointmentsCount: 376, avgTicket: 77.02 },
}
