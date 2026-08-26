import { useMemo } from 'react'
import { useStore, ALL_CARDS } from '../store'
import { isDue, isNew } from '../lib/sm2'
import { VOCABULARY } from '../data/vocabulary'
import { THEME_LABELS } from '../types'
import type { Theme, CefrLevel } from '../types'

interface Props {
  onStartReview: () => void
  onStartFree: () => void
  onBrowseVocab: () => void
  onStartListening: () => void
}

export function Dashboard({ onStartReview, onStartFree, onBrowseVocab, onStartListening }: Props) {
  const { state, addVocabBulk } = useStore()

  const stats = useMemo(() => {
    const activeCards = ALL_CARDS.filter(c => state.progress[c.id])
    const dueCards = activeCards.filter(c => isDue(state.progress[c.id]))
    const newCards = activeCards.filter(c => isNew(state.progress[c.id]))
    const learnedCards = activeCards.filter(c => {
      const p = state.progress[c.id]
      return p && p.repetitions >= 2
    })
    // Next scheduled review date
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

  const themeStats = useMemo(() => {
    return Object.entries(THEME_LABELS).map(([theme, label]) => {
      const vocabInTheme = VOCABULARY.filter(v => v.theme === theme)
      const activeInTheme = vocabInTheme.filter(v => state.activeVocabIds.includes(v.id))
      return {
        theme: theme as Theme,
        label,
        total: vocabInTheme.length,
        active: activeInTheme.length,
      }
    }).filter(t => t.active > 0)
  }, [state.activeVocabIds])

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
    const diffMs = date.getTime() - now.getTime()
    const diffH = Math.ceil(diffMs / (1000 * 60 * 60))
    if (diffH < 1) return 'em menos de 1 hora'
    if (diffH === 1) return 'em 1 hora'
    if (diffH < 24) return `em ${diffH} horas`
    const diffD = Math.ceil(diffH / 24)
    if (diffD === 1) return 'amanhã'
    return `em ${diffD} dias`
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white">
        <p className="text-indigo-200 text-sm font-medium mb-1">
          Deutsch {[a2Stats.active > 0 && 'A2', b1Stats.active > 0 && 'B1', b2Stats.active > 0 && 'B2'].filter(Boolean).join(' + ') || 'A2'}
        </p>
        <h1 className="text-2xl font-bold mb-4">Vamos praticar! 👋</h1>

        {hasActive && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <StatTile label="Para revisar" value={stats.due} accent="bg-white/20" />
            <StatTile label="Novas" value={stats.new} accent="bg-white/20" />
            <StatTile label="Aprendidas" value={stats.learned} accent="bg-white/20" />
          </div>
        )}

        {/* First-time: no vocab yet */}
        {!hasActive && (
          <div className="mb-5 bg-white/10 rounded-xl p-4">
            <p className="text-sm text-indigo-100 leading-relaxed">
              Você ainda não tem palavras no seu baralho. Adicione todo o vocabulário A2 de uma vez e comece agora!
            </p>
          </div>
        )}

        {/* Primary action */}
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
              className="w-full py-2 rounded-xl font-semibold text-sm bg-white/20 text-white hover:bg-white/30 transition-colors border border-white/30"
            >
              Praticar livremente
            </button>
          </div>
        )}
      </div>

      {/* Level expansion */}
      {hasActive && b1Stats.active === 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex items-center gap-4">
          <span className="text-2xl">🏆</span>
          <div className="flex-1">
            <p className="font-semibold text-sm text-blue-900">Nível B1 disponível</p>
            <p className="text-xs text-blue-700 mt-0.5">{b1Stats.total} novas palavras — situações complexas do cotidiano</p>
          </div>
          <button
            onClick={() => addVocabBulk(b1Stats.ids)}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Ativar B1
          </button>
        </div>
      )}
      {hasActive && b1Stats.active > 0 && b2Stats.active === 0 && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 flex items-center gap-4">
          <span className="text-2xl">🎓</span>
          <div className="flex-1">
            <p className="font-semibold text-sm text-purple-900">Nível B2 disponível</p>
            <p className="text-xs text-purple-700 mt-0.5">{b2Stats.total} novas palavras — fluência e temas avançados</p>
          </div>
          <button
            onClick={() => addVocabBulk(b2Stats.ids)}
            className="px-3 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
          >
            Ativar B2
          </button>
        </div>
      )}

      {/* Listening practice */}
      {hasActive && (
        <div className="rounded-2xl bg-slate-800 p-4 flex items-center gap-4">
          <span className="text-2xl">🎧</span>
          <div className="flex-1">
            <p className="font-semibold text-sm text-white">Treino de escuta</p>
            <p className="text-xs text-slate-400 mt-0.5">Ouça frases em alemão e teste sua compreensão</p>
          </div>
          <button
            onClick={onStartListening}
            className="px-3 py-2 bg-white text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
          >
            Treinar
          </button>
        </div>
      )}

      {/* Free practice CTA when there's active vocab but nothing due */}
      {hasActive && !hasDue && (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-4 flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-green-800 font-semibold text-sm">Revisões em dia!</p>
            <p className="text-green-700 text-sm mt-0.5">
              Use o modo livre para reforçar qualquer palavra sem afetar o agendamento.
            </p>
            <button
              onClick={onStartFree}
              className="mt-2 text-sm font-semibold text-green-700 underline underline-offset-2"
            >
              Praticar livremente →
            </button>
          </div>
        </div>
      )}

      {/* Routine tip */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
        <p className="text-amber-800 font-semibold text-sm mb-2">⏱ Rotina de 20 minutos (seção 13)</p>
        <ol className="text-sm text-amber-700 space-y-1 list-none">
          <li>🔁 5 min — Revisão ativa (flashcards)</li>
          <li>📖 5 min — Vocabulário de um tema</li>
          <li>🗣 5 min — Falar sem parar</li>
          <li>🔄 5 min — Segunda tentativa</li>
        </ol>
      </div>

      {/* Theme progress */}
      {hasActive && (
        <div>
          <h2 className="text-base font-bold text-slate-700 mb-3">Progresso por tema</h2>
          <div className="grid grid-cols-2 gap-2">
            {themeStats.map(t => (
              <div key={t.theme} className="bg-white rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-600 mb-1.5">{t.label}</p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-indigo-400 rounded-full"
                    style={{ width: `${Math.round((t.active / t.total) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{t.active}/{t.total}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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

function StatTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`${accent} rounded-xl p-3 text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-indigo-100 mt-0.5">{label}</p>
    </div>
  )
}
