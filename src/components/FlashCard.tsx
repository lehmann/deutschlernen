import { useState } from 'react'
import type { ReviewCard } from '../types'
import { VOCABULARY } from '../data/vocabulary'

const CARD_TYPE_LABEL: Record<string, string> = {
  pt_to_de: '🇧🇷 → 🇩🇪',
  de_to_pt: '🇩🇪 → 🇧🇷',
  fill_blank: 'Complete',
  article_recall: 'Artigo',
  preposition: 'Preposição',
}

// Common German function words not in the vocabulary
const GRAMMAR_DICT: Record<string, string> = {
  der: 'o (art. masc.)', die: 'a (art. fem./pl.)', das: 'o (art. neutro)',
  den: 'o (acus.)', dem: 'ao (dat.)', des: 'do (gen.)',
  ein: 'um', eine: 'uma', einen: 'um', eines: 'de um', einem: 'a um',
  ist: 'é/está', sind: 'são/estão', war: 'era/estava', waren: 'eram',
  hat: 'tem', habe: 'tenho', hast: 'você tem', haben: 'ter/têm',
  wird: 'será', werden: 'tornar-se', wurde: 'foi', wurden: 'foram',
  ich: 'eu', du: 'tu/você', er: 'ele', sie: 'ela/eles',
  wir: 'nós', ihr: 'vocês', man: 'se (impess.)', es: 'isso/ele',
  mein: 'meu', meine: 'minha', meinen: 'meu', meines: 'do meu', meinem: 'ao meu',
  dein: 'teu', sein: 'seu/de', ihre: 'dela/seus', unser: 'nosso',
  und: 'e', oder: 'ou', aber: 'mas', dass: 'que', weil: 'porque',
  wenn: 'quando/se', als: 'como/quando', wie: 'como', ob: 'se (condicional)',
  in: 'em', an: 'em/a', auf: 'em/sobre', für: 'para', mit: 'com',
  von: 'de', zu: 'para', bei: 'em/perto de', nach: 'depois/para',
  aus: 'de (origem)', über: 'sobre', unter: 'sob', vor: 'antes/diante',
  hinter: 'atrás', neben: 'ao lado', zwischen: 'entre', um: 'às/em volta de',
  am: 'no/ao', im: 'no', zum: 'ao/para o', zur: 'à/para a',
  vom: 'do', beim: 'ao', ins: 'para o', ans: 'ao',
  nicht: 'não', kein: 'nenhum', keine: 'nenhuma', keinen: 'nenhum',
  sehr: 'muito', auch: 'também', noch: 'ainda', nur: 'só',
  jetzt: 'agora', heute: 'hoje', morgen: 'amanhã', schon: 'já',
  immer: 'sempre', oft: 'frequentemente', fast: 'quase', gerade: 'agora mesmo',
  müssen: 'dever', muss: 'deve', können: 'poder', kann: 'pode',
  wollen: 'querer', will: 'quer', sollen: 'dever (obrig.)', dürfen: 'poder (perm.)',
  bitte: 'por favor', ja: 'sim', nein: 'não',
  so: 'assim', weniger: 'menos', gut: 'bom/bem',
  ab: 'a partir de', bis: 'até', seit: 'desde', während: 'durante',
  wo: 'onde', was: 'o que', wer: 'quem', welche: 'qual/quais',
  welchen: 'qual (acus.)', welcher: 'qual (masc.)', welches: 'qual (neutro)',
  alle: 'todos', viele: 'muitos', einige: 'alguns', andere: 'outros',
  jeder: 'cada um', jeden: 'cada', dieser: 'este', diese: 'esta/estes',
  dieses: 'este (neutro)', solche: 'tais',
  neue: 'novo/nova', neuen: 'novos', neues: 'novo', wichtig: 'importante',
  bekannt: 'conhecido', groß: 'grande', große: 'grande', großen: 'grandes',
  stark: 'forte', starke: 'forte', leer: 'vazio', schwer: 'difícil/pesado',
  regelmäßig: 'regularmente', verschiedene: 'vários', direkt: 'diretamente',
  zwei: 'dois', drei: 'três', vier: 'quatro', fünf: 'cinco',
  jahre: 'anos', monat: 'mês', monate: 'meses', woche: 'semana',
  tag: 'dia', tage: 'dias', stunde: 'hora', stunden: 'horas',
  minuten: 'minutos', zeit: 'tempo', welt: 'mundo', form: 'forma',
  sich: 'se (reflexivo)', vergessen: 'esquecer', lassen: 'deixar',
  gehen: 'ir', kommen: 'vir', machen: 'fazer', sehen: 'ver',
  wissen: 'saber', denken: 'pensar', sagen: 'dizer', geben: 'dar',
  nehmen: 'pegar', stehen: 'estar em pé', legen: 'colocar',
  heißt: 'chama-se', heißen: 'chamar-se', brauchen: 'precisar',
  vergiss: 'esqueça', trenne: 'separe', schicken: 'enviar',
}

