import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getTodaySessions, isReminderDue } from '../../src/lib/notifications'
import type { NotificationPrefs } from '../../src/types'

const FIXED_NOW = new Date('2026-08-24T14:00:00.000Z')

const basePrefs: NotificationPrefs = {
  appPermission: 'accepted',
  sessions: [],
  lastReminderAt: null,
  subscriptionId: 'sub-1',
}

beforeEach(() => vi.setSystemTime(FIXED_NOW))
afterEach(() => vi.useRealTimers())

describe('getTodaySessions', () => {
  it('returns only sessions from today', () => {
    const sessions = [
      new Date('2026-08-23T10:00:00Z').toISOString(), // yesterday
      new Date('2026-08-24T08:00:00Z').toISOString(), // today
      new Date('2026-08-24T13:00:00Z').toISOString(), // today
    ]
    expect(getTodaySessions(sessions)).toHaveLength(2)
  })

  it('returns empty array when no sessions exist today', () => {
    expect(getTodaySessions([new Date('2026-08-23T10:00:00Z').toISOString()])).toHaveLength(0)
  })

  it('returns empty array for empty input', () => {
    expect(getTodaySessions([])).toHaveLength(0)
  })
})

describe('isReminderDue', () => {
  it('returns true when no reminder has been sent yet', () => {
    expect(isReminderDue(basePrefs)).toBe(true)
  })

  it('returns false when 2 sessions already completed today', () => {
    const prefs: NotificationPrefs = {
      ...basePrefs,
      sessions: [
        new Date('2026-08-24T08:00:00Z').toISOString(),
        new Date('2026-08-24T12:00:00Z').toISOString(),
      ],
    }
    expect(isReminderDue(prefs)).toBe(false)
  })

  it('returns false when more than 2 sessions completed today', () => {
    const prefs: NotificationPrefs = {
      ...basePrefs,
      sessions: [
        new Date('2026-08-24T07:00:00Z').toISOString(),
        new Date('2026-08-24T09:00:00Z').toISOString(),
        new Date('2026-08-24T11:00:00Z').toISOString(),
      ],
    }
    expect(isReminderDue(prefs)).toBe(false)
  })

  it('returns true when last reminder was sent yesterday', () => {
    const prefs: NotificationPrefs = {
      ...basePrefs,
      lastReminderAt: new Date('2026-08-23T10:00:00Z').toISOString(),
    }
    expect(isReminderDue(prefs)).toBe(true)
  })

  it('returns false when last reminder was sent within 6 hours', () => {
    const fiveHoursAgo = new Date(FIXED_NOW.getTime() - 5 * 3600 * 1000).toISOString()
    expect(isReminderDue({ ...basePrefs, lastReminderAt: fiveHoursAgo })).toBe(false)
  })

  it('returns true when more than 6 hours have passed since last reminder', () => {
    const sevenHoursAgo = new Date(FIXED_NOW.getTime() - 7 * 3600 * 1000).toISOString()
    expect(isReminderDue({ ...basePrefs, lastReminderAt: sevenHoursAgo })).toBe(true)
  })

  it('returns true at exactly 6 hours (boundary)', () => {
    const sixHoursAgo = new Date(FIXED_NOW.getTime() - 6 * 3600 * 1000).toISOString()
    expect(isReminderDue({ ...basePrefs, lastReminderAt: sixHoursAgo })).toBe(true)
  })
})
