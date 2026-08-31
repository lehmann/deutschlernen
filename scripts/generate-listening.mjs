#!/usr/bin/env node
/**
 * Generates src/data/listening.ts with German sentences from Tatoeba,
 * classified by CEFR level using a German word frequency list.
 *
 * Usage: node scripts/generate-listening.mjs
 *
 * Sources:
 *   - Sentences + audio: Tatoeba bulk TSV exports (CC-BY) — https://tatoeba.org
 *   - Frequency list:    hermitdave/FrequencyWords (MIT)   — github.com/hermitdave/FrequencyWords
 *
 * Requires: curl and bunzip2 (available on macOS and Linux by default)
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_PATH = path.join(__dirname, '..', 'src', 'data', 'listening.ts')

// Vocabulary rank thresholds per CEFR level
const RANK_THRESHOLD = { A2: 1500, B1: 4000, B2: 8000 }
// Sentence length limits (words) per level
const MAX_WORDS = { A2: 10, B1: 16, B2: 24 }
const MIN_WORDS = 4
// No hard limit — include all qualifying sentences with audio

// Function words excluded from difficulty scoring
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

// ─── Data loading ─────────────────────────────────────────────────────────────

function fetchBzip2(url, maxMB = 200) {
  return execSync(`curl -s "${url}" | bunzip2`, {
    maxBuffer: maxMB * 1024 * 1024,
  }).toString('utf-8')
}

// For .tar.bz2 files (e.g. Tatoeba links.tar.bz2): extracts the first file to stdout.
function fetchTarBzip2(url, maxMB = 500) {
  return execSync(`curl -s "${url}" | tar -xjO`, {
    maxBuffer: maxMB * 1024 * 1024,
  }).toString('utf-8')
}

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

function loadGermanSentences() {
  console.log('Downloading German sentences (Tatoeba bulk export)...')
  const url = 'https://downloads.tatoeba.org/exports/per_language/deu/deu_sentences.tsv.bz2'
  const raw = fetchBzip2(url)
  // Format: sentence_id \t lang \t text
  const map = new Map()
  for (const line of raw.split('\n')) {
    const tab1 = line.indexOf('\t')
    const tab2 = line.indexOf('\t', tab1 + 1)
    if (tab1 === -1 || tab2 === -1) continue
    const id = parseInt(line.slice(0, tab1))
    const text = line.slice(tab2 + 1).trim()
    if (id && text) map.set(id, text)
  }
  console.log(`  ${map.size} sentences loaded`)
  return map
}

function loadPortugueseSentences() {
  console.log('Downloading Portuguese sentences (Tatoeba bulk export)...')
  const url = 'https://downloads.tatoeba.org/exports/per_language/por/por_sentences.tsv.bz2'
  const raw = fetchBzip2(url)
  // Format: sentence_id \t lang \t text
  const map = new Map()
  for (const line of raw.split('\n')) {
    const tab1 = line.indexOf('\t')
    const tab2 = line.indexOf('\t', tab1 + 1)
    if (tab1 === -1 || tab2 === -1) continue
    const id = parseInt(line.slice(0, tab1))
    const text = line.slice(tab2 + 1).trim()
    if (id && text) map.set(id, text)
  }
  console.log(`  ${map.size} sentences loaded`)
  return map
}

// Reads the full Tatoeba links file and returns a map of germanSentenceId → first Portuguese text found.
// The links file covers all language pairs; filtering by germanIds avoids keeping the whole table in memory.
function loadTranslationLinks(germanIds, ptSentences) {
  console.log('Downloading Tatoeba translation links...')
  // links.tar.bz2 is a tar archive (not a plain .bz2) — requires tar -xjO to extract
  const url = 'https://downloads.tatoeba.org/exports/links.tar.bz2'
  const raw = fetchTarBzip2(url) // uncompressed can reach ~300 MB
  // Format: source_sentence_id \t translation_sentence_id
  const map = new Map() // germanSentenceId → Portuguese text
  for (const line of raw.split('\n')) {
    const tab = line.indexOf('\t')
    if (tab === -1) continue
    const srcId = parseInt(line.slice(0, tab))
    if (!germanIds.has(srcId)) continue
    const tgtId = parseInt(line.slice(tab + 1))
    const pt = ptSentences.get(tgtId)
    if (pt && !map.has(srcId)) map.set(srcId, pt)
  }
  console.log(`  ${map.size} German sentences with Portuguese translation`)
  return map
}

function loadAudioIndex() {
  console.log('Downloading German audio index (Tatoeba bulk export)...')
  const url = 'https://downloads.tatoeba.org/exports/per_language/deu/deu_sentences_with_audio.tsv.bz2'
  const raw = fetchBzip2(url, 10)
  // Format: sentence_id \t audio_id \t username \t license \t attribution_url
  // The download URL https://tatoeba.org/en/audio/download/{audio_id} uses audio_id (col2).
  const map = new Map() // sentence_id → audio_id (first audio per sentence wins)
  for (const line of raw.split('\n')) {
    const parts = line.split('\t')
    if (parts.length < 2) continue
    const sentenceId = parseInt(parts[0]) // col1 = sentence_id
    const audioId = parseInt(parts[1])    // col2 = audio_id
    if (!isNaN(sentenceId) && !isNaN(audioId) && sentenceId > 0 && audioId > 0) {
      if (!map.has(sentenceId)) map.set(sentenceId, audioId)
    }
  }
  console.log(`  ${map.size} sentences with audio`)
  return map
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
  // 75th-percentile rank — harder words dominate the score
  return ranks[Math.floor(ranks.length * 0.75)]
}

function classifyLevel(text, score) {
  const wordCount = text.trim().split(/\s+/).length
  if (wordCount < MIN_WORDS) return null
  if (score <= RANK_THRESHOLD.A2 && wordCount <= MAX_WORDS.A2) return 'A2'
  if (score <= RANK_THRESHOLD.B1 && wordCount <= MAX_WORDS.B1) return 'B1'
  if (score <= RANK_THRESHOLD.B2 && wordCount <= MAX_WORDS.B2) return 'B2'
  return null
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const freqMap = await loadFrequencyMap()
  const sentences = loadGermanSentences()
  const audioIndex = loadAudioIndex()

  // First pass: classify all qualifying sentences, keeping sentenceId for translation lookup
  console.log('Classifying sentences...')
  const qualifying = []
  let processed = 0
  for (const [sentenceId, audioId] of audioIndex) {
    const text = sentences.get(sentenceId)
    if (!text) continue
    const score = scoreSentence(text, freqMap)
    const level = classifyLevel(text, score)
    if (level) qualifying.push({ sentenceId, id: `${level.toLowerCase()}_t${sentenceId}`, text, audioId, level })
    processed++
    if (processed % 1000 === 0) {
      process.stdout.write(`\r  ${processed}/${audioIndex.size} — qualifying: ${qualifying.length}`)
    }
  }
  console.log(`\n  ${qualifying.length} qualifying sentences total`)

  // Load Portuguese translations for the qualifying German sentences
  const ptSentences = loadPortugueseSentences()
  const qualifiedIds = new Set(qualifying.map(e => e.sentenceId))
  const ptMap = loadTranslationLinks(qualifiedIds, ptSentences)

  // Build final buckets, attaching Portuguese translation where available
  const buckets = { A2: [], B1: [], B2: [] }
  for (const { sentenceId, id, text, audioId, level } of qualifying) {
    const pt = ptMap.get(sentenceId)
    buckets[level].push({ id, text, audioId, ...(pt && { pt }) })
  }

  console.log('\nResults:')
  for (const [level, entries] of Object.entries(buckets)) {
    const withPt = entries.filter(e => e.pt).length
    console.log(`  ${level}: ${entries.length} sentences (${withPt} with PT translation)`)
  }

  const ts = `// Auto-generated by scripts/generate-listening.mjs — do not edit manually.
// Run: node scripts/generate-listening.mjs

export interface ListeningEntry {
  id: string
  text: string
  audioId?: number
  pt?: string
}

export const LISTENING_DATA: Record<string, ListeningEntry[]> = ${JSON.stringify(buckets, null, 2)}
`
  fs.writeFileSync(OUT_PATH, ts, 'utf-8')
  console.log(`\nWritten to ${OUT_PATH}`)
}

main().catch(err => { console.error(err); process.exit(1) })
