import { describe, it, expect } from 'vitest'
import { dateToWeekKey, weekDates } from './week'

describe('dateToWeekKey', () => {
  it('puts 1 Jan 2026 (Thursday) in week 2026-W01', () => {
    expect(dateToWeekKey('2026-01-01')).toBe('2026-W01')
  })

  it('puts 29 Dec 2025 (Monday) in the following year week 2026-W01', () => {
    expect(dateToWeekKey('2025-12-29')).toBe('2026-W01')
  })

  it('puts 1 Jan 2021 (Friday) in the previous year week 2020-W53', () => {
    expect(dateToWeekKey('2021-01-01')).toBe('2020-W53')
  })

  it('zero-pads single-digit week numbers', () => {
    expect(dateToWeekKey('2026-03-01')).toBe('2026-W09')
  })
})

describe('weekDates', () => {
  it('returns 7 ISO dates Monday..Sunday for a week key', () => {
    const dates = weekDates('2026-W01')
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2025-12-29') // Monday
    expect(dates[6]).toBe('2026-01-04') // Sunday
  })

  it('round-trips: every date in a week maps back to that week key', () => {
    for (const d of weekDates('2026-W24')) {
      expect(dateToWeekKey(d)).toBe('2026-W24')
    }
  })
})
