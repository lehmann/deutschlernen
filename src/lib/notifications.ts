import type { NotificationPrefs } from '../types'

const MIN_SPACING_HOURS = 6
const SESSIONS_REQUIRED = 2

export function getTodaySessions(sessions: string[]): string[] {
  const today = new Date().toDateString()
  return sessions.filter(s => new Date(s).toDateString() === today)
}

export function isReminderDue(prefs: NotificationPrefs): boolean {
  const todayCount = getTodaySessions(prefs.sessions).length
  if (todayCount >= SESSIONS_REQUIRED) return false

  if (!prefs.lastReminderAt) return true

  const lastDate = new Date(prefs.lastReminderAt)
  const todayStr = new Date().toDateString()
  // Reset spacing check across days — always due on a new day if sessions not done
  if (lastDate.toDateString() !== todayStr) return true

  const hoursSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60)
  return hoursSince >= MIN_SPACING_HOURS
}

export async function requestBrowserPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export function sendReminderNotification(todayCount: number): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const remaining = SESSIONS_REQUIRED - todayCount
  const title = todayCount === 0
    ? 'Hora de praticar alemão! 🇩🇪'
    : 'Quase lá! Uma sessão a mais hoje 🎯'
  const body = todayCount === 0
    ? `Você ainda não fez nenhuma revisão hoje. Precisa de ${remaining} sessão${remaining > 1 ? 'ões' : ''}.`
    : 'Você fez 1 sessão. Complete mais uma para cumprir a meta diária.'

  new Notification(title, { body, icon: '/favicon.ico', tag: 'deutschlernen-reminder' })
}
