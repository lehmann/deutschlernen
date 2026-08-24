import { describe, it, expect } from 'vitest'
import { VOCABULARY } from '../../src/data/vocabulary'
import { THEME_LABELS } from '../../src/types'

const VALID_THEMES = Object.keys(THEME_LABELS)
const VALID_ARTICLES = ['der', 'die', 'das'] as const

describe('VOCABULARY data integrity', () => {
  it('contains at least 90 entries', () => {
    expect(VOCABULARY.length).toBeGreaterThanOrEqual(90)
  })

  it('all entry IDs are unique', () => {
    const ids = VOCABULARY.map(v => v.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all entries have required text fields', () => {
    for (const entry of VOCABULARY) {
      expect(entry.id,         `id missing on ${entry.german}`).toBeTruthy()
      expect(entry.german,     `german missing on ${entry.id}`).toBeTruthy()
      expect(entry.portuguese, `portuguese missing on ${entry.id}`).toBeTruthy()
      expect(entry.exampleDE,  `exampleDE missing on ${entry.id}`).toBeTruthy()
      expect(entry.examplePT,  `examplePT missing on ${entry.id}`).toBeTruthy()
    }
  })

  it('all entries have a valid theme', () => {
    for (const entry of VOCABULARY) {
      expect(
        VALID_THEMES,
        `invalid theme "${entry.theme}" on ${entry.id}`,
      ).toContain(entry.theme)
    }
  })

  it('all 15 themes have at least one entry', () => {
    const used = new Set(VOCABULARY.map(v => v.theme))
    for (const theme of VALID_THEMES) {
      expect(used, `theme "${theme}" has no entries`).toContain(theme)
    }
  })

  it('all nouns have article and plural', () => {
    for (const noun of VOCABULARY.filter(v => v.type === 'noun')) {
      expect(noun.article, `article missing on noun ${noun.id}`).toBeTruthy()
      expect(noun.plural,  `plural missing on noun ${noun.id}`).toBeTruthy()
    }
  })

  it('noun articles are der | die | das', () => {
    for (const noun of VOCABULARY.filter(v => v.type === 'noun' && v.article)) {
      expect(
        VALID_ARTICLES as readonly string[],
        `invalid article "${noun.article}" on ${noun.id}`,
      ).toContain(noun.article)
    }
  })

  it('noun german field starts with its article', () => {
    for (const noun of VOCABULARY.filter(v => v.type === 'noun' && v.article)) {
      expect(
        noun.german.startsWith(noun.article!),
        `"${noun.german}" should start with "${noun.article}" on ${noun.id}`,
      ).toBe(true)
    }
  })

  it('fillBlank sentences contain exactly one ___ placeholder', () => {
    for (const entry of VOCABULARY.filter(v => v.fillBlank)) {
      const count = (entry.fillBlank!.sentence.match(/___/g) ?? []).length
      expect(count, `${entry.id}: fillBlank.sentence needs exactly one ___`).toBe(1)
    }
  })

  it('fillBlank answers are non-empty', () => {
    for (const entry of VOCABULARY.filter(v => v.fillBlank)) {
      expect(
        entry.fillBlank!.answer.trim(),
        `${entry.id}: fillBlank.answer is empty`,
      ).toBeTruthy()
    }
  })

  it('preposition field is non-empty when present', () => {
    for (const entry of VOCABULARY.filter(v => v.preposition)) {
      expect(entry.preposition!.trim(), `${entry.id}: preposition is blank`).toBeTruthy()
    }
  })

  it('entry types are valid WordType values', () => {
    const valid = ['verb', 'noun', 'adjective', 'phrase', 'expression']
    for (const entry of VOCABULARY) {
      expect(valid, `invalid type "${entry.type}" on ${entry.id}`).toContain(entry.type)
    }
  })
})
