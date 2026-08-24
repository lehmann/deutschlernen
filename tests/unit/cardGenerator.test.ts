import { describe, it, expect } from 'vitest'
import { generateCards } from '../../src/lib/cardGenerator'
import type { VocabEntry } from '../../src/types'

const noun: VocabEntry = {
  id: 'n_hund',
  type: 'noun',
  theme: 'familia',
  german: 'der Hund',
  portuguese: 'o cachorro',
  article: 'der',
  plural: 'Hunde',
  exampleDE: 'Der Hund bellt laut.',
  examplePT: 'O cachorro late alto.',
}

const verbWithAll: VocabEntry = {
  id: 'v_warten',
  type: 'verb',
  theme: 'verbos_essenciais',
  german: 'warten auf',
  portuguese: 'esperar por',
  preposition: 'auf',
  exampleDE: 'Ich warte auf den Bus.',
  examplePT: 'Espero o ônibus.',
  fillBlank: { sentence: 'Ich ___ auf den Bus.', answer: 'warte' },
}

const plainVerb: VocabEntry = {
  id: 'v_schlafen',
  type: 'verb',
  theme: 'rotina',
  german: 'schlafen',
  portuguese: 'dormir',
  exampleDE: 'Ich schlafe gut.',
  examplePT: 'Durmo bem.',
}

describe('generateCards', () => {
  it('always generates pt_to_de and de_to_pt', () => {
    for (const entry of [noun, verbWithAll, plainVerb]) {
      const types = generateCards(entry).map(c => c.type)
      expect(types).toContain('pt_to_de')
      expect(types).toContain('de_to_pt')
    }
  })

  it('pt_to_de front uses examplePT, back is exampleDE', () => {
    const cards = generateCards(noun)
    const card = cards.find(c => c.type === 'pt_to_de')!
    expect(card.front).toContain(noun.examplePT)
    expect(card.back).toBe(noun.exampleDE)
  })

  it('de_to_pt front uses exampleDE, back is examplePT', () => {
    const cards = generateCards(noun)
    const card = cards.find(c => c.type === 'de_to_pt')!
    expect(card.front).toContain(noun.exampleDE)
    expect(card.back).toBe(noun.examplePT)
  })

  it('generates fill_blank when fillBlank is present', () => {
    const cards = generateCards(verbWithAll)
    const fb = cards.find(c => c.type === 'fill_blank')!
    expect(fb).toBeTruthy()
    expect(fb.back).toContain('[warte]')
    expect(fb.back).not.toContain('___')
  })

  it('does not generate fill_blank when fillBlank is absent', () => {
    expect(generateCards(plainVerb).find(c => c.type === 'fill_blank')).toBeUndefined()
  })

  it('generates article_recall for nouns with article and plural', () => {
    const ac = generateCards(noun).find(c => c.type === 'article_recall')!
    expect(ac).toBeTruthy()
    expect(ac.back).toContain('der')
    expect(ac.back).toContain('Hunde')
  })

  it('does not generate article_recall for verbs', () => {
    expect(generateCards(verbWithAll).find(c => c.type === 'article_recall')).toBeUndefined()
    expect(generateCards(plainVerb).find(c => c.type === 'article_recall')).toBeUndefined()
  })

  it('generates preposition card when preposition is present', () => {
    const pc = generateCards(verbWithAll).find(c => c.type === 'preposition')!
    expect(pc).toBeTruthy()
    expect(pc.hint).toMatch(/^Dica: começa com "a"/)
    expect(pc.back).toContain('auf')
  })

  it('does not generate preposition card when preposition is absent', () => {
    expect(generateCards(plainVerb).find(c => c.type === 'preposition')).toBeUndefined()
    expect(generateCards(noun).find(c => c.type === 'preposition')).toBeUndefined()
  })

  it('card ids follow the pattern vocabId:type', () => {
    const cards = generateCards(verbWithAll)
    for (const card of cards) {
      expect(card.id).toBe(`${verbWithAll.id}:${card.type}`)
      expect(card.vocabId).toBe(verbWithAll.id)
    }
  })

  it('verb with all features generates 4 cards', () => {
    expect(generateCards(verbWithAll)).toHaveLength(4)
  })

  it('plain verb generates exactly 2 cards', () => {
    expect(generateCards(plainVerb)).toHaveLength(2)
  })

  it('noun with no preposition/fillBlank generates 3 cards', () => {
    expect(generateCards(noun)).toHaveLength(3)
  })
})
