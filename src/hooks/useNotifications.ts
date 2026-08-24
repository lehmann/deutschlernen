import { useEffect, useCallback } from 'react'
import { useStore } from '../store'
import { getTodaySessions } from '../lib/notifications'
import {
  registerServiceWorker,
  subscribeToPush,
  saveSubscription,
  reportSession,
  removeSubscription,
} from '../lib/pushClient'

export function useNotifications() {
  const { state, setNotificationPerm, setSubscriptionId } = useStore()
  const { notifications } = state

  const todayCount = getTodaySessions(notifications.sessions).length
  const hasDeclined = notifications.appPermission === 'declined'

  // Show our in-app prompt when user hasn't answered yet and is engaged
  const shouldShowPrompt =
    !hasDeclined &&
    notifications.appPermission === 'not_asked' &&
    state.activeVocabIds.length > 0 &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator

  // Register SW on mount (safe to call repeatedly — browser deduplicates)
  useEffect(() => {
    registerServiceWorker()
  }, [])

  const onAccept = useCallback(async () => {
    // Mark accepted first so the prompt disappears immediately
    setNotificationPerm('accepted')

    const perm = await Notification.requestPermission()
    if (perm !== 'granted') return  // Browser denied — we've already saved 'accepted', no retry

    const reg = await registerServiceWorker()
    if (!reg) return

    const pushSub = await subscribeToPush(reg)
    if (!pushSub) return

    const subId = await saveSubscription(pushSub)
    if (subId) setSubscriptionId(subId)
  }, [setNotificationPerm, setSubscriptionId])

  const onDecline = useCallback(async () => {
    setNotificationPerm('declined')
    // Remove any existing subscription from server
    if (notifications.subscriptionId) {
      await removeSubscription(notifications.subscriptionId)
    }
  }, [setNotificationPerm, notifications.subscriptionId])

  return {
    shouldShowPrompt,
    todayCount,
    sessionsRequired: 2,
    onAccept,
    onDecline,
  }
}
