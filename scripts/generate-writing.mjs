#!/usr/bin/env node
/**
 * Generates src/data/writing.ts with DE-PT sentence pairs for translation practice.
 * Groups consecutive aligned pairs into 2-sentence paragraphs, CEFR-classifies
 * by German vocabulary difficulty, outputs 30 entries per level.
 *
 * Usage: node scripts/generate-writing.mjs
 *
 * Sources:
 *   - Tatoeba DE-PT aligned sentences via OPUS (CC-BY 2.0)
 *     https://opus.nlpl.eu/Tatoeba/de&pt/v2026-07-08/Tatoeba
 *   - Frequency list: hermitdave/FrequencyWords (MIT)
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.join(__dirname, '..', 'src', 'data', 'writing.ts')

const RANK_THRESHOLD = { A2: 1500, B1: 4000, B2: 8000 }
const GROUP_SIZE = 2   // sentences grouped into one exercise
// No hard limit — include all qualifying candidate groups

const STOPWORDS = new Set([
  'der', 'die', 'das', 'ein', 'eine', 'einen', 'einem', 'eines',
  'und', 'oder', 'aber', 'nicht', 'ist', 'sind', 'hat', 'haben',
  'ich', 'du', 'er', 'sie', 'wir', 'ihr', 'es', 'man', 'sich',
  'in', 'an', 'auf', 'für', 'mit', 'von', 'zu', 'bei', 'nach',
  'aus', 'über', 'auch', 'noch', 'nur', 'so', 'wie', 'als', 'dass',
  'wenn', 'ob', 'weil', 'da', 'um', 'bis', 'seit', 'ab', 'am',
  'im', 'zum', 'zur', 'des', 'dem', 'den', 'mein', 'meine', 'dein',
  'sein', 'unser', 'kein', 'keine', 'wird', 'wurde', 'war',
  'kann', 'muss', 'will', 'soll', 'darf', 'mehr', 'sehr', 'gut',
])

// ─── Frequency map ─────────────────────────────────────────────────────────────

async function loadFrequencyMap() {
  console.log('Fetching German word frequency list...')
  const url = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/de/de_50k.txt'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  const text = await res.text()
  const map = new Map()
  for (const [rank, line] of text.split('\n').entries()) {
    const word = line.trim().split(' ')[0]
    if (word) map.set(word.toLowerCase(), rank + 1)
  }
  console.log(`  ${map.size} words loaded`)
  return map
}

// ─── Corpus download ───────────────────────────────────────────────────────────

function downloadPairs() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'writing-'))
  try {
    const url = 'https://object.pouta.csc.fi/OPUS-Tatoeba/v2026-07-08/moses/de-pt.txt.zip'
    const zipPath = path.join(tmpDir, 'corpus.zip')
    console.log('Downloading Tatoeba DE-PT aligned corpus...')
    execSync(`curl -s -L -o "${zipPath}" "${url}"`, { maxBuffer: 50 * 1024 * 1024 })
    execSync(`unzip -q "${zipPath}" -d "${tmpDir}"`)

    const files = fs.readdirSync(tmpDir).filter(f => f !== 'corpus.zip')
    const deFile = files.find(f => f.endsWith('.de'))
    const ptFile = files.find(f => f.endsWith('.pt'))
    if (!deFile || !ptFile) {
      throw new Error(`Expected .de and .pt files in zip, found: ${files.join(', ')}`)
    }

    const deLines = fs.readFileSync(path.join(tmpDir, deFile), 'utf-8').split('\n')
    const ptLines = fs.readFileSync(path.join(tmpDir, ptFile), 'utf-8').split('\n')
    console.log(`  ${deLines.length} aligned sentence pairs`)
    return { deLines, ptLines }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

// ─── CEFR classification ──────────────────────────────────────────────────────

function scoreSentence(text, freqMap) {
  const tokens = text
    .toLowerCase()
    .replace(/[.,!?;:"'()\-«»„"]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
  if (tokens.length === 0) return Infinity
  const ranks = tokens.map(w => freqMap.get(w) ?? 50000)
  ranks.sort((a, b) => a - b)
  return ranks[Math.floor(ranks.length * 0.75)]
}

function classifyLevel(score) {
  if (score <= RANK_THRESHOLD.A2) return 'A2'
  if (score <= RANK_THRESHOLD.B1) return 'B1'
  if (score <= RANK_THRESHOLD.B2) return 'B2'
  return null
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const freqMap = await loadFrequencyMap()
  const { deLines, ptLines } = downloadPairs()

  const pairs = []
  for (let i = 0; i < Math.min(deLines.length, ptLines.length); i++) {
    const de = deLines[i].trim()
    const pt = ptLines[i].trim()
    if (de && pt && de.length > 8 && pt.length > 8) pairs.push({ de, pt, idx: i })
  }
  console.log(`${pairs.length} valid pairs`)

  // Build candidate groups: each group = GROUP_SIZE consecutive pairs
  console.log('Building & classifying groups...')
  const candidates = { A2: [], B1: [], B2: [] }
  for (let i = 0; i + GROUP_SIZE <= pairs.length; i += GROUP_SIZE) {
    const group = pairs.slice(i, i + GROUP_SIZE)
    const de = group.map(p => p.de).join(' ')
    const pt = group.map(p => p.pt).join(' ')
    const score = scoreSentence(de, freqMap)
    const level = classifyLevel(score)
    if (level) candidates[level].push({ de, pt, score, firstIdx: group[0].idx })
  }

  for (const [level, list] of Object.entries(candidates)) {
    console.log(`  ${level}: ${list.length} candidates`)
  }

  // Sort all candidates by DE word count descending (longer texts first within level)
  const buckets = {}
  for (const [level, list] of Object.entries(candidates)) {
    list.sort((a, b) => b.de.split(/\s+/).length - a.de.split(/\s+/).length)
    buckets[level] = list.map(e => ({
      id: `${level.toLowerCase()}_w${String(e.firstIdx).padStart(5, '0')}`,
      de: e.de,
      pt: e.pt,
      level,
    }))
  }

  console.log('\nResults:')
  for (const [level, entries] of Object.entries(buckets)) {
    console.log(`  ${level}: ${entries.length} entries`)
  }

  const ts = `// Auto-generated by scripts/generate-writing.mjs — do not edit manually.
// Source: Tatoeba DE-PT via OPUS (CC-BY 2.0) — opus.nlpl.eu
// Run: node scripts/generate-writing.mjs

import type { CefrLevel } from '../types'

export interface WritingEntry {
  id: string
  de: string       // expected German text (used for scoring)
  pt: string       // Portuguese paragraph shown to user
  level: CefrLevel
}

export const WRITING_DATA: Record<string, WritingEntry[]> = ${JSON.stringify(buckets, null, 2)}
`
  fs.writeFileSync(OUT_PATH, ts, 'utf-8')
  console.log(`\nWritten to ${OUT_PATH}`)
}

main().catch(err => { console.error(err); process.exit(1) })
