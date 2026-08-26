import { useState, useRef, useMemo, useEffect } from 'react'
import type { CefrLevel } from '../types'
import { useStore } from '../store'
import { VOCABULARY } from '../data/vocabulary'
import { LISTENING_DATA } from '../data/listening'
import type { ListeningEntry } from '../data/listening'

const LEVEL_STYLE: Record<CefrLevel, { tab: string; card: string }> = {
  A2: { tab: 'bg-emerald-600', card: 'bg-emerald-50 border-emerald-200' },
  B1: { tab: 'bg-blue-600',    card: 'bg-blue-50 border-blue-200'       },
  B2: { tab: 'bg-purple-600',  card: 'bg-purple-50 border-purple-200'   },
}

interface Props {
  onFinish: () => void
}

export function ListeningPractice({ onFinish }: Props) {
  const { state } = useStore()

  const availableLevels = useMemo<CefrLevel[]>(() => {
    const levels: CefrLevel[] = ['A2']
    if (VOCABULARY.some(v => v.level === 'B1' && state.activeVocabIds.includes(v.id))) levels.push('B1')
    if (VOCABULARY.some(v => v.level === 'B2' && state.activeVocabIds.includes(v.id))) levels.push('B2')
    return levels
  }, [state.activeVocabIds])

  const [activeLevel, setActiveLevel] = useState<CefrLevel>(availableLevels[0])
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const queue = useMemo<ListeningEntry[]>(() => {
    const entries = [...(LISTENING_DATA[activeLevel] ?? [])]
    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[entries[i], entries[j]] = [entries[j], entries[i]]
    }
    return entries
  }, [activeLevel]) // eslint-disable-line react-hooks/exhaustive-deps

  const entry = queue[Math.min(idx, queue.length - 1)]

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      window.speechSynthesis.cancel()
    }
  }, [])

  function stopAudio() {
    audioRef.current?.pause()
    audioRef.current = null
    window.speechSynthesis.cancel()
    setPlaying(false)
  }

  function playTTS(text: string) {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'de-DE'
    u.rate = 0.85
    u.onend = () => setPlaying(false)
    u.onerror = () => setPlaying(false)
    window.speechSynthesis.speak(u)
    setPlaying(true)
  }

  function handlePlay() {
    if (playing) { stopAudio(); return }
    if (!entry) return
    if (entry.audioId) {
      const audio = new Audio(`https://tatoeba.org/en/audio/download/${entry.audioId}`)
      audioRef.current = audio
      audio.onended = () => setPlaying(false)
      audio.onerror = () => { setPlaying(false); playTTS(entry.text) }
      audio.play()
        .then(() => setPlaying(true))
        .catch(() => playTTS(entry.text))
    } else {
      playTTS(entry.text)
    }
  }

  function handleNext() {
    stopAudio()
    setRevealed(false)
    setIdx(i => Math.min(i + 1, queue.length - 1))
  }

  function handlePrev() {
    stopAudio()
    setRevealed(false)
    setIdx(i => Math.max(i - 1, 0))
  }

  function handleLevelChange(level: CefrLevel) {
    stopAudio()
    setActiveLevel(level)
    setIdx(0)
    setRevealed(false)
  }

  function handleFinish() {
    stopAudio()
    onFinish()
  }

  const style = LEVEL_STYLE[activeLevel]

  return (
    <div className="flex flex-col gap-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Treino de Escuta</h1>
        <button
          onClick={handleFinish}
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
            onClick={() => handleLevelChange(level)}
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

      {entry ? (
        <>
          {/* Card */}
          <div className={`rounded-2xl border ${style.card} p-6 flex flex-col items-center gap-5`}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Ouça e tente compreender
            </p>

            {/* Play / Pause button */}
            <button
              onClick={handlePlay}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all ${style.tab} text-white ${playing ? 'scale-95' : 'hover:scale-105'}`}
            >
              <span className="text-3xl leading-none">{playing ? '⏸' : '▶'}</span>
            </button>

            {/* Sentence — blurred until revealed */}
            <div className="w-full min-h-[3rem] flex items-center justify-center">
              {revealed ? (
                <p className="text-center text-slate-800 text-lg font-medium leading-relaxed">
                  {entry.text}
                </p>
              ) : (
                <p
                  className="text-center text-slate-800 text-lg font-medium leading-relaxed select-none"
                  style={{ filter: 'blur(6px)' }}
                  aria-hidden="true"
                >
                  {entry.text}
                </p>
              )}
            </div>

            {entry.audioId && (
              <p className="text-xs text-slate-400">Voz nativa · Tatoeba CC-BY</p>
            )}
          </div>

          {/* Reveal */}
          {!revealed && (
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:border-slate-300 transition-colors"
            >
              Revelar frase
            </button>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={idx === 0}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <span className="text-sm text-slate-400">{idx + 1} / {queue.length}</span>
            <button
              onClick={handleNext}
              disabled={idx >= queue.length - 1}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Próxima →
            </button>
          </div>
        </>
      ) : (
        <p className="text-center text-slate-500 py-10">
          Nenhuma frase disponível para este nível.
        </p>
      )}
    </div>
  )
}
