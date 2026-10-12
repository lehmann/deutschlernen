import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { ReviewSession } from './components/ReviewSession'
import { FreePractice } from './components/FreePractice'
import { VocabBrowser } from './components/VocabBrowser'
import { ListeningPractice } from './components/ListeningPractice'
import { WritingPractice } from './components/WritingPractice'
import { GrammarSession } from './components/GrammarSession'
import { PrateritumSession } from './components/PrateritumSession'
import { PronominaladverbSession } from './components/PronominaladverbSession'
import { DeclinationSession } from './components/DeclinationSession'
import { NotificationPrompt } from './components/NotificationPrompt'
import { useNotifications } from './hooks/useNotifications'

type View = 'dashboard' | 'review' | 'free' | 'vocab' | 'listening' | 'writing' | 'grammar' | 'prateritum' | 'pronominaladverb' | 'declination'

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
            onStartListening={() => setView('listening')}
            onStartWriting={() => setView('writing')}
            onStartGrammar={() => setView('grammar')}
            onStartPrateritum={() => setView('prateritum')}
            onStartPronominaladverb={() => setView('pronominaladverb')}
            onStartDeclination={() => setView('declination')}
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
        {view === 'listening' && (
          <ListeningPractice onFinish={() => setView('dashboard')} />
        )}
        {view === 'writing' && (
          <WritingPractice onFinish={() => setView('dashboard')} />
        )}
        {view === 'grammar' && (
          <GrammarSession onFinish={() => setView('dashboard')} />
        )}
        {view === 'prateritum' && (
          <PrateritumSession onFinish={() => setView('dashboard')} />
        )}
        {view === 'pronominaladverb' && (
          <PronominaladverbSession onFinish={() => setView('dashboard')} />
        )}
        {view === 'declination' && (
          <DeclinationSession onFinish={() => setView('dashboard')} />
        )}
      </div>

      {shouldShowPrompt && (
        <NotificationPrompt onAccept={onAccept} onDecline={onDecline} />
      )}
    </div>
  )
}
