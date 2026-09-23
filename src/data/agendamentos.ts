// DADOS ESTÁTICOS — trocar por camada dinâmica (service/store/composable) quando a skill existir.
// Assinaturas e tipos são o contrato; não alterar sem atualizar o manifesto.

export interface AppointmentAddon {
  label: string
  value: string
}

export interface Appointment {
  id: string
  date: string
  day: string
  time: string
  clientName: string
  service: string
  statusLabel: string
  statusVariant: 'success' | 'warning' | 'error'
  addon?: AppointmentAddon
}

export const upcomingAppointments: Appointment[] = [
  { id: '1', date: '2026-09-21', day: 'SEG 21', time: '09:00', clientName: 'Mariana Alves', service: 'Limpeza de pele', statusLabel: 'Confirmado', statusVariant: 'success' },
  { id: '2', date: '2026-09-23', day: 'QUA 23', time: '10:00', clientName: 'Carla Souza', service: 'Day spa completo', statusLabel: 'Confirmado', statusVariant: 'success', addon: { label: 'Massagem nos pés', value: 'Com massagem nos pés' } },
  { id: '3', date: '2026-09-23', day: 'QUA 23', time: '14:30', clientName: 'Beatriz Lima', service: 'Massagem relaxante', statusLabel: 'Aguardando bot', statusVariant: 'warning' },
]

// Ids 4-6: vieram do node pUk68 ("3b · Agenda (Lista)") do Pencil, lido no /pencil da view
// AppointmentsList — não são mais mock inventado (correção do que o build-prep tinha chutado
// pros dias 2, 9 e 25, sem acesso a esse frame na hora).
export const appointments: Appointment[] = [
  ...upcomingAppointments,
  { id: '4', date: '2026-09-02', day: 'QUA 02', time: '11:00', clientName: 'Juliana Prado', service: 'Massagem relaxante', statusLabel: 'Confirmado', statusVariant: 'success' },
  { id: '5', date: '2026-09-09', day: 'QUA 09', time: '15:00', clientName: 'Renata Dias', service: 'Day spa completo', statusLabel: 'Aguardando bot', statusVariant: 'warning' },
  { id: '6', date: '2026-09-25', day: 'SEX 25', time: '09:30', clientName: 'Fernanda Reis', service: 'Manicure e pedicure', statusLabel: 'Confirmado', statusVariant: 'success' },
]
