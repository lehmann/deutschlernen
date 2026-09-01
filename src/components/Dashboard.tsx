import { useMemo } from 'react'
import { useStore, ALL_CARDS } from '../store'
import { isDue, isNew } from '../lib/sm2'
import { VOCABULARY } from '../data/vocabulary'
import type { CefrLevel } from '../types'

interface Props {
  onStartReview: () => void
  onStartFree: () => void
  onBrowseVocab: () => void
  onStartListening: () => void
  onStartWriting: () => void
}

export function Dashboard({ onStartReview, onStartFree, onBrowseVocab, onStartListening, onStartWriting }: Props) {
  const { state, addVocabBulk } = useStore()

  const stats = useMemo(() => {
    const activeCards = ALL_CARDS.filter(c => state.progress[c.id])
    const dueCards = activeCards.filter(c => isDue(state.progress[c.id]))
    const newCards = dueCards.filter(c => isNew(state.progress[c.id]))
    const learnedCards = activeCards.filter(c => {
      const p = state.progress[c.id]
      return p && p.repetitions >= 2
    })
    const future = activeCards
      .filter(c => !isDue(state.progress[c.id]))
      .map(c => new Date(state.progress[c.id].nextReview).getTime())
    const nextDue = future.length > 0 ? new Date(Math.min(...future)) : null

    return {
      total: activeCards.length,
      due: dueCards.length,
      new: newCards.length,
      learned: learnedCards.length,
      vocabActive: state.activeVocabIds.length,
      nextDue,
    }
  }, [state])

  const levelStats = useMemo(() => {
    const levels: CefrLevel[] = ['A2', 'B1', 'B2']
    return levels.map(level => {
      const vocabForLevel = VOCABULARY.filter(v => (v.level ?? 'A2') === level)
      const activeForLevel = vocabForLevel.filter(v => state.activeVocabIds.includes(v.id))
      return {
        level,
        total: vocabForLevel.length,
        active: activeForLevel.length,
        ids: vocabForLevel.map(v => v.id),
      }
    })
  }, [state.activeVocabIds])

  const [a2Stats, b1Stats, b2Stats] = levelStats

  const hasDue = stats.due > 0 || stats.new > 0
  const hasActive = stats.vocabActive > 0

  function handleQuickStart() {
    addVocabBulk(a2Stats.ids)
    onStartReview()
  }

  function formatNextDue(date: Date): string {
    const now = new Date()
    const diffH = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60))
    if (diffH < 1) return 'em menos de 1 hora'
    if (diffH === 1) return 'em 1 hora'
    if (diffH < 24) return `em ${diffH} horas`
    const diffD = Math.ceil(diffH / 24)
    return diffD === 1 ? 'amanhã' : `em ${diffD} dias`
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white">
        <p className="text-indigo-200 text-sm font-medium mb-1">
          Deutsch{' '}
          {[a2Stats.active > 0 && 'A2', b1Stats.active > 0 && 'B1', b2Stats.active > 0 && 'B2']
            .filter(Boolean)
            .join(' + ') || 'A2'}
        </p>
        <h1 className="text-2xl font-bold mb-4">Vamos praticar! 👋</h1>

        {hasActive && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <StatTile label="Para revisar" value={stats.due} />
            <StatTile label="Novas" value={stats.new} />
            <StatTile label="Aprendidas" value={stats.learned} />
          </div>
        )}

        {!hasActive && (
          <div className="mb-5 bg-white/10 rounded-xl p-4">
            <p className="text-sm text-indigo-100 leading-relaxed">
              Você ainda não tem palavras no seu baralho. Adicione todo o vocabulário A2 de uma vez e comece agora!
            </p>
          </div>
        )}

        {!hasActive ? (
          <button
            onClick={handleQuickStart}
            className="w-full py-3 rounded-xl font-semibold text-base bg-white text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            Começar agora — {a2Stats.total} palavras A2
          </button>
        ) : hasDue ? (
          <button
            onClick={onStartReview}
            className="w-full py-3 rounded-xl font-semibold text-base bg-white text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            Iniciar revisão ({stats.due + stats.new} cartas)
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-indigo-200 text-center">
              Tudo revisado!{stats.nextDue && ` Próxima revisão ${formatNextDue(stats.nextDue)}.`}
            </p>
            <button
              onClick={onStartReview}
              className="w-full py-3 rounded-xl font-semibold text-base bg-white text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              Revisar novamente
            </button>
            <button
              onClick={onStartFree}
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-white/15 text-white border border-white/30 hover:bg-white/25 transition-colors"
            >
              Praticar livremente
            </button>
            {b1Stats.active === 0 && (
              <button
                onClick={() => addVocabBulk(b1Stats.ids)}
                className="w-full py-2.5 rounded-xl font-semibold text-sm bg-white/15 text-white border border-white/30 hover:bg-white/25 transition-colors flex items-center gap-3 px-4"
              >
                <span>🏆</span>
                <span className="flex-1 text-left">
                  <span className="block">Ativar nível B1</span>
                  <span className="block text-xs text-indigo-200 font-normal">{b1Stats.total} novas palavras</span>
                </span>
                <span className="text-indigo-200 text-xs">Ativar →</span>
              </button>
            )}
            {b1Stats.active > 0 && b2Stats.active === 0 && (
              <button
                onClick={() => addVocabBulk(b2Stats.ids)}
                className="w-full py-2.5 rounded-xl font-semibold text-sm bg-white/15 text-white border border-white/30 hover:bg-white/25 transition-colors flex items-center gap-3 px-4"
              >
                <span>🎓</span>
                <span className="flex-1 text-left">
                  <span className="block">Ativar nível B2</span>
                  <span className="block text-xs text-indigo-200 font-normal">{b2Stats.total} novas palavras</span>
                </span>
                <span className="text-indigo-200 text-xs">Ativar →</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Treino cards */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onStartListening}
          className="w-full rounded-2xl bg-slate-800 p-5 flex items-center gap-4 hover:bg-slate-700 transition-colors text-left"
        >
          <span className="text-3xl">🎧</span>
          <div className="flex-1">
            <p className="font-semibold text-base text-white">Ditado guiado</p>
            <p className="text-sm text-slate-400 mt-0.5">Ouça frases nativas e transcreva o que ouviu</p>
          </div>
          <span className="text-slate-400 text-sm font-semibold shrink-0">Treinar →</span>
        </button>

        <button
          onClick={onStartWriting}
          className="w-full rounded-2xl bg-slate-800 p-5 flex items-center gap-4 hover:bg-slate-700 transition-colors text-left"
        >
          <span className="text-3xl">✍️</span>
          <div className="flex-1">
            <p className="font-semibold text-base text-white">Prática de escrita</p>
            <p className="text-sm text-slate-400 mt-0.5">Leia em português e traduza para o alemão</p>
          </div>
          <span className="text-slate-400 text-sm font-semibold shrink-0">Treinar →</span>
        </button>
      </div>

      {/* Daily routine */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
        <p className="text-amber-800 font-semibold text-sm mb-2">⏱ Rotina diária — 20 minutos</p>
        <ol className="text-sm text-amber-700 space-y-1 list-none">
          <li>🔁 5 min — Revisão ativa (flashcards)</li>
          <li>🎧 5 min — Ditado guiado</li>
          <li>✍️ 5 min — Prática de escrita</li>
          <li>🗣 5 min — Praticar livremente</li>
        </ol>
      </div>

      {/* Browse button */}
      <button
        onClick={onBrowseVocab}
        className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:border-indigo-300 hover:text-indigo-700 transition-colors"
      >
        📚 Explorar vocabulário
      </button>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/20 rounded-xl p-3 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-indigo-100 mt-0.5">{label}</p>
    </div>
  )
}
