import { useState, useMemo } from 'react'
import { PRONOMINALADVERB_DATA } from '../data/pronominaladverbien'
import type { PronominaladverbEntry, PronominaladverbKind } from '../data/pronominaladverbien'

const SESSION_SIZE = 10

const KIND_STYLE: Record<PronominaladverbKind, string> = {
  da:   'bg-emerald-100 text-emerald-700',
  wo:   'bg-blue-100 text-blue-700',
  hier: 'bg-purple-100 text-purple-700',
}

const KIND_LABEL: Record<PronominaladverbKind, string> = {
  da:   'da- — retoma algo citado',
  wo:   'wo- — pergunta ou relativo',
  hier: 'hier- — formal',
}

interface Question {
  entry: PronominaladverbEntry
  options: string[]
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function buildQueue(): Question[] {
  return shuffle(PRONOMINALADVERB_DATA)
    .slice(0, SESSION_SIZE)
    .map(entry => ({ entry, options: shuffle([entry.answer, ...entry.distractors]) }))
}

interface Props {
  onFinish: () => void
}

export function PronominaladverbSession({ onFinish }: Props) {
  const queue = useMemo(buildQueue, [])
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [missed, setMissed] = useState<PronominaladverbEntry[]>([])
  const [done, setDone] = useState(false)

  const { entry, options } = queue[index]
  const answered = choice !== null
  const isCorrect = choice === entry.answer

  function handleChoose(value: string) {
    if (answered) return
    setChoice(value)
    if (value === entry.answer) {
      setCorrectCount(c => c + 1)
    } else {
      setMissed(prev => [...prev, entry])
    }
  }

  function handleNext() {
    if (index === queue.length - 1) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
      setChoice(null)
    }
  }

  if (done) {
    const total = queue.length
    const uniqueMissed = [...new Map(missed.map(e => [e.preposition, e])).values()]
    const pct = Math.round((correctCount / total) * 100)

    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={onFinish} className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</button>
          <h2 className="text-lg font-bold text-slate-800">Pronominaladverbien — Resultado</h2>
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
              : 'Revise as preposições e tente novamente!'}
          </p>

          {uniqueMissed.length > 0 && (
            <div className="w-full bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Revisar</p>
              <div className="flex flex-wrap gap-2">
                {uniqueMissed.map(e => (
                  <span key={e.preposition} className={`text-xs font-medium px-2.5 py-1 rounded-full ${KIND_STYLE[e.kind]}`}>
                    {e.preposition} → {e.answer}
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

  const [before, after] = entry.sentence.split('_BLANK_')

  // Cor do select muda conforme o resultado
  const selectStyle = !answered
    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
    : isCorrect
    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
    : 'border-rose-500 bg-rose-50 text-rose-700'

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
        <span className="text-sm font-semibold text-slate-700">Pronominaladverbien</span>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Escolha o pronominaladvérbio
          </p>

          {/* Sentence with inline combobox */}
          <p className="text-2xl font-medium text-slate-800 leading-relaxed mb-5">
            {before}
            <select
              aria-label="pronominaladvérbio"
              value={choice ?? ''}
              disabled={answered}
              onChange={e => handleChoose(e.target.value)}
              className={`inline-block align-baseline mx-1 px-2 py-0.5 rounded-lg border-2 text-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-100 cursor-pointer disabled:cursor-default ${selectStyle}`}
            >
              <option value="" disabled>______</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {after}
          </p>
        </div>

        {/* Feedback */}
        {answered && (
          <div className="px-5 pb-5 border-t border-slate-100 pt-4 flex flex-col gap-3">
            <p className={`font-semibold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isCorrect ? 'Correto! ✓' : `Não foi dessa vez. A resposta certa é "${entry.answer}".`}
            </p>

            {isCorrect ? (
              <p className="text-sm text-slate-500 italic">"{entry.translation}"</p>
            ) : (
              <p className="text-sm text-slate-700 bg-rose-50 rounded-lg px-3 py-2 leading-relaxed">
                {entry.explanation}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${KIND_STYLE[entry.kind]}`}>
                {KIND_LABEL[entry.kind]}
              </span>
            </div>

            {!isCorrect && (
              <p className="text-sm text-slate-500 italic">"{entry.translation}"</p>
            )}
          </div>
        )}
      </div>

      {/* Action button */}
      {answered && (
        <button
          onClick={handleNext}
          className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-colors"
        >
          {index === queue.length - 1 ? 'Ver resultado' : 'Próxima →'}
        </button>
      )}
    </div>
  )
}
