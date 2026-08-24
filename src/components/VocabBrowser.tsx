import { useState } from 'react'
import { VOCABULARY } from '../data/vocabulary'
import { THEME_LABELS } from '../types'
import type { Theme } from '../types'
import { useStore } from '../store'

const THEMES = Object.entries(THEME_LABELS) as [Theme, string][]

const TYPE_ICON: Record<string, string> = {
  verb: '🔧',
  noun: '📦',
  adjective: '🎨',
  phrase: '💬',
  expression: '💡',
}

interface Props {
  onBack: () => void
}

export function VocabBrowser({ onBack }: Props) {
  const { state, addVocab, removeVocab } = useStore()
  const [selectedTheme, setSelectedTheme] = useState<Theme | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = VOCABULARY.filter(v => {
    const matchTheme = selectedTheme === 'all' || v.theme === selectedTheme
    const matchSearch =
      !search ||
      v.german.toLowerCase().includes(search.toLowerCase()) ||
      v.portuguese.toLowerCase().includes(search.toLowerCase())
    return matchTheme && matchSearch
  })

  const activeSet = new Set(state.activeVocabIds)
  const activeCount = state.activeVocabIds.length

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-700">
          ← Voltar
        </button>
        <h2 className="text-xl font-bold text-slate-800">Vocabulário A2</h2>
        <span className="ml-auto text-sm text-indigo-600 font-medium">
          {activeCount} ativas
        </span>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar palavra…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
      />

      {/* Theme filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedTheme('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedTheme === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todos
        </button>
        {THEMES.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedTheme(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedTheme === key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Vocab list */}
      <div className="flex flex-col gap-2">
        {filtered.map(entry => {
          const isActive = activeSet.has(entry.id)
          return (
            <div
              key={entry.id}
              className="flex items-start gap-3 p-4 rounded-xl border bg-white border-slate-200 hover:border-indigo-200 transition-colors"
            >
              <span className="text-lg mt-0.5">{TYPE_ICON[entry.type] ?? '📝'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800">{entry.german}</span>
                  {entry.article && (
                    <span className="text-xs text-indigo-500 font-medium">
                      {entry.article} • pl: {entry.plural}
                    </span>
                  )}
                  {entry.preposition && (
                    <span className="text-xs text-amber-500 font-medium">
                      + {entry.preposition}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{entry.portuguese}</p>
                <p className="text-xs text-slate-400 mt-1 italic">{entry.exampleDE}</p>
              </div>
              <button
                onClick={() => isActive ? removeVocab(entry.id) : addVocab(entry.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'
                }`}
              >
                {isActive ? '✓ Ativa' : '+ Adicionar'}
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-slate-400 py-8">Nenhuma palavra encontrada.</p>
        )}
      </div>
    </div>
  )
}
