import { useState, useEffect, useMemo } from 'react'
import type { CefrLevel } from '../types'
import { useStore } from '../store'
import { VOCABULARY } from '../data/vocabulary'
import { WRITING_DATA } from '../data/writing'
import type { WritingEntry } from '../data/writing'
import { THRESHOLD, checkAnswer } from '../lib/dictation'
import type { CheckResult } from '../lib/dictation'

const LEVEL_STYLE: Record<CefrLevel, { tab: string; card: string }> = {
  A2: { tab: 'bg-emerald-600', card: 'bg-emerald-50 border-emerald-200' },
  B1: { tab: 'bg-blue-600',    card: 'bg-blue-50 border-blue-200'       },
  B2: { tab: 'bg-purple-600',  card: 'bg-purple-50 border-purple-200'   },
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ResultView({
  result, reference, threshold,
}: {
  result: CheckResult
  reference: string
  threshold: number
}) {
  const pct = Math.round(result.accuracy * 100)
  return (
    <>
      <div className={`w-full rounded-xl border p-3 text-center ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-100'}`}>
        <p className={`text-2xl font-bold ${result.passed ? 'text-green-700' : 'text-red-600'}`}>{pct}%</p>
        <p className={`text-sm font-medium ${result.passed ? 'text-green-600' : 'text-red-500'}`}>
          {result.passed ? `✓ Passou! (mínimo ${threshold}%)` : `✗ Abaixo de ${threshold}%`}
        </p>
      </div>

      <div className="w-full flex flex-wrap gap-2 justify-center">
        {result.words.map((w, k) => {
          const cls =
            w.type === 'ok'     ? 'bg-green-100 text-green-800 border-green-200'
          : w.type === 'light'  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
          : w.type === 'medium' ? 'bg-orange-100 text-orange-800 border-orange-200'
          :                       'bg-red-100 text-red-800 border-red-200'
          return (
            <div key={k} className="flex flex-col items-center gap-0.5">
              <span className={`px-2 py-0.5 rounded border text-sm font-medium whitespace-nowrap ${cls}`}>
                {w.expected}
              </span>
              {w.type !== 'ok' && (
                <span className="text-xs text-slate-400 max-w-[80px] truncate" title={w.typed ?? '—'}>
                  {w.typed ?? '—'}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Resposta esperada</p>
        <p className="text-sm text-slate-700 leading-relaxed">{reference}</p>
      </div>

      <div className="flex gap-3 text-xs text-slate-400 flex-wrap justify-center">
        {([
          ['bg-green-400',  'correto'],
          ['bg-yellow-400', 'grafia'],
          ['bg-orange-400', 'similar'],
          ['bg-red-400',    'errado/faltando'],
        ] as const).map(([color, label]) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
            {label}
          </span>
        ))}
      </div>
    </>
  )
}

function EndScreen({
  stats, threshold, style, onRestart, onFinish,
}: {
  stats: { checked: number; passed: number }
  threshold: number
  style: { tab: string; card: string }
  onRestart: () => void
  onFinish: () => void
}) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-8 flex flex-col items-center gap-4 text-center">
      <span className="text-4xl">✍️</span>
      <h2 className="text-xl font-bold text-slate-800">Sessão concluída!</h2>
      <p className="text-slate-500 text-sm">
        {stats.passed} de {stats.checked} traduções corretas (≥{threshold}%)
      </p>
      <div className="flex gap-3 mt-2">
        <button onClick={onRestart} className={`px-5 py-2.5 rounded-xl font-semibold text-sm ${style.tab} text-white`}>
          Reiniciar
        </button>
        <button onClick={onFinish} className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors">
          Encerrar
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  onFinish: () => void
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function WritingPractice({ onFinish }: Props) {
  const { state } = useStore()

  const availableLevels = useMemo<CefrLevel[]>(() => {
    const levels: CefrLevel[] = ['A2']
    if (VOCABULARY.some(v => v.level === 'B1' && state.activeVocabIds.includes(v.id))) levels.push('B1')
    if (VOCABULARY.some(v => v.level === 'B2' && state.activeVocabIds.includes(v.id))) levels.push('B2')
    return levels
  }, [state.activeVocabIds])

  const [activeLevel, setActiveLevel] = useState<CefrLevel>(availableLevels[0])
  const [queue, setQueue]   = useState<WritingEntry[]>(() => shuffled(WRITING_DATA[availableLevels[0]] ?? []))
  const [idx, setIdx]       = useState(0)
  const [typed, setTyped]   = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [stats, setStats]   = useState({ checked: 0, passed: 0 })

  useEffect(() => {
    setQueue(shuffled(WRITING_DATA[activeLevel] ?? []))
    setIdx(0)
    setTyped('')
    setResult(null)
    setStats({ checked: 0, passed: 0 })
  }, [activeLevel])

  function handleCheck() {
    const entry = queue[idx]
    if (!entry || !typed.trim()) return
    const r = checkAnswer(entry.de, typed, activeLevel)
    setResult(r)
    setStats(s => ({ checked: s.checked + 1, passed: s.passed + (r.passed ? 1 : 0) }))
  }

  function advance() {
    setTyped('')
    setResult(null)
    setIdx(i => i + 1)
  }

  function handleRequeue() {
    const entry = queue[idx]
    if (entry) setQueue(q => [...q, entry])
    advance()
  }

  function handleRestart() {
    setQueue(shuffled(WRITING_DATA[activeLevel] ?? []))
    setIdx(0)
    setTyped('')
    setResult(null)
    setStats({ checked: 0, passed: 0 })
  }

  const entry = queue[idx]
  const isDone = queue.length > 0 && idx >= queue.length
  const style = LEVEL_STYLE[activeLevel]
  const threshold = Math.round(THRESHOLD[activeLevel] * 100)

  return (
    <div className="flex flex-col gap-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Prática de Escrita</h1>
        <button
          onClick={onFinish}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Encerrar
        </button>
      </div>

      {/* Level tabs */}
      <div className="flex gap-2">
        {availableLevels.map(level => (
          <button
            key={level}
            onClick={() => setActiveLevel(level)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeLevel === level
                ? `${LEVEL_STYLE[level].tab} text-white`
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {isDone ? (
        <EndScreen
          stats={stats}
          threshold={threshold}
          style={style}
          onRestart={handleRestart}
          onFinish={onFinish}
        />
      ) : entry ? (
        <>
          <div className={`rounded-2xl border ${style.card} p-6 flex flex-col items-center gap-4`}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              {result ? 'Resultado' : 'Traduza para o alemão'}
            </p>

            {/* PT paragraph */}
            <div className="w-full bg-white/60 rounded-xl border border-white/80 p-4">
              <p className="text-base text-slate-800 leading-relaxed">{entry.pt}</p>
            </div>

            {result ? (
              <ResultView result={result} reference={entry.de} threshold={threshold} />
            ) : (
              <>
                <textarea
                  value={typed}
                  onChange={e => setTyped(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCheck() } }}
                  placeholder="Escreva a tradução em alemão…"
                  rows={3}
                  autoFocus
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 text-center">
                  ä→a · ö→o · ü→u · ß→ss são aceitos · Enter para verificar
                </p>
              </>
            )}
          </div>

          {result ? (
            <div className="flex gap-3">
              <button onClick={advance} className={`flex-1 py-3 rounded-xl font-semibold ${style.tab} text-white hover:opacity-90 transition-opacity`}>
                Próxima →
              </button>
              <button onClick={handleRequeue} className="px-5 py-3 rounded-xl font-semibold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                ↩ Repetir
              </button>
            </div>
          ) : (
            <button
              onClick={handleCheck}
              disabled={!typed.trim()}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                typed.trim() ? `${style.tab} text-white hover:opacity-90` : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Verificar
            </button>
          )}

          <p className="text-center text-xs text-slate-400">{idx + 1} / {queue.length}</p>
        </>
      ) : (
        <p className="text-center text-slate-500 py-10">Nenhum texto disponível para este nível.</p>
      )}
    </div>
  )
}
