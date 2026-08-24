import { useState, useMemo } from 'react'
import type { Rating, ReviewCard } from '../types'
import { isDue } from '../lib/sm2'
import { FlashCard } from './FlashCard'
import { RatingButtons } from './RatingButtons'
import { useStore, ALL_CARDS } from '../store'
import { reportSession } from '../lib/pushClient'

interface Props {
  onFinish: () => void
}

export function ReviewSession({ onFinish }: Props) {
  const { state, reviewCard, recordSession } = useStore()
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)

  // Build the due queue once per session mount, shuffled so cards from the
  // same vocab entry (PT→DE, DE→PT, fill_blank) don't appear consecutively.
  const queue = useMemo<ReviewCard[]>(() => {
    const due = ALL_CARDS.filter(card => {
      const prog = state.progress[card.id]
      return prog && isDue(prog)
    })
    // Fisher-Yates shuffle
    for (let i = due.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[due[i], due[j]] = [due[j], due[i]]
    }
    return due
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (queue.length === 0 || sessionDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-slate-800">Revisão concluída!</h2>
        <p className="text-slate-500 text-center max-w-xs">
          {queue.length === 0
            ? 'Nenhuma carta para revisar agora. Volte mais tarde!'
            : `Você revisou ${queue.length} ${queue.length === 1 ? 'carta' : 'cartas'} hoje.`}
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
  const progress = Math.round(((index) / queue.length) * 100)

  function completeSession() {
    recordSession()
    const subId = state.notifications.subscriptionId
    if (subId) reportSession(subId)
  }

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
      {/* Progress bar */}
      <div className="w-full max-w-lg mx-auto">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{index + 1} / {queue.length}</span>
          <span>{progress}% concluído</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flash card */}
      <FlashCard card={card} onReveal={() => setRevealed(true)} revealed={revealed} />

      {/* Rating buttons (only after reveal) */}
      {revealed && <RatingButtons onRate={handleRate} />}

      {/* Skip */}
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
