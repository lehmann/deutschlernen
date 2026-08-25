import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react'
import type { AppState, CardProgress, Rating } from '../types'
import { RATING_TO_QUALITY } from '../types'
import { loadState, saveState } from '../lib/storage'
import { createProgress, calculateNextReview } from '../lib/sm2'
import { VOCABULARY } from '../data/vocabulary'
import { generateCards } from '../lib/cardGenerator'

// All review cards derived from vocabulary (stable reference)
export const ALL_CARDS = VOCABULARY.flatMap(generateCards)
const ALL_CARDS_MAP = Object.fromEntries(ALL_CARDS.map(c => [c.id, c]))
export const VOCAB_THEME_MAP = Object.fromEntries(VOCABULARY.map(v => [v.id, v.theme]))

const ENTRIES_PER_DAY = 10

// One-time migration: stagger new (never-reviewed) cards across future days.
// Runs when schemaVersion < 2 — i.e., data created before staggering was added.
function migrateStagger(state: AppState): AppState {
  const newEntries = state.activeVocabIds.filter(vocabId =>
    ALL_CARDS.filter(c => c.vocabId === vocabId).some(c => {
      const p = state.progress[c.id]
      return p && p.repetitions === 0 && p.interval === 0
    })
  )
  const updatedProgress = { ...state.progress }
  newEntries.forEach((vocabId, idx) => {
    const dayOffset = Math.floor(idx / ENTRIES_PER_DAY)
    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + dayOffset)
    for (const card of ALL_CARDS.filter(c => c.vocabId === vocabId)) {
      const p = state.progress[card.id]
      if (p && p.repetitions === 0 && p.interval === 0) {
        updatedProgress[card.id] = { ...p, nextReview: scheduledDate.toISOString() }
      }
    }
  })
  return { ...state, schemaVersion: 2, progress: updatedProgress }
}

function initializeState(): AppState {
  const saved = loadState()
  if (!saved.schemaVersion || saved.schemaVersion < 2) {
    return migrateStagger(saved)
  }
  return saved
}

