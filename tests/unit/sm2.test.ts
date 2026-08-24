import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createProgress, calculateNextReview, isDue, isNew } from '../../src/lib/sm2'

describe('createProgress', () => {
  it('initialises with SM-2 default values', () => {
    const p = createProgress('card:1')
    expect(p.cardId).toBe('card:1')
    expect(p.easiness).toBe(2.5)
    expect(p.interval).toBe(0)
    expect(p.repetitions).toBe(0)
    expect(p.nextReview).toBeTruthy()
    expect(p.lastReview).toBeTruthy()
  })
})

describe('calculateNextReview', () => {
  const base = createProgress('card:1')

  it('resets repetitions and sets interval=1 on quality < 3', () => {
    const r = calculateNextReview(base, 2)
    expect(r.repetitions).toBe(0)
    expect(r.interval).toBe(1)
  })

  it('sets interval=1 on first correct review (quality >= 3)', () => {
    const r = calculateNextReview(base, 4)
    expect(r.repetitions).toBe(1)
    expect(r.interval).toBe(1)
  })

  it('sets interval=6 on second consecutive correct review', () => {
    const r1 = calculateNextReview(base, 4)
    const r2 = calculateNextReview(r1, 4)
    expect(r2.repetitions).toBe(2)
    expect(r2.interval).toBe(6)
  })

  it('uses interval * easiness on third+ correct review', () => {
    const r1 = calculateNextReview(base, 4)
    const r2 = calculateNextReview(r1, 4)
    const r3 = calculateNextReview(r2, 4)
    expect(r3.interval).toBe(Math.round(6 * r2.easiness))
  })

  it('increases easiness on quality=5', () => {
    const r = calculateNextReview(base, 5)
    expect(r.easiness).toBeGreaterThan(2.5)
  })

  it('decreases easiness on quality=3', () => {
    const r = calculateNextReview(base, 3)
    expect(r.easiness).toBeLessThan(2.5)
  })

  it('never lets easiness drop below 1.3', () => {
    let p = base
    for (let i = 0; i < 25; i++) p = calculateNextReview(p, 0)
    expect(p.easiness).toBeGreaterThanOrEqual(1.3)
  })

  it('reset via quality=0 then correct review still progresses', () => {
    const reset = calculateNextReview(base, 0)
    const after = calculateNextReview(reset, 5)
    expect(after.repetitions).toBe(1)
    expect(after.interval).toBe(1)
  })

  it('schedules nextReview strictly in the future', () => {
    const before = Date.now()
    const r = calculateNextReview(base, 4)
    expect(new Date(r.nextReview).getTime()).toBeGreaterThan(before)
  })

  it('updates lastReview to now', () => {
    const before = Date.now()
    const r = calculateNextReview(base, 4)
    expect(new Date(r.lastReview).getTime()).toBeGreaterThanOrEqual(before)
  })
})

describe('isDue', () => {
  it('returns true when nextReview is in the past', () => {
    const past = new Date(Date.now() - 1000).toISOString()
    expect(isDue({ ...createProgress('c'), nextReview: past })).toBe(true)
  })

  it('returns false when nextReview is in the future', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString()
    expect(isDue({ ...createProgress('c'), nextReview: future })).toBe(false)
  })
})

describe('isNew', () => {
  it('returns true for a brand-new card', () => {
    expect(isNew(createProgress('c'))).toBe(true)
  })

  it('returns false after any review', () => {
    const reviewed = calculateNextReview(createProgress('c'), 4)
    expect(isNew(reviewed)).toBe(false)
  })

  it('returns false if repetitions=0 but interval>0', () => {
    const p = { ...createProgress('c'), interval: 1 }
    expect(isNew(p)).toBe(false)
  })
})
