import { describe, it, expect } from 'vitest'
import {
  THRESHOLD, COST,
  tokenize, normalizeSpecial, levenshtein, classifyPair, checkAnswer,
} from '../../src/lib/dictation'

// ── THRESHOLD ──────────────────────────────────────────────────────────────────

describe('THRESHOLD', () => {
  it('has correct values for each level', () => {
    expect(THRESHOLD.A2).toBe(0.80)
    expect(THRESHOLD.B1).toBe(0.90)
    expect(THRESHOLD.B2).toBe(0.95)
  })
})

// ── tokenize ──────────────────────────────────────────────────────────────────

describe('tokenize', () => {
  it('lowercases and splits on whitespace', () => {
    expect(tokenize('Hallo Welt')).toEqual(['hallo', 'welt'])
  })

  it('strips leading and trailing punctuation', () => {
    expect(tokenize('Guten Morgen!')).toEqual(['guten', 'morgen'])
    expect(tokenize('"Bitte."')).toEqual(['bitte'])
  })

  it('filters empty tokens', () => {
    expect(tokenize('  ')).toEqual([])
    expect(tokenize('')).toEqual([])
  })

  it('handles internal punctuation (hyphens stay as they are within word)', () => {
    // hyphen is not \p{L}, so it's stripped at edges; internal hyphens remain
    const result = tokenize('gut-gemeint')
    expect(result).toEqual(['gut-gemeint'])
  })

  it('handles German special characters', () => {
    expect(tokenize('Straße Öl über')).toEqual(['straße', 'öl', 'über'])
  })
})

// ── normalizeSpecial ──────────────────────────────────────────────────────────

describe('normalizeSpecial', () => {
  it('maps umlauts to base vowels', () => {
    expect(normalizeSpecial('ä')).toBe('a')
    expect(normalizeSpecial('Ä')).toBe('a')
    expect(normalizeSpecial('ö')).toBe('o')
    expect(normalizeSpecial('Ö')).toBe('o')
    expect(normalizeSpecial('ü')).toBe('u')
    expect(normalizeSpecial('Ü')).toBe('u')
  })

  it('maps ß to ss', () => {
    expect(normalizeSpecial('straße')).toBe('strasse')
    expect(normalizeSpecial('Fuß')).toBe('Fuss')
  })

  it('leaves non-special characters unchanged', () => {
    expect(normalizeSpecial('hallo')).toBe('hallo')
  })
})

// ── levenshtein ───────────────────────────────────────────────────────────────

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('abc', 'abc')).toBe(0)
  })

  it('returns string length for empty other string', () => {
    expect(levenshtein('abc', '')).toBe(3)
    expect(levenshtein('', 'abc')).toBe(3)
  })

  it('counts single substitution', () => {
    expect(levenshtein('cat', 'bat')).toBe(1)
  })

  it('counts single insertion', () => {
    expect(levenshtein('ab', 'abc')).toBe(1)
  })

  it('counts single deletion', () => {
    expect(levenshtein('abc', 'ab')).toBe(1)
  })

  it('handles typical German typo (missing umlaut dot)', () => {
    // "mochte" vs "möchte" — one substitution
    expect(levenshtein('mochte', 'möchte')).toBe(1)
  })
})

// ── classifyPair ──────────────────────────────────────────────────────────────

describe('classifyPair', () => {
  it('ok — exact match', () => {
    const r = classifyPair('hallo', 'hallo')
    expect(r).toEqual({ cost: COST.ok, type: 'ok' })
  })

  it('light — special char omission (ü → u)', () => {
    const r = classifyPair('über', 'uber')
    expect(r).toEqual({ cost: COST.light, type: 'light' })
  })

  it('light — ß typed as ss', () => {
    const r = classifyPair('straße', 'strasse')
    expect(r).toEqual({ cost: COST.light, type: 'light' })
  })

  it('medium — levenshtein ≤ 2 (one char off)', () => {
    const r = classifyPair('macht', 'machi')
    expect(r).toEqual({ cost: COST.medium, type: 'medium' })
  })

  it('medium — levenshtein exactly 2', () => {
    const r = classifyPair('katze', 'katzo')
    // 1 substitution = medium
    expect(r.type).toBe('medium')
  })

  it('grave — completely different word', () => {
    const r = classifyPair('hund', 'katze')
    expect(r).toEqual({ cost: COST.grave, type: 'grave' })
  })

  it('grave — levenshtein > 2', () => {
    const r = classifyPair('schmetterling', 'xyz')
    expect(r).toEqual({ cost: COST.grave, type: 'grave' })
  })
})