function lookupTranslation(rawWord: string): string | null {
  const clean = rawWord.replace(/[.,!?;:'"()]/g, '').trim()
  if (!clean || clean === '___') return null
  const lower = clean.toLowerCase()

  for (const entry of VOCABULARY) {
    // Handle "X / Y" variant forms (e.g. "der Künstler / die Künstlerin")
    const firstForm = entry.german.toLowerCase().split('/')[0].trim()
    // Strip reflexive pronoun: "sich erholen" → "erholen"
    const withoutRefl = firstForm.startsWith('sich ') ? firstForm.slice(5) : firstForm
    // Take the last word to strip article: "die Umwelt" → "umwelt"
    const parts = withoutRefl.split(/\s+/)
    const base = parts[parts.length - 1]

    if (base === lower) return entry.portuguese

    // Prefix match for inflections (min 4 chars to avoid short false positives)
    const stem = Math.min(5, base.length, lower.length)
    if (stem >= 4 && base.slice(0, stem) === lower.slice(0, stem)) return entry.portuguese
  }

  return GRAMMAR_DICT[lower] ?? null
}

function ClickableSentence({ text }: { text: string }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const words = text.split(' ')

  return (
    <p className="text-center text-slate-800 text-xl font-medium leading-relaxed">
      {words.map((rawWord, i) => {
        const isLast = i === words.length - 1

        // Handle ___ placeholder (may have surrounding punctuation like "___.")
        const blankMatch = rawWord.match(/^([^\p{L}]*)(___)([^\p{L}]*)$/u)
        if (blankMatch) {
          return (
            <span key={i}>
              {blankMatch[1]}
              <span className="font-bold text-indigo-500">___</span>
              {blankMatch[3]}
              {!isLast && ' '}
            </span>
          )
        }

        // Separate any surrounding punctuation/quotes from the actual word
        const leadingPunct = rawWord.match(/^[^\p{L}]+/u)?.[0] ?? ''
        const trailingPunct = rawWord.match(/[^\p{L}]+$/u)?.[0] ?? ''
        const word = rawWord.slice(leadingPunct.length, rawWord.length - trailingPunct.length)
        const isActive = activeIdx === i

        // Token is purely punctuation — render as-is
        if (!word) {
          return <span key={i}>{rawWord}{!isLast && ' '}</span>
        }

        const translation = lookupTranslation(word)

        return (
          <span key={i}>
            {leadingPunct}
            <span className="relative inline-block">
              <span
                className={`cursor-pointer rounded px-0.5 transition-colors ${
                  isActive ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-slate-100'
                }`}
                onClick={e => {
                  e.stopPropagation()
                  setActiveIdx(isActive ? null : i)
                }}
              >
                {word}
              </span>
              {isActive && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-20 shadow-lg pointer-events-none">
                  {translation ?? '—'}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                </span>
              )}
            </span>
            {trailingPunct}
            {!isLast && ' '}
          </span>
        )
      })}
    </p>
  )
}

interface Props {
  card: ReviewCard
  onReveal: () => void
  revealed: boolean
}

export function FlashCard({ card, onReveal, revealed }: Props) {
  const [flipped, setFlipped] = useState(false)

  function handleFlip() {
    if (!revealed) {
      setFlipped(true)
      onReveal()
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto select-none" style={{ perspective: '1000px' }}>
      <div
        className="relative w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '260px',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col rounded-2xl bg-white shadow-lg border border-slate-200 p-6 cursor-pointer"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={handleFlip}
        >
          <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-4">
            {CARD_TYPE_LABEL[card.type] ?? card.type}
          </span>
          <div className="flex-1 flex items-center justify-center">
            {card.type === 'fill_blank' ? (
              <ClickableSentence text={card.front} />
            ) : (
              <p className="text-center text-slate-800 text-xl font-medium whitespace-pre-line leading-relaxed">
                {card.front}
              </p>
            )}
          </div>
          {card.hint && (
            <p className="mt-4 text-center text-sm text-slate-400">
              Dica: {card.hint}
            </p>
          )}
          <p className="mt-4 text-center text-xs text-slate-300">
            {card.type === 'fill_blank' ? 'Clique nas palavras • Toque para revelar' : 'Toque para revelar'}
          </p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col rounded-2xl bg-indigo-50 shadow-lg border border-indigo-200 p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-4">
            Resposta
          </span>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-center text-indigo-900 text-xl font-semibold whitespace-pre-line leading-relaxed">
              {card.back}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
