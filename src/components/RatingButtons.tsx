import type { Rating } from '../types'

const RATINGS: { value: Rating; label: string; sublabel: string; color: string }[] = [
  {
    value: 'again',
    label: 'Errei',
    sublabel: 'Repetir hoje',
    color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
  },
  {
    value: 'hard',
    label: 'Difícil',
    sublabel: 'Em breve',
    color: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
  },
  {
    value: 'good',
    label: 'Bom',
    sublabel: 'Alguns dias',
    color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
  },
  {
    value: 'easy',
    label: 'Fácil',
    sublabel: 'Mais tarde',
    color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
  },
]

interface Props {
  onRate: (rating: Rating) => void
}

export function RatingButtons({ onRate }: Props) {
  return (
    <div className="w-full max-w-lg mx-auto mt-6">
      <p className="text-center text-sm text-slate-500 mb-3">Como foi?</p>
      <div className="grid grid-cols-4 gap-2">
        {RATINGS.map(r => (
          <button
            key={r.value}
            onClick={() => onRate(r.value)}
            className={`flex flex-col items-center py-3 px-2 rounded-xl border font-medium transition-colors ${r.color}`}
          >
            <span className="text-sm font-semibold">{r.label}</span>
            <span className="text-xs opacity-70 mt-0.5">{r.sublabel}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
