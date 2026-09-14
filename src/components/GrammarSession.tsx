import { useState, useMemo } from 'react'
import { PERFEKT_DATA, CATEGORY_LABEL, CATEGORY_TIP } from '../data/perfekt'
import type { PerfektEntry, PerfektCategory } from '../data/perfekt'

const SESSION_SIZE = 15

const CATEGORY_STYLE: Record<PerfektCategory, string> = {
  regular:     'bg-emerald-100 text-emerald-700',
  irregular:   'bg-blue-100 text-blue-700',
  mixed:       'bg-purple-100 text-purple-700',
  ieren:       'bg-orange-100 text-orange-700',
  separable:   'bg-cyan-100 text-cyan-700',
  inseparable: 'bg-rose-100 text-rose-700',
  sein:        'bg-amber-100 text-amber-700',
}

function buildQueue(): PerfektEntry[] {
  const arr = [...PERFEKT_DATA]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, SESSION_SIZE)
}

function SentenceWithBlanks({ sentence }: { sentence: string }) {
  const parts = sentence.split(/(_AUX_|_PP_)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part === '_AUX_') return (
          <span
            key={i}
            className="inline-block border-b-2 border-amber-400 min-w-[2.5rem] mx-0.5 text-center leading-none pb-0.5"
            aria-label="auxiliar"
          >
            <span className="text-amber-400 text-sm font-mono">___</span>
          </span>
        )
        if (part === '_PP_') return (
          <span
            key={i}
            className="inline-block border-b-2 border-indigo-400 min-w-[4.5rem] mx-0.5 text-center leading-none pb-0.5"
            aria-label="Partizip II"
          >
            <span className="text-indigo-400 text-sm font-mono">______</span>
          </span>
        )
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

function SentenceRevealed({ sentence, auxAnswer, partAnswer }: {
  sentence: string
  auxAnswer: string
  partAnswer: string
}) {
  const parts = sentence.split(/(_AUX_|_PP_)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part === '_AUX_') return (
          <span key={i} className="font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded mx-0.5">
            {auxAnswer}
          </span>
        )
        if (part === '_PP_') return (
          <span key={i} className="font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded mx-0.5">
            {partAnswer}
          </span>
        )
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

interface Props {
  onFinish: () => void
}

export function GrammarSession({ onFinish }: Props) {
  const queue = useMemo(buildQueue, [])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [missedCategories, setMissedCategories] = useState<PerfektCategory[]>([])

  const entry = queue[index]

  function handleRate(wasCorrect: boolean) {
    if (wasCorrect) {
      setCorrectCount(c => c + 1)
    } else {
      setMissedCategories(prev => [...prev, entry.category])
    }

    if (index === queue.length - 1) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
      setRevealed(false)
    }
  }

  if (done) {
    const total = queue.length
    const uniqueMissed = [...new Set(missedCategories)]
    const pct = Math.round((correctCount / total) * 100)

    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={onFinish} className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</button>
          <h2 className="text-lg font-bold text-slate-800">Perfekt — Resultado</h2>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex flex-col items-center gap-4">
          <div className={`text-5xl font-bold ${pct === 100 ? 'text-emerald-600' : pct >= 70 ? 'text-blue-600' : 'text-orange-600'}`}>
            {correctCount}/{total}
          </div>
          <p className="text-slate-600 text-center text-sm">
            {pct === 100
              ? 'Perfekt! Você acertou tudo!'
              : pct >= 70
              ? 'Bom trabalho! Continue praticando.'
              : 'Revise os padrões e tente novamente!'}
          </p>

          {uniqueMissed.length > 0 && (
            <div className="w-full bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Revisar</p>
              <div className="flex flex-wrap gap-2">
                {uniqueMissed.map(cat => (
                  <span key={cat} className={`text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_STYLE[cat]}`}>
                    {CATEGORY_LABEL[cat]} — {CATEGORY_TIP[cat]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onFinish}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onFinish} className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 font-medium">{index + 1}/{queue.length}</span>
          <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${((index + 1) / queue.length) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-semibold text-slate-700">Perfekt</span>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Complete as lacunas
          </p>

          {/* Sentence */}
          <p className="text-2xl font-medium text-slate-800 leading-relaxed mb-5">
            {revealed
              ? <SentenceRevealed sentence={entry.sentence} auxAnswer={entry.auxAnswer} partAnswer={entry.partAnswer} />
              : <SentenceWithBlanks sentence={entry.sentence} />
            }
          </p>

          {/* Infinitive hint */}
          <p className="text-sm text-slate-400">
            Verbo: <span className="font-semibold text-slate-700">{entry.infinitive}</span>
          </p>
        </div>

        {/* Revealed details */}
        {revealed ? (
          <div className="px-5 pb-5 border-t border-slate-100 pt-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_STYLE[entry.category]}`}>
                {CATEGORY_LABEL[entry.category]}
              </span>
              <span className="text-sm text-slate-600">
                {entry.infinitive} →{' '}
                <span className="font-semibold text-indigo-600">{entry.participle}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">
              {entry.tip ?? CATEGORY_TIP[entry.category]}
            </p>

            <p className="text-sm text-slate-500 italic">"{entry.translation}"</p>
          </div>
        ) : (
          /* Color legend */
          <div className="px-5 pb-4 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-0.5 bg-amber-400 rounded" />
                auxiliar
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-4 h-0.5 bg-indigo-400 rounded" />
                Partizip II
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-colors"
        >
          Revelar resposta
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => handleRate(false)}
            className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-base hover:bg-slate-200 transition-colors"
          >
            Errei
          </button>
          <button
            onClick={() => handleRate(true)}
            className="flex-1 py-3.5 rounded-xl bg-emerald-500 text-white font-semibold text-base hover:bg-emerald-600 transition-colors"
          >
            Acertei ✓
          </button>
        </div>
      )}
    </div>
  )
}
