import { describe, it, expect, afterEach, vi } from 'vitest'
import { reducer } from '../../src/store/index'
import { ALL_CARDS } from '../../src/store/index'
import { VOCABULARY } from '../../src/data/vocabulary'
import type { AppState } from '../../src/types'

const EMPTY: AppState = {
  schemaVersion: 2,
  progress: {},
  activeVocabIds: [],
  notifications: {
    appPermission: 'not_asked',
    sessions: [],
    lastReminderAt: null,
    subscriptionId: null,
  },
}

const V0 = VOCABULARY[0].id
const V1 = VOCABULARY[1].id

afterEach(() => vi.useRealTimers())

// ─── ADD_VOCAB ────────────────────────────────────────────────────────────────

describe('ADD_VOCAB', () => {
  it('adds vocabId to activeVocabIds', () => {
    const s = reducer(EMPTY, { type: 'ADD_VOCAB', vocabId: V0 })
    expect(s.activeVocabIds).toContain(V0)
  })

  it('creates progress entries for all cards of the vocab', () => {
    const s = reducer(EMPTY, { type: 'ADD_VOCAB', vocabId: V0 })
    const owned = Object.keys(s.progress).filter(id => id.startsWith(V0))
    expect(owned.length).toBeGreaterThanOrEqual(2)
  })

  it('does not add the same vocab twice', () => {
    const once = reducer(EMPTY, { type: 'ADD_VOCAB', vocabId: V0 })
    const twice = reducer(once, { type: 'ADD_VOCAB', vocabId: V0 })
    expect(twice.activeVocabIds.filter(id => id === V0)).toHaveLength(1)
  })

  it('does not create duplicate progress keys', () => {
    const once = reducer(EMPTY, { type: 'ADD_VOCAB', vocabId: V0 })
    const twice = reducer(once, { type: 'ADD_VOCAB', vocabId: V0 })
    expect(Object.keys(twice.progress)).toEqual(Object.keys(once.progress))
  })
})

// ─── ADD_VOCAB_BULK ───────────────────────────────────────────────────────────

describe('ADD_VOCAB_BULK', () => {
  const ids = VOCABULARY.slice(0, 22).map(v => v.id)

  it('adds all vocabIds', () => {
    const s = reducer(EMPTY, { type: 'ADD_VOCAB_BULK', vocabIds: ids })
    for (const id of ids) expect(s.activeVocabIds).toContain(id)
  })

  it('staggers: exactly 10 entries scheduled for today', () => {
    const now = new Date('2026-08-24T12:00:00Z')
    vi.setSystemTime(now)
    const s = reducer(EMPTY, { type: 'ADD_VOCAB_BULK', vocabIds: ids })
    const todayStr = now.toDateString()
    const countToday = ids.filter(id => {
      const cardId = ALL_CARDS.find(c => c.vocabId === id)!.id
      return new Date(s.progress[cardId].nextReview).toDateString() === todayStr
    }).length
    expect(countToday).toBe(10)
  })

  it('staggers: exactly 10 entries scheduled for tomorrow', () => {
    const now = new Date('2026-08-24T12:00:00Z')
    vi.setSystemTime(now)
    const s = reducer(EMPTY, { type: 'ADD_VOCAB_BULK', vocabIds: ids })
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toDateString()
    const countTomorrow = ids.filter(id => {
      const cardId = ALL_CARDS.find(c => c.vocabId === id)!.id
      return new Date(s.progress[cardId].nextReview).toDateString() === tomorrowStr
    }).length
    expect(countTomorrow).toBe(10)
  })

  it('skips already active vocab', () => {
    const withFirst = reducer(EMPTY, { type: 'ADD_VOCAB', vocabId: ids[0] })
    const s = reducer(withFirst, { type: 'ADD_VOCAB_BULK', vocabIds: ids })
    expect(s.activeVocabIds.filter(id => id === ids[0])).toHaveLength(1)
  })

  it('is a no-op when all vocab already active', () => {
    const full = reducer(EMPTY, { type: 'ADD_VOCAB_BULK', vocabIds: ids })
    const again = reducer(full, { type: 'ADD_VOCAB_BULK', vocabIds: ids })
    expect(again.activeVocabIds.length).toBe(full.activeVocabIds.length)
  })
})

// ─── REMOVE_VOCAB ─────────────────────────────────────────────────────────────

describe('REMOVE_VOCAB', () => {
  it('removes vocabId from activeVocabIds', () => {
    const with0 = reducer(EMPTY, { type: 'ADD_VOCAB', vocabId: V0 })
    const s = reducer(with0, { type: 'REMOVE_VOCAB', vocabId: V0 })
    expect(s.activeVocabIds).not.toContain(V0)
  })

  it('removes all associated progress entries', () => {
    const with0 = reducer(EMPTY, { type: 'ADD_VOCAB', vocabId: V0 })
    const s = reducer(with0, { type: 'REMOVE_VOCAB', vocabId: V0 })
    expect(Object.keys(s.progress).some(id => id.startsWith(V0))).toBe(false)
  })

  it('does not touch other vocab progress', () => {
    const with01 = reducer(
      reducer(EMPTY, { type: 'ADD_VOCAB', vocabId: V0 }),
      { type: 'ADD_VOCAB', vocabId: V1 },
    )
    const s = reducer(with01, { type: 'REMOVE_VOCAB', vocabId: V0 })
    expect(Object.keys(s.progress).some(id => id.startsWith(V1))).toBe(true)
  })
})

