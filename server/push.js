import { Router } from 'express'
import webpush from 'web-push'
import { randomUUID } from 'crypto'
import db from './db.js'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
)

export { webpush }

const router = Router()

// Expose public key so the frontend can subscribe
router.get('/vapid-public-key', (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
})

// Register a push subscription
router.post('/subscribe', (req, res) => {
  const { subscription } = req.body
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid subscription' })

  const existing = db
    .prepare('SELECT id FROM subscriptions WHERE endpoint = ?')
    .get(subscription.endpoint)

  if (existing) return res.json({ subscriptionId: existing.id })

  const id = randomUUID()
  db.prepare('INSERT INTO subscriptions (id, endpoint, sub_json) VALUES (?, ?, ?)').run(
    id,
    subscription.endpoint,
    JSON.stringify(subscription),
  )
  res.json({ subscriptionId: id })
})

// Record a completed review session
router.post('/session', (req, res) => {
  const { subscriptionId } = req.body
  if (!subscriptionId) return res.status(400).json({ error: 'Missing subscriptionId' })

  const sub = db.prepare('SELECT id FROM subscriptions WHERE id = ?').get(subscriptionId)
  if (!sub) return res.status(404).json({ error: 'Subscription not found' })

  const now = Math.floor(Date.now() / 1000)
  db.prepare('INSERT INTO sessions (subscription_id, completed_at) VALUES (?, ?)').run(
    subscriptionId,
    now,
  )
  res.json({ ok: true })
})

// Unsubscribe (user declined or revoked)
router.delete('/subscribe', (req, res) => {
  const { subscriptionId } = req.body
  if (!subscriptionId) return res.status(400).json({ error: 'Missing subscriptionId' })
  db.prepare('DELETE FROM subscriptions WHERE id = ?').run(subscriptionId)
  res.json({ ok: true })
})

export default router
