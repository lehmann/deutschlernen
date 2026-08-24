import type { CardProgress } from '../types'

const INITIAL_EASINESS = 2.5
const MIN_EASINESS = 1.3

export function createProgress(cardId: string): CardProgress {
  return {
    cardId,
    easiness: INITIAL_EASINESS,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
    lastReview: new Date().toISOString(),
  }
}

// SM-2 algorithm: quality 0-5
export function calculateNextReview(
  progress: CardProgress,
  quality: number,
): CardProgress {
  const { easiness, interval, repetitions } = progress

  let newRepetitions: number
  let newInterval: number

  if (quality < 3) {
    // Incorrect — restart
    newRepetitions = 0
    newInterval = 1
  } else {
    newRepetitions = repetitions + 1
    if (newRepetitions === 1) {
      newInterval = 1
    } else if (newRepetitions === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * easiness)
    }
  }

  const newEasiness = Math.max(
    MIN_EASINESS,
    easiness + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
  )

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)

  return {
    cardId: progress.cardId,
    easiness: newEasiness,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview: nextReview.toISOString(),
    lastReview: new Date().toISOString(),
  }
}

export function isDue(progress: CardProgress): boolean {
  return new Date(progress.nextReview) <= new Date()
}

export function isNew(progress: CardProgress): boolean {
  return progress.repetitions === 0 && progress.interval === 0
}
