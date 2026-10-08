import { describe, it, expect } from 'vitest'
import { daysUntil, formatDeadlineCountdown, getDeadlineUrgency } from './deadline'

const NOW = new Date(2026, 9, 8, 15, 0) // 08/10/2026 15:00 local

describe('deadline urgency', () => {
  it('classifies by calendar days, ignoring the time of day', () => {
    expect(daysUntil(new Date(2026, 9, 8, 9, 0), NOW)).toBe(0)
    expect(daysUntil(new Date(2026, 9, 11), NOW)).toBe(3)
  })

  it('maps the remaining days to the color scale', () => {
    expect(getDeadlineUrgency(new Date(2026, 9, 7), NOW)).toBe('overdue')
    expect(getDeadlineUrgency(new Date(2026, 9, 8), NOW)).toBe('critical')
    expect(getDeadlineUrgency(new Date(2026, 9, 11), NOW)).toBe('critical')
    expect(getDeadlineUrgency(new Date(2026, 9, 15), NOW)).toBe('warning')
    expect(getDeadlineUrgency(new Date(2026, 9, 16), NOW)).toBe('ok')
  })

  it('writes a readable countdown', () => {
    expect(formatDeadlineCountdown(new Date(2026, 9, 5), NOW)).toBe('Venceu há 3 dias')
    expect(formatDeadlineCountdown(new Date(2026, 9, 7), NOW)).toBe('Venceu ontem')
    expect(formatDeadlineCountdown(new Date(2026, 9, 8), NOW)).toBe('Vence hoje')
    expect(formatDeadlineCountdown(new Date(2026, 9, 9), NOW)).toBe('Vence amanhã')
    expect(formatDeadlineCountdown(new Date(2026, 9, 20), NOW)).toBe('Vence em 12 dias')
  })
})