// ── checkAnswer ───────────────────────────────────────────────────────────────

describe('checkAnswer', () => {
  it('perfect match → accuracy 1, passed true', () => {
    const r = checkAnswer('Ich bin hier', 'Ich bin hier', 'A2')
    expect(r.accuracy).toBe(1)
    expect(r.passed).toBe(true)
    expect(r.words.every(w => w.type === 'ok')).toBe(true)
  })

  it('empty expected text → accuracy 1, no words', () => {
    const r = checkAnswer('', 'anything', 'A2')
    expect(r.accuracy).toBe(1)
    expect(r.passed).toBe(true)
    expect(r.words).toEqual([])
  })

  it('completely wrong answer → accuracy 0, not passed', () => {
    // 3-word expected, 3 grave errors = cost 30 / (3×10) = 1 → accuracy 0
    const r = checkAnswer('eins zwei drei', 'aaa bbb ccc', 'B2')
    expect(r.accuracy).toBe(0)
    expect(r.passed).toBe(false)
  })

  it('missing all words → accuracy 0', () => {
    const r = checkAnswer('eins zwei drei', '', 'A2')
    expect(r.accuracy).toBe(0)
    expect(r.passed).toBe(false)
  })

  it('extra typed words are free (ins cost = 0)', () => {
    // expected = "hallo", typed = "hallo welt extra"
    // extra words cost 0, so accuracy stays 1
    const r = checkAnswer('hallo', 'hallo welt extra', 'A2')
    expect(r.accuracy).toBe(1)
    expect(r.passed).toBe(true)
  })

  it('special char omission counts as light error (cost 1)', () => {
    // "über" typed as "uber": 1 word, cost 1, accuracy = 1 - 1/10 = 0.9
    const r = checkAnswer('über', 'uber', 'A2')
    expect(r.accuracy).toBeCloseTo(0.9)
    expect(r.passed).toBe(true) // 0.9 >= 0.80
  })

  it('passes A2 at exactly 80%', () => {
    // Need accuracy >= 0.80.
    // 5 words, 1 grave error (cost 10) → cost 10 / (5×10) = 0.2 → accuracy 0.8
    const r = checkAnswer('eins zwei drei vier funf', 'eins zwei drei vier xxxxx', 'A2')
    expect(r.accuracy).toBeCloseTo(0.8)
    expect(r.passed).toBe(true)
  })

  it('fails A2 below 80%', () => {
    // 5 words, 2 grave errors → cost 20/50 = 0.4 → accuracy 0.6
    const r = checkAnswer('eins zwei drei vier funf', 'eins zwei xxx xxx funf', 'A2')
    expect(r.accuracy).toBeCloseTo(0.6)
    expect(r.passed).toBe(false)
  })

  it('passes B1 at exactly 90%', () => {
    // 10 words, 1 grave error → cost 10/100 = 0.1 → accuracy 0.9
    const expected = 'eins zwei drei vier funf sechs sieben acht neun zehn'
    const typed    = 'eins zwei drei vier funf sechs sieben acht neun xxxxx'
    const r = checkAnswer(expected, typed, 'B1')
    expect(r.accuracy).toBeCloseTo(0.9)
    expect(r.passed).toBe(true)
  })

  it('fails B2 at 90% (needs 95%)', () => {
    // 10 words, 1 grave error → accuracy 0.9
    const expected = 'eins zwei drei vier funf sechs sieben acht neun zehn'
    const typed    = 'eins zwei drei vier funf sechs sieben acht neun xxxxx'
    const r = checkAnswer(expected, typed, 'B2')
    expect(r.accuracy).toBeCloseTo(0.9)
    expect(r.passed).toBe(false)
  })

  it('word results include expected and typed tokens', () => {
    const r = checkAnswer('hallo welt', 'hallo erde', 'A2')
    expect(r.words).toHaveLength(2)
    expect(r.words[0]).toMatchObject({ expected: 'hallo', type: 'ok' })
    expect(r.words[1]).toMatchObject({ expected: 'welt', type: 'grave' })
  })

  it('missing word produces null typed in word result', () => {
    const r = checkAnswer('eins zwei', 'eins', 'A2')
    const missing = r.words.find(w => w.expected === 'zwei')
    expect(missing).toBeDefined()
    expect(missing!.typed).toBeNull()
    expect(missing!.type).toBe('grave')
  })

  it('punctuation stripped before comparison', () => {
    const r = checkAnswer('Hallo, Welt!', 'hallo welt', 'A2')
    expect(r.accuracy).toBe(1)
  })
})
