import { useState, useMemo } from 'react'
import type { AppState, Rating, ReviewCard } from '../types'
import { isDue, isNew } from '../lib/sm2'
import { FlashCard } from './FlashCard'
import { RatingButtons } from './RatingButtons'
import { useStore, ALL_CARDS } from '../store'
import { VOCABULARY } from '../data/vocabulary'
import { reportSession } from '../lib/pushClient'

interface Props {
  onFinish: () => void
}

const SESSION_SIZE = 30
// Max new (never-reviewed) cards per session; rest of the slots go to reviews.
const MAX_NEW_PER_SESSION = 10

const VOCAB_LEVEL_MAP = Object.fromEntries(
  VOCABULARY.map(v => [v.id, v.level ?? ('A2' as const)])
)

const LEVEL_STYLE: Record<string, string> = {
  A2: 'bg-emerald-100 text-emerald-700',
  B1: 'bg-blue-100 text-blue-700',
  B2: 'bg-violet-100 text-violet-700',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQueue(state: AppState): { cards: ReviewCard[]; isReinforcement: boolean } {
  const reviewDue: ReviewCard[] = []
  const newDue: ReviewCard[] = []

  for (const card of ALL_CARDS) {
    const prog = state.progress[card.id]
    if (!prog || !isDue(prog)) continue
    if (isNew(prog)) newDue.push(card)
    else reviewDue.push(card)
  }

  if (reviewDue.length === 0 && newDue.length === 0) {
    // No due cards — reinforcement from all active, oldest first then shuffled
    const all = ALL_CARDS.filter(c => state.progress[c.id])
    return { cards: shuffle(all).slice(0, SESSION_SIZE), isReinforcement: true }
  }

  const shuffledReview = shuffle(reviewDue)
  const cappedNew = shuffle(newDue).slice(0, MAX_NEW_PER_SESSION)
  const reviewSlots = Math.min(shuffledReview.length, SESSION_SIZE - cappedNew.length)
  const selectedReview = shuffledReview.slice(0, reviewSlots)

  // Interleave: one new card roughly every 3 reviews so new cards aren't all upfront
  const combined: ReviewCard[] = []
  let ri = 0
  let ni = 0
  while (ri < selectedReview.length || ni < cappedNew.length) {
    for (let k = 0; k < 3 && ri < selectedReview.length; k++, ri++) {
      combined.push(selectedReview[ri])
    }
    if (ni < cappedNew.length) combined.push(cappedNew[ni++])
  }

  return { cards: combined.slice(0, SESSION_SIZE), isReinforcement: false }
}

export function ReviewSession({ onFinish }: Props) {
  const { state, reviewCard, recordSession } = useStore()
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)

  // Build stable queue once using state snapshot at mount; queue must not change mid-session.
  const { cards: queue, isReinforcement } = useMemo(
    () => buildQueue(state),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  function completeSession() {
    recordSession()
    const subId = state.notifications.subscriptionId
    if (subId) reportSession(subId)
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="text-5xl">✨</div>
        <p className="text-slate-600 font-semibold">Nenhuma carta disponível.</p>
        <button
          onClick={onFinish}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
        >
          Voltar ao início
        </button>
      </div>
    )
  }

  if (sessionDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-slate-800">Sessão concluída!</h2>
        <p className="text-slate-500 text-center max-w-xs">
          Você revisou {queue.length} {queue.length === 1 ? 'carta' : 'cartas'}.
        </p>
        <button
          onClick={onFinish}
          className="mt-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    )
  }

  const card = queue[index]
  const cardProg = state.progress[card.id]
  const cardLevel = VOCAB_LEVEL_MAP[card.vocabId] ?? 'A2'
  const cardIsNew = cardProg ? isNew(cardProg) : false
  const progress = Math.round((index / queue.length) * 100)

  function handleRate(rating: Rating) {
    reviewCard(card.id, rating)
    if (index + 1 >= queue.length) {
      completeSession()
      setSessionDone(true)
    } else {
      setIndex(i => i + 1)
      setRevealed(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      {isReinforcement && (
        <p className="text-center text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-lg mx-auto w-full">
          Reforço — nenhuma carta vencida. Revisando vocabulário ativo.
        </p>
      )}

      {/* Progress bar with level badge */}
      <div className="w-full max-w-lg mx-auto">
        <div className="flex justify-between items-center text-xs text-slate-500 mb-1.5">
          <span>{index + 1} / {queue.length}</span>
          <div className="flex items-center gap-1.5">
            {cardIsNew && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                Nova
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${LEVEL_STYLE[cardLevel] ?? LEVEL_STYLE.A2}`}>
              {cardLevel}
            </span>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <FlashCard key={card.id} card={card} onReveal={() => setRevealed(true)} revealed={revealed} />

      {revealed && <RatingButtons onRate={handleRate} />}

      <div className="text-center">
        <button
          onClick={() => {
            if (index > 0) completeSession()
            onFinish()
          }}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Encerrar sessão
        </button>
      </div>
    </div>
  )
}
