import type { CefrLevel } from '../types'

export const THRESHOLD: Record<CefrLevel, number> = { A2: 0.80, B1: 0.90, B2: 0.95 }

// Integer costs avoid float DP comparisons
export const COST = { ok: 0, light: 1, medium: 5, grave: 10, del: 10, ins: 0 } as const

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''))
    .filter(w => w.length > 0)
}

export function normalizeSpecial(w: string): string {
  return w
    .replace(/[äÄ]/g, 'a').replace(/[öÖ]/g, 'o').replace(/[üÜ]/g, 'u')
    .replace(/ß/g, 'ss')
}

export function levenshtein(a: string, b: string): number {
  const n = b.length
  const row: number[] = Array.from({ length: n + 1 }, (_, k) => k)
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]
    row[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = row[j]
      row[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, row[j], row[j - 1])
      prev = tmp
    }
  }
  return row[n]
}

export type ErrorType = 'ok' | 'light' | 'medium' | 'grave'

export interface WordResult {
  expected: string
  typed: string | null
  cost: number
  type: ErrorType
}

export interface CheckResult {
  accuracy: number
  passed: boolean
  words: WordResult[]
}

export function classifyPair(e: string, t: string): { cost: number; type: ErrorType } {
  if (e === t) return { cost: COST.ok, type: 'ok' }
  if (normalizeSpecial(e) === normalizeSpecial(t)) return { cost: COST.light, type: 'light' }
  if (levenshtein(e, t) <= 2) return { cost: COST.medium, type: 'medium' }
  return { cost: COST.grave, type: 'grave' }
}

export function checkAnswer(expectedText: string, typedText: string, level: CefrLevel): CheckResult {
  const expected = tokenize(expectedText)
  const typed = tokenize(typedText)
  const m = expected.length, n = typed.length
  if (m === 0) return { accuracy: 1, passed: true, words: [] }

  // dp[i][j] = min cost to align expected[0..i-1] with typed[0..j-1]
  // deletion (missing expected word) = COST.del; insertion (extra typed word) = COST.ins = 0
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) dp[i][0] = i * COST.del

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + classifyPair(expected[i - 1], typed[j - 1]).cost,
        dp[i - 1][j] + COST.del,
        dp[i][j - 1] + COST.ins,
      )
    }
  }

  // Backtrack: prefer substitution > insertion > deletion
  const words: WordResult[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const pair = classifyPair(expected[i - 1], typed[j - 1])
      if (dp[i][j] === dp[i - 1][j - 1] + pair.cost) {
        words.unshift({ expected: expected[i - 1], typed: typed[j - 1], ...pair })
        i--; j--; continue
      }
    }
    if (j > 0 && dp[i][j] === dp[i][j - 1] + COST.ins) {
      j--
    } else {
      words.unshift({ expected: expected[i - 1], typed: null, cost: COST.del, type: 'grave' })
      i--
    }
  }

  const totalCost = words.reduce((s, w) => s + w.cost, 0)
  const accuracy = Math.max(0, 1 - totalCost / (m * COST.grave))
  return { accuracy, passed: accuracy >= THRESHOLD[level], words }
}
