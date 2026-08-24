import cron from 'node-cron'
import { webpush } from './push.js'
import db from './db.js'

const SESSIONS_REQUIRED = 2
const MIN_SPACING_HOURS = 6
const ACTIVE_HOUR_START = 8   // Don't send before 8 AM
const ACTIVE_HOUR_END   = 22  // Don't send after 10 PM

function todayStartUnix() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return Math.floor(d.getTime() / 1000)
}

async function checkAndSendReminders() {
  const hour = new Date().getHours()
  if (hour < ACTIVE_HOUR_START || hour >= ACTIVE_HOUR_END) return

  const now = Math.floor(Date.now() / 1000)
  const todayTs = todayStartUnix()
  const subscriptions = db.prepare('SELECT * FROM subscriptions').all()

  for (const sub of subscriptions) {
    // How many sessions done today?
    const { count: sessionsToday } = db
      .prepare(
        'SELECT COUNT(*) AS count FROM sessions WHERE subscription_id = ? AND completed_at >= ?',
      )
      .get(sub.id, todayTs)

    if (sessionsToday >= SESSIONS_REQUIRED) continue

    // When was the last reminder sent (any day)?
    const lastReminder = db
      .prepare(
        'SELECT sent_at FROM reminders WHERE subscription_id = ? ORDER BY sent_at DESC LIMIT 1',
      )
      .get(sub.id)

    if (lastReminder) {
      const hoursSince = (now - lastReminder.sent_at) / 3600
      if (hoursSince < MIN_SPACING_HOURS) continue
    }

    const remaining = SESSIONS_REQUIRED - sessionsToday
    const payload = JSON.stringify({
      title: sessionsToday === 0 ? 'Hora de praticar alemão! 🇩🇪' : 'Mais uma sessão hoje! 🎯',
      body:
        sessionsToday === 0
          ? `Você ainda não fez nenhuma revisão hoje. Faltam ${remaining} sessões.`
          : 'Você fez 1 sessão. Complete mais uma para atingir a meta diária.',
      url: '/',
    })

    try {
      await webpush.sendNotification(JSON.parse(sub.sub_json), payload)
      db.prepare('INSERT INTO reminders (subscription_id, sent_at) VALUES (?, ?)').run(
        sub.id,
        now,
      )
      console.log(`[scheduler] Reminder sent to ${sub.id.slice(0, 8)}…`)
    } catch (err) {
      // Subscription expired or invalid → clean up
      if (err.statusCode === 410 || err.statusCode === 404) {
        db.prepare('DELETE FROM subscriptions WHERE id = ?').run(sub.id)
        console.log(`[scheduler] Removed expired subscription ${sub.id.slice(0, 8)}…`)
      } else {
        console.error(`[scheduler] Push failed for ${sub.id.slice(0, 8)}…`, err.message)
      }
    }
  }
}

// Run every 30 minutes
cron.schedule('*/30 * * * *', checkAndSendReminders)
console.log('[scheduler] Push reminder scheduler started (every 30 min, 8–22h)')
