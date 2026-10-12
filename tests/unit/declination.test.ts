import { describe, it, expect } from 'vitest'
import { DECLINATION_DATA, ENDING_TABLES } from '../../src/data/declination'
import type { DeclinationTable } from '../../src/data/declination'

const TABLES: DeclinationTable[] = [
  'artigo-definido', 'artigo-indefinido', 'adjetivo-forte', 'adjetivo-fraco', 'adjetivo-misto',
]

describe('DECLINATION_DATA integrity', () => {
  it('contains at least 180 sentences', () => {
    expect(DECLINATION_DATA.length).toBeGreaterThanOrEqual(180)
  })

  it('all entry IDs are unique', () => {
    const ids = DECLINATION_DATA.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each sentence has exactly one _BLANK_ placeholder', () => {
    for (const e of DECLINATION_DATA) {
      expect(e.sentence.split('_BLANK_').length - 1, e.id).toBe(1)
    }
  })

  it('ending matches the declension table for its case, gender and number', () => {
    for (const e of DECLINATION_DATA) {
      const column = e.number === 'pl' ? 'pl' : e.gender
      expect(ENDING_TABLES[e.table][e.case][column], e.id).toBe(e.ending)
    }
  })

  it('filling the blank yields a sentence without placeholders', () => {
    for (const e of DECLINATION_DATA) {
      expect(e.sentence.replace('_BLANK_', e.ending), e.id).not.toContain('_BLANK_')
    }
  })

  it('article tables put the d-/ein-/kein- stem right before the blank', () => {
    for (const e of DECLINATION_DATA.filter(x => x.table.startsWith('artigo'))) {
      const stem = e.sentence.split('_BLANK_')[0]
      expect(stem, e.id).toMatch(/(^|\s)(d|ein|kein)$/i)
    }
  })

  it('adjective tables have a non-empty stem before the blank', () => {
    for (const e of DECLINATION_DATA.filter(x => x.table.startsWith('adjetivo'))) {
      const stem = e.sentence.split('_BLANK_')[0]
      expect(stem.trim().split(/\s+/).pop(), e.id).toMatch(/[a-zäöüß]$/i)
    }
  })

  it('zero endings only occur in singular forms without a plural', () => {
    for (const e of DECLINATION_DATA.filter(x => x.ending === '')) {
      expect(e.number, e.id).toBe('sg')
    }
  })

  it('all entries have a Portuguese translation', () => {
    for (const e of DECLINATION_DATA) {
      expect(e.translation, e.id).toBeTruthy()
    }
  })

  it('every table covers all four cases', () => {
    for (const table of TABLES) {
      const cases = new Set(DECLINATION_DATA.filter(e => e.table === table).map(e => e.case))
      expect(cases.size, table).toBe(4)
    }
  })
})
