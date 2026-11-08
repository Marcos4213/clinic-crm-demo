import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../auth/client'
import { hasPublicConfig } from '../config'
import { AuthContext } from './auth-context'

export function AuthProvider({ children, client = getSupabase() }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(!client)

  useEffect(() => {
    if (!client) return undefined
    let active = true
    client.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setReady(true)
    })
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setReady(true)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [client])

  const value = useMemo(
    () => ({
      client,
      configured: hasPublicConfig(),
      ready,
      session,
      async signIn(email, password) {
        if (!client) return { error: { message: 'Cliente Supabase indisponível neste ambiente.' } }
        return client.auth.signInWithPassword({ email, password })
      },
      async signUp(email, password, emailRedirectTo) {
        if (!client) return { error: { message: 'Cliente Supabase indisponível neste ambiente.' } }
        return client.auth.signUp({ email, password, options: { emailRedirectTo } })
      },
      async signOut() {
        if (!client) return
        await client.auth.signOut()
        setSession(null)
      },
    }),
    [client, ready, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
