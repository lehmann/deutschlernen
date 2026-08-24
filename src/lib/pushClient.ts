const API = '/api/push'

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes.buffer
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

export async function subscribeToPush(
  reg: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  try {
    const res = await fetch(`${API}/vapid-public-key`)
    const { publicKey } = await res.json()
    return reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  } catch {
    return null
  }
}

export async function saveSubscription(sub: PushSubscription): Promise<string | null> {
  try {
    const res = await fetch(`${API}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub.toJSON() }),
    })
    const data = await res.json()
    return data.subscriptionId ?? null
  } catch {
    return null
  }
}

export async function reportSession(subscriptionId: string): Promise<void> {
  try {
    await fetch(`${API}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    })
  } catch {
    // Non-critical — local state already updated
  }
}

export async function removeSubscription(subscriptionId: string): Promise<void> {
  try {
    await fetch(`${API}/subscribe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId }),
    })
  } catch {
    // Best-effort
  }
}
