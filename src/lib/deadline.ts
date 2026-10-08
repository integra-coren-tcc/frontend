// Escala de urgência dos prazos das notificações (v3), usada nas telas do RT:
// vermelho = vencido, laranja = vence em até 3 dias, amarelo = até 7 dias, verde = folga.
export type DeadlineUrgency = 'overdue' | 'critical' | 'warning' | 'ok'

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date: Date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return day
}

// Whole calendar days from today until the deadline (negative = overdue)
export function daysUntil(deadline: string | Date, now = new Date()): number {
  return Math.round((startOfDay(new Date(deadline)).getTime() - startOfDay(now).getTime()) / DAY_MS)
}

export function getDeadlineUrgency(deadline: string | Date, now = new Date()): DeadlineUrgency {
  const days = daysUntil(deadline, now)
  if (days < 0) return 'overdue'
  if (days <= 3) return 'critical'
  if (days <= 7) return 'warning'
  return 'ok'
}

export function formatDeadlineCountdown(deadline: string | Date, now = new Date()): string {
  const days = daysUntil(deadline, now)
  if (days < -1) return `Venceu há ${-days} dias`
  if (days === -1) return 'Venceu ontem'
  if (days === 0) return 'Vence hoje'
  if (days === 1) return 'Vence amanhã'
  return `Vence em ${days} dias`
}

// Tailwind classes per urgency (badge background, text and border)
export const DEADLINE_URGENCY_CLASSES: Record<DeadlineUrgency, string> = {
  overdue: 'bg-red-100 text-red-800 border-red-300',
  critical: 'bg-orange-100 text-orange-800 border-orange-300',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  ok: 'bg-green-100 text-green-800 border-green-300',
}

export const DEADLINE_URGENCY_LABELS: Record<DeadlineUrgency, string> = {
  overdue: 'Vencido',
  critical: 'Até 3 dias',
  warning: 'Até 7 dias',
  ok: 'No prazo',
}
