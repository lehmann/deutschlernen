interface Props {
  onAccept: () => void
  onDecline: () => void
}

export function NotificationPrompt({ onAccept, onDecline }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 pointer-events-none">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 pointer-events-auto animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="text-3xl flex-shrink-0">🔔</div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 text-base mb-1">
              Ativar lembretes de prática?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Você receberia <strong>2 lembretes por dia</strong>, espaçados em pelo menos 6 horas,
              para manter a regularidade no aprendizado.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={onDecline}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Não, obrigado
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Ativar lembretes
          </button>
        </div>
      </div>
    </div>
  )
}
