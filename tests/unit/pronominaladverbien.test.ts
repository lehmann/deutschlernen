import { describe, it, expect } from 'vitest'
import { PRONOMINALADVERB_DATA } from '../../src/data/pronominaladverbien'

const PREFIX = /^(hier|da|wo)/

function expectedPreposition(answer: string): string {
  let rest = answer.toLowerCase().replace(PREFIX, '')
  if (/^r[aeiouäöü]/.test(rest)) rest = rest.slice(1)
  return rest
}

describe('PRONOMINALADVERB_DATA integrity', () => {
  it('contains at least 200 sentences', () => {
    expect(PRONOMINALADVERB_DATA.length).toBeGreaterThanOrEqual(200)
  })

  it('all entry IDs are unique', () => {
    const ids = PRONOMINALADVERB_DATA.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each sentence has exactly one _BLANK_ placeholder', () => {
    for (const e of PRONOMINALADVERB_DATA) {
      expect(e.sentence.split('_BLANK_').length - 1, e.id).toBe(1)
    }
  })

  it('answer is a da-/wo-/hier- form that fills the blank', () => {
    for (const e of PRONOMINALADVERB_DATA) {
      expect(e.answer.toLowerCase(), e.id).toMatch(PREFIX)
      expect(e.sentence.replace('_BLANK_', e.answer), e.id).not.toContain('_BLANK_')
    }
  })

  it('kind matches the answer prefix', () => {
    for (const e of PRONOMINALADVERB_DATA) {
      const expected = e.answer.toLowerCase().startsWith('hier') ? 'hier'
        : e.answer.toLowerCase().startsWith('wo') ? 'wo'
        : 'da'
      expect(e.kind, e.id).toBe(expected)
    }
  })

  it('preposition hint is the one contained in the answer', () => {
    for (const e of PRONOMINALADVERB_DATA) {
      expect(e.preposition, e.id).toBe(expectedPreposition(e.answer))
    }
  })

  it('all entries have a Portuguese translation', () => {
    for (const e of PRONOMINALADVERB_DATA) {
      expect(e.translation, e.id).toBeTruthy()
    }
  })

  it('has two distinct distractors, different from the answer', () => {
    for (const e of PRONOMINALADVERB_DATA) {
      const [d1, d2] = e.distractors
      expect(d1, e.id).toBeTruthy()
      expect(d2, e.id).toBeTruthy()
      expect(new Set([e.answer.toLowerCase(), d1.toLowerCase(), d2.toLowerCase()]).size, e.id).toBe(3)
    }
  })

  it('every entry has an explanation that names the correct preposition', () => {
    for (const e of PRONOMINALADVERB_DATA) {
      expect(e.explanation, e.id).toContain(e.preposition)
    }
  })
})
