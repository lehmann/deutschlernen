import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { ReviewSession } from './components/ReviewSession'
import { FreePractice } from './components/FreePractice'
import { VocabBrowser } from './components/VocabBrowser'
import { NotificationPrompt } from './components/NotificationPrompt'
import { useNotifications } from './hooks/useNotifications'

type View = 'dashboard' | 'review' | 'free' | 'vocab'

export function App() {
  const [view, setView] = useState<View>('dashboard')
  const { shouldShowPrompt, onAccept, onDecline } = useNotifications()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        {view === 'dashboard' && (
          <Dashboard
            onStartReview={() => setView('review')}
            onStartFree={() => setView('free')}
            onBrowseVocab={() => setView('vocab')}
          />
        )}
        {view === 'review' && (
          <ReviewSession onFinish={() => setView('dashboard')} />
        )}
        {view === 'free' && (
          <FreePractice onFinish={() => setView('dashboard')} />
        )}
        {view === 'vocab' && (
          <VocabBrowser onBack={() => setView('dashboard')} />
        )}
      </div>

      {shouldShowPrompt && (
        <NotificationPrompt onAccept={onAccept} onDecline={onDecline} />
      )}
    </div>
  )
}
