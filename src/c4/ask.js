import { hasPublicConfig, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config.js'
import { C4_MAX_TURNS } from './config.js'
import { scriptedReply, scrubReply } from './script.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function sessionId() {
  const key = 'c4-demo-session'
  const existing = sessionStorage.getItem(key)
  if (existing && UUID.test(existing)) return existing
  const next = crypto.randomUUID()
  sessionStorage.setItem(key, next)
  return next
}

export async function askClinic({ clinic, history, text, session, fetchImpl = fetch, signal }) {
  const turn = history.filter((item) => item.role === 'user').length + 1
  const fallback = () => ({ text: scriptedReply({ clinic, text, turn }), source: 'script' })
  if (turn > C4_MAX_TURNS) return fallback()
  if (!hasPublicConfig()) return fallback()

  const messages = [
    ...history.map((item) => ({ role: item.role, content: item.content })),
    { role: 'user', content: text },
  ]

  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), 35000)
  try {
    const response = await fetchImpl(`${SUPABASE_URL}/functions/v1/demo-chat`, {
      method: 'POST',
      signal: signal ?? timeout.signal,
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        sessionId: session,
        clinicName: clinic?.name ?? '',
        city: clinic?.city ?? '',
        procedure: clinic?.procedure ?? '',
        messages,
      }),
    })
    if (!response.ok) return fallback()
    const data = await response.json()
    const reply = scrubReply(data?.reply)
    if (!reply) return fallback()
    return { text: reply, source: 'ai' }
  } catch {
    return fallback()
  } finally {
    clearTimeout(timer)
  }
}
