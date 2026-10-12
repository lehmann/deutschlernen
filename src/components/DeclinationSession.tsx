import { useState, useMemo } from 'react'
import type { FormEvent } from 'react'
import { DECLINATION_DATA, CASE_LABEL, GENDER_LABEL, TABLE_LABEL } from '../data/declination'
import type { DeclinationEntry, DeclinationTable } from '../data/declination'

const SESSION_SIZE = 10

function tableStyle(table: DeclinationTable): string {
  return table.startsWith('artigo')
    ? 'bg-indigo-100 text-indigo-700'
    : 'bg-emerald-100 text-emerald-700'
}

function featureLabel(entry: DeclinationEntry): string {
  const number = entry.number === 'sg' ? 'singular' : 'plural'
  return entry.number === 'pl'
    ? `${CASE_LABEL[entry.case]} · ${number}`
    : `${CASE_LABEL[entry.case]} · ${GENDER_LABEL[entry.gender]} · ${number}`
}

function fillSentence(entry: DeclinationEntry): string {
  return entry.sentence.replace('_BLANK_', entry.ending)
}

function buildQueue(): DeclinationEntry[] {
  const arr = [...DECLINATION_DATA]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, SESSION_SIZE)
}

interface Props {
  onFinish: () => void
}

export function DeclinationSession({ onFinish }: Props) {
  const queue = useMemo(buildQueue, [])
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [missed, setMissed] = useState<DeclinationEntry[]>([])
  const [done, setDone] = useState(false)

  const entry = queue[index]
  const answered = submitted !== null
  const isCorrect = answered && submitted.trim().toLowerCase() === entry.ending

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (answered) return
    setSubmitted(input)
    if (input.trim().toLowerCase() === entry.ending) {
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
      setSubmitted(null)
      setInput('')
    }
  }

  if (done) {
    const total = queue.length
    const pct = Math.round((correctCount / total) * 100)

    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={onFinish} className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</button>
          <h2 className="text-lg font-bold text-slate-800">Declinação — Resultado</h2>
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
              : 'Revise as tabelas de declinação e tente novamente!'}
          </p>

          {missed.length > 0 && (
            <div className="w-full bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Revisar</p>
              <div className="flex flex-col gap-2">
                {missed.map(e => (
                  <div key={e.id} className="flex flex-col gap-1">
                    <span className={`self-start text-xs font-medium px-2.5 py-1 rounded-full ${tableStyle(e.table)}`}>
                      {TABLE_LABEL[e.table]}
                    </span>
                    <p className="text-sm text-slate-700">{fillSentence(e)}</p>
                  </div>
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

  // Cor do campo muda conforme o resultado
  const inputStyle = !answered
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
        <span className="text-sm font-semibold text-slate-700">Declinação</span>
      </div>

      {/* Card */}
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Complete a terminação
          </p>
          <p className="text-sm font-semibold text-slate-600 mb-4">
            {featureLabel(entry)}
          </p>

          {/* Sentence with inline input for the ending */}
          <p className="text-2xl font-medium text-slate-800 leading-relaxed mb-5">
            {before}
            <input
              aria-label="terminação"
              value={input}
              disabled={answered}
              onChange={e => setInput(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              size={4}
              className={`inline-block align-baseline w-20 mx-0.5 px-2 py-0.5 rounded-lg border-2 text-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-100 ${inputStyle}`}
            />
            {after}
          </p>

          {!answered && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-400">Digite só a terminação. Se a forma não tiver terminação, deixe em branco.</p>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                Verificar
              </button>
            </div>
          )}
        </div>

        {/* Feedback */}
        {answered && (
          <div className="px-5 pb-5 border-t border-slate-100 pt-4 flex flex-col gap-3">
            <p className={`font-semibold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isCorrect ? 'Correto! ✓' : entry.ending
                ? `Não foi dessa vez. A terminação certa é "-${entry.ending}".`
                : 'Não foi dessa vez. Esta forma não leva terminação.'}
            </p>

            <p className="text-lg font-medium text-slate-800">{fillSentence(entry)}</p>
            <p className="text-sm text-slate-500 italic">"{entry.translation}"</p>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tableStyle(entry.table)}`}>
                {TABLE_LABEL[entry.table]}
              </span>
            </div>
          </div>
        )}
      </form>

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
