import { useEffect, useRef, useState } from 'react'
import { embeddedSignupOptions, readSignupSession } from '../domain/embedded-signup'

function loadFacebookSdk(appId) {
  if (window.FB) {
    window.FB.init({ appId, cookie: false, xfbml: false, version: 'v27.0' })
    return Promise.resolve(window.FB)
  }
  return new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB.init({ appId, cookie: false, xfbml: false, version: 'v27.0' })
      resolve(window.FB)
    }
    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/pt_BR/sdk.js'
    script.async = true
    script.onerror = () => reject(new Error('sdk'))
    document.body.appendChild(script)
  })
}

export function useWhatsappSignup(client, clinicId) {
  const [config, setConfig] = useState({ configured: false, connected: false, ready: false })
  const [pending, setPending] = useState(false)
  const [signupNotice, setSignupNotice] = useState('')
  const [revision, setRevision] = useState(0)
  const sessionRef = useRef(null)
  const codeRef = useRef('')
  const clientRef = useRef(client)
  const clinicRef = useRef(clinicId)

  useEffect(() => {
    clientRef.current = client
    clinicRef.current = clinicId
  }, [client, clinicId])

  useEffect(() => {
    if (!client) return undefined
    let cancel = false
    client.functions.invoke('whatsapp-onboard', { method: 'GET' }).then(({ data, error }) => {
      if (cancel) return
      if (error || !data) {
        setConfig({ configured: false, connected: false, ready: true })
        return
      }
      setConfig({ ...data, configured: data.configured === true, connected: false, ready: true })
    }).catch(() => {
      if (!cancel) setConfig({ configured: false, connected: false, ready: true })
    })
    return () => {
      cancel = true
    }
  }, [client])

  async function finish(session, code) {
    const current = clientRef.current
    const clinic = clinicRef.current
    if (!current || !clinic) return
    setPending(true)
    const { data, error } = await current.functions.invoke('whatsapp-onboard', {
      body: {
        clinicId: clinic,
        code,
        phoneNumberId: session.phoneNumberId,
        wabaId: session.wabaId,
        event: session.event,
      },
    })
    setPending(false)
    if (data?.error === 'webhook_subscribe_failed') {
      setSignupNotice('A Meta recebeu o cadastro, mas o webhook não foi assinado. A linha não está conectada.')
      return
    }
    if (error || data?.stored !== true) {
      setSignupNotice('O cadastro não foi concluído. A linha não foi marcada como conectada.')
      return
    }
    setSignupNotice('Cadastro recebido. A linha ainda não tem prova de entrega.')
    setRevision((value) => value + 1)
  }

  useEffect(() => {
    function onMessage(event) {
      const session = readSignupSession(event.data, event.origin)
      if (!session) return
      sessionRef.current = session
      if (session.done && codeRef.current) finish(session, codeRef.current)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  async function onConnect() {
    if (!config.configured) return
    setSignupNotice('')
    try {
      const fb = await loadFacebookSdk(config.appId)
      const code = await new Promise((resolve, reject) => {
        if (!fb?.login) {
          reject(new Error('sdk'))
          return
        }
        fb.login((response) => resolve(response?.authResponse?.code ?? ''), embeddedSignupOptions(config))
      })
      if (!code) {
        setSignupNotice('A janela da Meta foi fechada. Nada foi marcado como conectado.')
        return
      }
      codeRef.current = code
      if (sessionRef.current?.done) finish(sessionRef.current, code)
    } catch {
      setSignupNotice('A janela da Meta não abriu. Nada foi marcado como conectado.')
    }
  }

  return { config, pending, signupNotice, onConnect, revision }
}
