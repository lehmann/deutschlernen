import { useState, useMemo, useRef } from 'react'
import { useStore, ALL_CARDS, VOCAB_THEME_MAP } from '../store'
import { FlashCard } from './FlashCard'
import { THEME_LABELS } from '../types'
import type { Theme } from '../types'

interface Props {
  onFinish: () => void
}

export function FreePractice({ onFinish }: Props) {
  const { state } = useStore()
  const [themeFilter, setThemeFilter] = useState<Theme | 'all'>('all')
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  // Keep deck stable within a filter change
  const deckRef = useRef<typeof ALL_CARDS>([])

  const deck = useMemo(() => {
    const active = ALL_CARDS.filter(c => state.progress[c.id])
    const filtered =
      themeFilter === 'all'
        ? active
        : active.filter(c => VOCAB_THEME_MAP[c.vocabId] === themeFilter)
    // Shuffle once per filter
    deckRef.current = [...filtered].sort(() => Math.random() - 0.5)
    return deckRef.current
  }, [themeFilter]) // intentional: deck reshuffles on filter change, not on state change

  if (deck.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-500 text-center">Nenhuma carta disponível. Adicione palavras primeiro.</p>
        <button onClick={onFinish} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold">
          Voltar
        </button>
      </div>
    )
  }

  const safeIndex = index % deck.length
  const card = deck[safeIndex]

  function changeFilter(f: Theme | 'all') {
    setThemeFilter(f)
    setIndex(0)
    setRevealed(false)
  }

  function handleNext() {
    setIndex(i => (i + 1) % deck.length)
    setRevealed(false)
  }

  function handlePrev() {
    setIndex(i => (i - 1 + deck.length) % deck.length)
    setRevealed(false)
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onFinish} className="text-slate-500 hover:text-slate-700 text-sm">
          ← Sair
        </button>
        <span className="text-sm text-slate-500">
          Prática livre · {safeIndex + 1}/{deck.length}
        </span>
      </div>

      {/* Theme filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => changeFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            themeFilter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos
        </button>
        {(Object.entries(THEME_LABELS) as [Theme, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => changeFilter(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              themeFilter === key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Card */}
      <FlashCard card={card} onReveal={() => setRevealed(true)} revealed={revealed} />

      {/* Navigation */}
      <div className="flex justify-between items-center w-full max-w-lg mx-auto mt-2">
        <button
          onClick={handlePrev}
          className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors"
        >
          ← Anterior
        </button>
        {revealed ? (
          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
          >
            Próxima →
          </button>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-100 text-indigo-700 font-medium hover:bg-indigo-200 transition-colors"
          >
            Revelar
          </button>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 mt-1">
        Modo livre — sem afetar o agendamento das revisões
      </p>
    </div>
  )
}
