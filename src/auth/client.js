import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, classifyAuthCallback, hasPublicConfig, urlAfterAuthCallback } from '../config.js'

let client

export function getSupabase() {
  if (!hasPublicConfig()) return null
  if (import.meta.env.MODE === 'test') return null
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }
  return client
}

export async function prepareAuth(supabase = getSupabase(), href = window.location.href) {
  const kind = classifyAuthCallback(href)
  if (!kind || !supabase) return kind
  if (kind === 'pkce') {
    const code = new URL(href).searchParams.get('code')
    if (code) await supabase.auth.exchangeCodeForSession(code)
  } else {
    await supabase.auth.getSession()
  }
  window.history.replaceState(null, '', urlAfterAuthCallback(href))
  return kind
}
