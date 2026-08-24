import type { AppState } from '../types'

const STORAGE_KEY = 'deutschlernen_v1'

const DEFAULT_STATE: AppState = {
  schemaVersion: 2,
  progress: {},
  activeVocabIds: [],
  notifications: {
    appPermission: 'not_asked',
    sessions: [],
    lastReminderAt: null,
    subscriptionId: null,
  },
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const saved = JSON.parse(raw)
    return {
      ...DEFAULT_STATE,
      ...saved,
      // deep-merge notifications so new fields have defaults
      notifications: { ...DEFAULT_STATE.notifications, ...(saved.notifications ?? {}) },
    }
  } catch {
    return DEFAULT_STATE
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