type Action =
  | { type: 'ADD_VOCAB'; vocabId: string }
  | { type: 'ADD_VOCAB_BULK'; vocabIds: string[] }
  | { type: 'REMOVE_VOCAB'; vocabId: string }
  | { type: 'REVIEW_CARD'; cardId: string; rating: Rating }
  | { type: 'RECORD_SESSION' }
  | { type: 'SET_NOTIFICATION_PERM'; appPermission: 'accepted' | 'declined' }
  | { type: 'SET_SUBSCRIPTION_ID'; subscriptionId: string }
  | { type: 'RECORD_REMINDER_SENT' }
  | { type: 'RESET' }

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_VOCAB': {
      if (state.activeVocabIds.includes(action.vocabId)) return state
      // Initialize progress for all cards of this vocab entry
      const newCards = ALL_CARDS.filter(c => c.vocabId === action.vocabId)
      const newProgress: Record<string, CardProgress> = {}
      for (const card of newCards) {
        if (!state.progress[card.id]) {
          newProgress[card.id] = createProgress(card.id)
        }
      }
      return {
        ...state,
        activeVocabIds: [...state.activeVocabIds, action.vocabId],
        progress: { ...state.progress, ...newProgress },
      }
    }

    case 'ADD_VOCAB_BULK': {
      const toAdd = action.vocabIds.filter(id => !state.activeVocabIds.includes(id))
      if (toAdd.length === 0) return state
      // Shuffle so the first batch of each day is random, not always the same entries
      const shuffled = [...toAdd]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      const newProgress: Record<string, CardProgress> = {}
      shuffled.forEach((vocabId, idx) => {
        const dayOffset = Math.floor(idx / ENTRIES_PER_DAY)
        const scheduledDate = new Date()
        scheduledDate.setDate(scheduledDate.getDate() + dayOffset)
        for (const card of ALL_CARDS.filter(c => c.vocabId === vocabId)) {
          if (!state.progress[card.id]) {
            newProgress[card.id] = { ...createProgress(card.id), nextReview: scheduledDate.toISOString() }
          }
        }
      })
      return {
        ...state,
        activeVocabIds: [...state.activeVocabIds, ...shuffled],
        progress: { ...state.progress, ...newProgress },
      }
    }

    case 'REMOVE_VOCAB': {
      const cardsToRemove = ALL_CARDS.filter(c => c.vocabId === action.vocabId).map(c => c.id)
      const newProgress = { ...state.progress }
      for (const id of cardsToRemove) delete newProgress[id]
      return {
        ...state,
        activeVocabIds: state.activeVocabIds.filter(id => id !== action.vocabId),
        progress: newProgress,
      }
    }

    case 'REVIEW_CARD': {
      const existing = state.progress[action.cardId]
      if (!existing) return state
      const quality = RATING_TO_QUALITY[action.rating]
      const updated = calculateNextReview(existing, quality)
      return {
        ...state,
        progress: { ...state.progress, [action.cardId]: updated },
      }
    }

    case 'RECORD_SESSION': {
      // Keep only last 30 days of sessions to avoid unbounded growth
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      const trimmed = state.notifications.sessions
        .filter(s => new Date(s) > cutoff)
      return {
        ...state,
        notifications: {
          ...state.notifications,
          sessions: [...trimmed, new Date().toISOString()],
        },
      }
    }

    case 'SET_NOTIFICATION_PERM':
      return {
        ...state,
        notifications: { ...state.notifications, appPermission: action.appPermission },
      }

    case 'SET_SUBSCRIPTION_ID':
      return {
        ...state,
        notifications: { ...state.notifications, subscriptionId: action.subscriptionId },
      }

    case 'RECORD_REMINDER_SENT':
      return {
        ...state,
        notifications: { ...state.notifications, lastReminderAt: new Date().toISOString() },
      }

    case 'RESET':
      return {
        schemaVersion: 2,
        progress: {},
        activeVocabIds: [],
        notifications: { appPermission: 'not_asked', sessions: [], lastReminderAt: null, subscriptionId: null },
      }

    default:
      return state
  }
}

interface StoreContext {
  state: AppState
  addVocab: (vocabId: string) => void
  addVocabBulk: (vocabIds: string[]) => void
  removeVocab: (vocabId: string) => void
  reviewCard: (cardId: string, rating: Rating) => void
  recordSession: () => void
  setNotificationPerm: (perm: 'accepted' | 'declined') => void
  setSubscriptionId: (id: string) => void
  recordReminderSent: () => void
  reset: () => void
}

const Context = createContext<StoreContext | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initializeState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const addVocab = useCallback((vocabId: string) => dispatch({ type: 'ADD_VOCAB', vocabId }), [])
  const addVocabBulk = useCallback((vocabIds: string[]) => dispatch({ type: 'ADD_VOCAB_BULK', vocabIds }), [])
  const removeVocab = useCallback((vocabId: string) => dispatch({ type: 'REMOVE_VOCAB', vocabId }), [])
  const reviewCard = useCallback((cardId: string, rating: Rating) => dispatch({ type: 'REVIEW_CARD', cardId, rating }), [])
  const recordSession = useCallback(() => dispatch({ type: 'RECORD_SESSION' }), [])
  const setNotificationPerm = useCallback((appPermission: 'accepted' | 'declined') => dispatch({ type: 'SET_NOTIFICATION_PERM', appPermission }), [])
  const setSubscriptionId = useCallback((subscriptionId: string) => dispatch({ type: 'SET_SUBSCRIPTION_ID', subscriptionId }), [])
  const recordReminderSent = useCallback(() => dispatch({ type: 'RECORD_REMINDER_SENT' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return (
    <Context.Provider value={{ state, addVocab, addVocabBulk, removeVocab, reviewCard, recordSession, setNotificationPerm, setSubscriptionId, recordReminderSent, reset }}>
      {children}
    </Context.Provider>
  )
}

export function useStore() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export { ALL_CARDS_MAP }
