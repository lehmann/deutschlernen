import { describe, it, expect, beforeEach } from 'vitest'
import { loadState, saveState, clearState } from '../../src/lib/storage'

const DEFAULT_NOTIFICATIONS = {
  appPermission: 'not_asked',
  sessions: [],
  lastReminderAt: null,
  subscriptionId: null,
}

beforeEach(() => localStorage.clear())

describe('loadState', () => {
  it('returns default state when localStorage is empty', () => {
    const state = loadState()
    expect(state.schemaVersion).toBe(2)
    expect(state.activeVocabIds).toEqual([])
    expect(state.progress).toEqual({})
    expect(state.notifications).toEqual(DEFAULT_NOTIFICATIONS)
  })

  it('returns the previously saved state', () => {
    const saved = {
      schemaVersion: 2,
      activeVocabIds: ['v_machen'],
      progress: {},
      notifications: { ...DEFAULT_NOTIFICATIONS, appPermission: 'accepted' },
    }
    localStorage.setItem('deutschlernen_v1', JSON.stringify(saved))
    const state = loadState()
    expect(state.activeVocabIds).toEqual(['v_machen'])
    expect(state.notifications.appPermission).toBe('accepted')
  })

  it('deep-merges notifications — missing fields filled with defaults', () => {
    const partial = {
      schemaVersion: 2,
      activeVocabIds: [],
      progress: {},
      notifications: { appPermission: 'declined' },
    }
    localStorage.setItem('deutschlernen_v1', JSON.stringify(partial))
    const state = loadState()
    expect(state.notifications.appPermission).toBe('declined')
    expect(state.notifications.sessions).toEqual([])
    expect(state.notifications.lastReminderAt).toBeNull()
    expect(state.notifications.subscriptionId).toBeNull()
  })

  it('returns default state on corrupted JSON', () => {
    localStorage.setItem('deutschlernen_v1', '{{invalid}')
    const state = loadState()
    expect(state.schemaVersion).toBe(2)
    expect(state.activeVocabIds).toEqual([])
  })

  it('fills missing top-level fields with defaults when partial data is stored', () => {
    localStorage.setItem('deutschlernen_v1', JSON.stringify({ schemaVersion: 2 }))
    const state = loadState()
    expect(state.activeVocabIds).toEqual([])
    expect(state.progress).toEqual({})
  })
})

describe('saveState', () => {
  it('persists state to localStorage', () => {
    const state = { ...loadState(), activeVocabIds: ['v_gehen'] }
    saveState(state)
    const raw = localStorage.getItem('deutschlernen_v1')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!).activeVocabIds).toEqual(['v_gehen'])
  })

  it('round-trips a state with progress', () => {
    const state = { ...loadState(), progress: { ...loadState().progress } }
    state.progress['v_gehen:pt_to_de'] = {
      cardId: 'v_gehen:pt_to_de',
      easiness: 2.5,
      interval: 6,
      repetitions: 2,
      nextReview: '2026-08-30T00:00:00.000Z',
      lastReview: '2026-08-24T00:00:00.000Z',
    }
    saveState(state)
    const loaded = loadState()
    expect(loaded.progress['v_gehen:pt_to_de'].interval).toBe(6)
  })
})

describe('clearState', () => {
  it('removes the localStorage key', () => {
    saveState(loadState())
    clearState()
    expect(localStorage.getItem('deutschlernen_v1')).toBeNull()
  })

  it('loadState returns defaults after clear', () => {
    const state = { ...loadState(), activeVocabIds: ['v_machen'] }
    saveState(state)
    clearState()
    expect(loadState().activeVocabIds).toEqual([])
  })
})