// ─── REVIEW_CARD ──────────────────────────────────────────────────────────────

describe('REVIEW_CARD', () => {
  it('updates progress for the reviewed card', () => {
    const s = reducer(EMPTY, { type: 'ADD_VOCAB', vocabId: V0 })
    const cardId = Object.keys(s.progress)[0]
    const s2 = reducer(s, { type: 'REVIEW_CARD', cardId, rating: 'good' })
    expect(s2.progress[cardId].repetitions).toBe(1)
  })

  it('"again" rating resets repetitions to 0', () => {
    const s1 = reducer(EMPTY, { type: 'ADD_VOCAB', vocabId: V0 })
    const cardId = Object.keys(s1.progress)[0]
    const s2 = reducer(s1, { type: 'REVIEW_CARD', cardId, rating: 'good' })
    const s3 = reducer(s2, { type: 'REVIEW_CARD', cardId, rating: 'again' })
    expect(s3.progress[cardId].repetitions).toBe(0)
  })

  it('"easy" rating gives higher interval than "good" by the 3rd review', () => {
    // SM-2: interval diverges only after rep 3 (uses easiness factor).
    // Reps 1 and 2 produce fixed intervals (1 and 6) regardless of quality.
    const base = reducer(EMPTY, { type: 'ADD_VOCAB', vocabId: V0 })
    const cardId = Object.keys(base.progress)[0]
    const review = (s: typeof EMPTY, rating: 'good' | 'easy') =>
      reducer(s, { type: 'REVIEW_CARD', cardId, rating })

    const afterGood3 = review(review(review(base, 'good'), 'good'), 'good')
    const afterEasy3 = review(review(review(base, 'easy'), 'easy'), 'easy')

    expect(afterEasy3.progress[cardId].interval).toBeGreaterThan(
      afterGood3.progress[cardId].interval,
    )
  })

  it('is a no-op for unknown cardId', () => {
    const s = reducer(EMPTY, { type: 'REVIEW_CARD', cardId: 'nonexistent', rating: 'good' })
    expect(s).toEqual(EMPTY)
  })
})

// ─── RECORD_SESSION ───────────────────────────────────────────────────────────

describe('RECORD_SESSION', () => {
  it('appends a session timestamp', () => {
    const s = reducer(EMPTY, { type: 'RECORD_SESSION' })
    expect(s.notifications.sessions).toHaveLength(1)
    expect(new Date(s.notifications.sessions[0]).getFullYear()).toBeGreaterThan(2000)
  })

  it('accumulates multiple sessions', () => {
    const s = reducer(
      reducer(EMPTY, { type: 'RECORD_SESSION' }),
      { type: 'RECORD_SESSION' },
    )
    expect(s.notifications.sessions).toHaveLength(2)
  })

  it('trims sessions older than 30 days', () => {
    const old = new Date()
    old.setDate(old.getDate() - 31)
    const stale: AppState = {
      ...EMPTY,
      notifications: { ...EMPTY.notifications, sessions: [old.toISOString()] },
    }
    const s = reducer(stale, { type: 'RECORD_SESSION' })
    expect(s.notifications.sessions).toHaveLength(1)
    expect(new Date(s.notifications.sessions[0]).getTime()).toBeGreaterThan(old.getTime())
  })
})

// ─── NOTIFICATION ACTIONS ─────────────────────────────────────────────────────

describe('SET_NOTIFICATION_PERM', () => {
  it('sets appPermission to accepted', () => {
    const s = reducer(EMPTY, { type: 'SET_NOTIFICATION_PERM', appPermission: 'accepted' })
    expect(s.notifications.appPermission).toBe('accepted')
  })

  it('sets appPermission to declined', () => {
    const s = reducer(EMPTY, { type: 'SET_NOTIFICATION_PERM', appPermission: 'declined' })
    expect(s.notifications.appPermission).toBe('declined')
  })
})

describe('SET_SUBSCRIPTION_ID', () => {
  it('stores the subscriptionId', () => {
    const s = reducer(EMPTY, { type: 'SET_SUBSCRIPTION_ID', subscriptionId: 'sub-xyz' })
    expect(s.notifications.subscriptionId).toBe('sub-xyz')
  })
})

describe('RECORD_REMINDER_SENT', () => {
  it('sets lastReminderAt to current time', () => {
    const now = new Date('2026-08-24T14:00:00.000Z')
    vi.setSystemTime(now)
    const s = reducer(EMPTY, { type: 'RECORD_REMINDER_SENT' })
    expect(s.notifications.lastReminderAt).toBe(now.toISOString())
  })
})

// ─── RESET ────────────────────────────────────────────────────────────────────

describe('RESET', () => {
  it('returns a clean state regardless of previous data', () => {
    const dirty = reducer(
      reducer(EMPTY, { type: 'ADD_VOCAB', vocabId: V0 }),
      { type: 'SET_NOTIFICATION_PERM', appPermission: 'accepted' },
    )
    const s = reducer(dirty, { type: 'RESET' })
    expect(s.activeVocabIds).toEqual([])
    expect(s.progress).toEqual({})
    expect(s.notifications.appPermission).toBe('not_asked')
    expect(s.notifications.subscriptionId).toBeNull()
    expect(s.schemaVersion).toBe(2)
  })
})
