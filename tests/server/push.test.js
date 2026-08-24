import { describe, it, expect, beforeEach, vi } from 'vitest'
import express from 'express'
import request from 'supertest'

// ── Mocks (hoisted by Vitest before any imports) ───────────────────────────

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}))

// Redirect server/db.js → our in-memory test database
vi.mock('../../server/db.js', async () => {
  return await import('./testDb.js')
})

// ── Env vars (read by the VAPID route) ────────────────────────────────────

process.env.VAPID_PUBLIC_KEY  = 'BTestPublicKeyAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
process.env.VAPID_PRIVATE_KEY = 'testPrivateKeyAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
process.env.VAPID_SUBJECT     = 'mailto:test@example.com'

// ── Dynamic imports (after mocks are registered) ──────────────────────────

const { default: pushRouter } = await import('../../server/push.js')
const { default: testDb }     = await import('./testDb.js')

// ── App under test ────────────────────────────────────────────────────────

const app = express()
app.use(express.json())
app.use('/api/push', pushRouter)

// ── Helpers ───────────────────────────────────────────────────────────────

const validSub = {
  endpoint: 'https://push.example.com/sub/123',
  keys: { p256dh: 'AAAA', auth: 'BBBB' },
}

function cleanDb() {
  testDb.exec('DELETE FROM sessions; DELETE FROM subscriptions; DELETE FROM reminders;')
}

// ── Tests ─────────────────────────────────────────────────────────────────

beforeEach(cleanDb)

describe('GET /api/push/vapid-public-key', () => {
  it('returns the VAPID public key', async () => {
    const res = await request(app).get('/api/push/vapid-public-key')
    expect(res.status).toBe(200)
    expect(res.body.publicKey).toBe(process.env.VAPID_PUBLIC_KEY)
  })
})

describe('POST /api/push/subscribe', () => {
  it('creates a subscription and returns a subscriptionId', async () => {
    const res = await request(app)
      .post('/api/push/subscribe')
      .send({ subscription: validSub })
    expect(res.status).toBe(200)
    expect(res.body.subscriptionId).toBeTruthy()
    expect(typeof res.body.subscriptionId).toBe('string')
  })

  it('returns the same id for the same endpoint (upsert)', async () => {
    const r1 = await request(app).post('/api/push/subscribe').send({ subscription: validSub })
    const r2 = await request(app).post('/api/push/subscribe').send({ subscription: validSub })
    expect(r1.body.subscriptionId).toBe(r2.body.subscriptionId)
  })

  it('stores the subscription in the database', async () => {
    await request(app).post('/api/push/subscribe').send({ subscription: validSub })
    const row = testDb.prepare('SELECT * FROM subscriptions WHERE endpoint = ?').get(validSub.endpoint)
    expect(row).toBeTruthy()
    expect(JSON.parse(row.sub_json).endpoint).toBe(validSub.endpoint)
  })

  it('returns 400 for missing endpoint', async () => {
    const res = await request(app)
      .post('/api/push/subscribe')
      .send({ subscription: { keys: {} } })
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty body', async () => {
    const res = await request(app).post('/api/push/subscribe').send({})
    expect(res.status).toBe(400)
  })
})

describe('POST /api/push/session', () => {
  it('records a session for a known subscriptionId', async () => {
    const { body: { subscriptionId } } = await request(app)
      .post('/api/push/subscribe')
      .send({ subscription: validSub })

    const res = await request(app).post('/api/push/session').send({ subscriptionId })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const count = testDb
      .prepare('SELECT COUNT(*) AS n FROM sessions WHERE subscription_id = ?')
      .get(subscriptionId).n
    expect(count).toBe(1)
  })

  it('returns 400 when subscriptionId is missing', async () => {
    const res = await request(app).post('/api/push/session').send({})
    expect(res.status).toBe(400)
  })

  it('returns 404 for an unknown subscriptionId', async () => {
    const res = await request(app)
      .post('/api/push/session')
      .send({ subscriptionId: 'nonexistent-uuid' })
    expect(res.status).toBe(404)
  })

  it('accumulates multiple sessions for the same subscription', async () => {
    const { body: { subscriptionId } } = await request(app)
      .post('/api/push/subscribe')
      .send({ subscription: validSub })

    await request(app).post('/api/push/session').send({ subscriptionId })
    await request(app).post('/api/push/session').send({ subscriptionId })

    const count = testDb
      .prepare('SELECT COUNT(*) AS n FROM sessions WHERE subscription_id = ?')
      .get(subscriptionId).n
    expect(count).toBe(2)
  })
})

describe('DELETE /api/push/subscribe', () => {
  it('removes the subscription', async () => {
    const { body: { subscriptionId } } = await request(app)
      .post('/api/push/subscribe')
      .send({ subscription: validSub })

    const res = await request(app).delete('/api/push/subscribe').send({ subscriptionId })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)

    const row = testDb.prepare('SELECT id FROM subscriptions WHERE id = ?').get(subscriptionId)
    expect(row).toBeUndefined()
  })

  it('returns 400 when subscriptionId is missing', async () => {
    const res = await request(app).delete('/api/push/subscribe').send({})
    expect(res.status).toBe(400)
  })

  it('is idempotent — deleting twice does not throw', async () => {
    const { body: { subscriptionId } } = await request(app)
      .post('/api/push/subscribe')
      .send({ subscription: validSub })

    await request(app).delete('/api/push/subscribe').send({ subscriptionId })
    const res = await request(app).delete('/api/push/subscribe').send({ subscriptionId })
    expect(res.status).toBe(200)
  })
})
