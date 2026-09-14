import { useState, useMemo } from 'react'
import { PRATERITUM_DATA, PRATERITUM_CATEGORY_LABEL, PRATERITUM_CATEGORY_TIP } from '../data/prateritum'
import type { PrateritumEntry, PrateritumCategory } from '../data/prateritum'

const SESSION_SIZE = 15

const CATEGORY_STYLE: Record<PrateritumCategory, string> = {
  regular:   'bg-emerald-100 text-emerald-700',
  irregular: 'bg-blue-100 text-blue-700',
  mixed:     'bg-purple-100 text-purple-700',
  modal:     'bg-orange-100 text-orange-700',
  auxiliar:  'bg-rose-100 text-rose-700',
}

function buildQueue(): PrateritumEntry[] {
  const arr = [...PRATERITUM_DATA]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, SESSION_SIZE)
}

function SentenceWithBlank({ sentence }: { sentence: string }) {
  const parts = sentence.split('_VERB_')
  return (
    <>
      {parts[0]}
      <span
        className="inline-block border-b-2 border-indigo-400 min-w-[4rem] mx-0.5 text-center leading-none pb-0.5"
        aria-label="verbo no Präteritum"
      >
        <span className="text-indigo-400 text-sm font-mono">______</span>
      </span>
      {parts[1]}
    </>
  )
}

function SentenceRevealed({ sentence, verbAnswer }: { sentence: string; verbAnswer: string }) {
  const parts = sentence.split('_VERB_')
  return (
    <>
      {parts[0]}
      <span className="font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded mx-0.5">
        {verbAnswer}
      </span>
      {parts[1]}
    </>
  )
}

interface Props {
  onFinish: () => void
}

export function PrateritumSession({ onFinish }: Props) {
  const queue = useMemo(buildQueue, [])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [missedCategories, setMissedCategories] = useState<PrateritumCategory[]>([])

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
          <h2 className="text-lg font-bold text-slate-800">Präteritum — Resultado</h2>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 flex flex-col items-center gap-4">
          <div className={`text-5xl font-bold ${pct === 100 ? 'text-emerald-600' : pct >= 70 ? 'text-blue-600' : 'text-orange-600'}`}>
            {correctCount}/{total}
          </div>
          <p className="text-slate-600 text-center text-sm">
            {pct === 100
              ? 'Perfeito! Você acertou tudo!'
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
                    {PRATERITUM_CATEGORY_LABEL[cat]} — {PRATERITUM_CATEGORY_TIP[cat]}
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
        <span className="text-sm font-semibold text-slate-700">Präteritum</span>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Complete a lacuna
          </p>

          {/* Sentence */}
          <p className="text-2xl font-medium text-slate-800 leading-relaxed mb-5">
            {revealed
              ? <SentenceRevealed sentence={entry.sentence} verbAnswer={entry.verbAnswer} />
              : <SentenceWithBlank sentence={entry.sentence} />
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
                {PRATERITUM_CATEGORY_LABEL[entry.category]}
              </span>
              <span className="text-sm text-slate-600">
                {entry.infinitive} →{' '}
                <span className="font-semibold text-indigo-600">{entry.prateritumBase}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">
              {entry.tip ?? PRATERITUM_CATEGORY_TIP[entry.category]}
            </p>

            <p className="text-sm text-slate-500 italic">"{entry.translation}"</p>
          </div>
        ) : (
          /* Legend */
          <div className="px-5 pb-4 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="inline-block w-4 h-0.5 bg-indigo-400 rounded" />
              verbo no Präteritum
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
