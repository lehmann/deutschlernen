import { useState } from 'react'
import type { ReviewCard } from '../types'

const CARD_TYPE_LABEL: Record<string, string> = {
  pt_to_de: '🇧🇷 → 🇩🇪',
  de_to_pt: '🇩🇪 → 🇧🇷',
  fill_blank: 'Complete',
  article_recall: 'Artigo',
  preposition: 'Preposição',
}

interface Props {
  card: ReviewCard
  onReveal: () => void
  revealed: boolean
}

export function FlashCard({ card, onReveal, revealed }: Props) {
  const [flipped, setFlipped] = useState(false)

  function handleFlip() {
    if (!revealed) {
      setFlipped(true)
      onReveal()
    }
  }

  // Reset flip when card changes
  if (!revealed && flipped) setFlipped(false)

  return (
    <div className="w-full max-w-lg mx-auto select-none" style={{ perspective: '1000px' }}>
      <div
        className="relative w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '260px',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col rounded-2xl bg-white shadow-lg border border-slate-200 p-6 cursor-pointer"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={handleFlip}
        >
          <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-4">
            {CARD_TYPE_LABEL[card.type] ?? card.type}
          </span>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-center text-slate-800 text-xl font-medium whitespace-pre-line leading-relaxed">
              {card.front}
            </p>
          </div>
          {card.hint && (
            <p className="mt-4 text-center text-sm text-slate-400">
              Dica: {card.hint}
            </p>
          )}
          <p className="mt-4 text-center text-xs text-slate-300">Toque para revelar</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col rounded-2xl bg-indigo-50 shadow-lg border border-indigo-200 p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-4">
            Resposta
          </span>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-center text-indigo-900 text-xl font-semibold whitespace-pre-line leading-relaxed">
              {card.back}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
