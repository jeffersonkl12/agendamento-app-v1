// DADOS ESTÁTICOS — trocar por camada dinâmica (service/store/composable) quando a skill existir.
// Assinaturas e tipos são o contrato; não alterar sem atualizar o manifesto.

export interface WeekDayAvailability {
  id: string
  label: string
  active: boolean
}

export const weekDays: WeekDayAvailability[] = [
  { id: 'seg', label: 'Seg', active: true },
  { id: 'ter', label: 'Ter', active: false },
  { id: 'qua', label: 'Qua', active: true },
  { id: 'qui', label: 'Qui', active: false },
  { id: 'sex', label: 'Sex', active: true },
  { id: 'sab', label: 'Sáb', active: false },
  { id: 'dom', label: 'Dom', active: false },
]

export interface ScheduleSettings {
  startTime: string
  endTime: string
  intervalMinutes: number
}

export const scheduleSettings: ScheduleSettings = {
  startTime: '09:00',
  endTime: '18:00',
  intervalMinutes: 30,
}
