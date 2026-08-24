import type { VocabEntry, ReviewCard } from '../types'

// Generate multiple review card types from a single vocab entry.
// This implements the PDF strategy (section 04): one word → many card types.
export function generateCards(entry: VocabEntry): ReviewCard[] {
  const cards: ReviewCard[] = []

  // 1. Portuguese → German sentence
  cards.push({
    id: `${entry.id}:pt_to_de`,
    vocabId: entry.id,
    type: 'pt_to_de',
    front: `Como se diz em alemão:\n"${entry.examplePT}"`,
    back: entry.exampleDE,
    hint: entry.portuguese,
  })

  // 2. German → Portuguese meaning
  cards.push({
    id: `${entry.id}:de_to_pt`,
    vocabId: entry.id,
    type: 'de_to_pt',
    front: `O que significa:\n"${entry.exampleDE}"`,
    back: entry.examplePT,
    hint: entry.german,
  })

  // 3. Fill in the blank (when available)
  if (entry.fillBlank) {
    cards.push({
      id: `${entry.id}:fill_blank`,
      vocabId: entry.id,
      type: 'fill_blank',
      front: `Complete a frase:\n"${entry.fillBlank.sentence}"`,
      back: entry.fillBlank.sentence.replace('___', `[${entry.fillBlank.answer}]`),
      hint: entry.german,
    })
  }

  // 4. Article recall (for nouns)
  if (entry.article && entry.plural) {
    cards.push({
      id: `${entry.id}:article`,
      vocabId: entry.id,
      type: 'article_recall',
      front: `Qual é o artigo e o plural de:\n"${entry.german.replace(/^(der|die|das) /, '')}"`,
      back: `${entry.article} ${entry.german.replace(/^(der|die|das) /, '')} → ${entry.plural}`,
      hint: entry.portuguese,
    })
  }

  // 5. Preposition recall (for verbs/adjectives with required preposition)
  if (entry.preposition) {
    const baseWord = entry.german.replace(/ (auf|an|für|mit|über|von|zu|in|bei|nach|aus)$/, '')
    cards.push({
      id: `${entry.id}:preposition`,
      vocabId: entry.id,
      type: 'preposition',
      front: `Qual preposição acompanha:\n"${baseWord}"?\n(${entry.portuguese})`,
      back: `${entry.german}\nEx: ${entry.exampleDE}`,
      hint: `Dica: começa com "${entry.preposition[0]}"`,
    })
  }

  return cards
}
