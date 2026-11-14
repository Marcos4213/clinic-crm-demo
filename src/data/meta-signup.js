import { useEffect, useRef, useState } from 'react'
import { embeddedSignupOptions, readSignupSession } from '../domain/embedded-signup'

export function signupFailureMessage(payload, catalog, fallback) {
  const base = catalog[payload?.error] || fallback
  const step = typeof payload?.step === 'string' && payload.step ? payload.step : ''
  let code = ''
  if (payload?.metaCode != null && payload.metaCode !== '') {
    code = `código ${payload.metaCode}`
    if (payload.metaSubcode != null && payload.metaSubcode !== '') code += `/${payload.metaSubcode}`
  }
  const detail = [step, code].filter(Boolean).join(', ')
  return detail ? `${base} (${detail})` : base
}

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
  const finishingRef = useRef(false)
  const pinRef = useRef('')
  const clientRef = useRef(client)
  const clinicRef = useRef(clinicId)

  useEffect(() => {
    clientRef.current = client
    clinicRef.current = clinicId
  }, [client, clinicId])

  useEffect(() => {
    if (!client) return undefined
    let cancel = false
    const headers = clinicId ? { 'x-clinic-id': clinicId } : undefined
    client.functions.invoke('whatsapp-onboard', { method: 'GET', headers }).then(({ data, error }) => {
      if (cancel) return
      if (error || !data) {
        setConfig({ configured: false, connected: false, ready: true })
        return
      }
      setConfig({
        ...data,
        configured: data.configured === true,
        connected: data.connected === true || data.diagnostics?.state === 'connected',
        ready: true,
      })
    }).catch(() => {
      if (!cancel) setConfig({ configured: false, connected: false, ready: true })
    })
    return () => {
      cancel = true
    }
  }, [client, clinicId])

  function waitForSession() {
    const ready = sessionRef.current
    if (ready?.done || ready?.cancelled || ready?.wabaId) return Promise.resolve(ready)
    return new Promise((resolve) => {
      const started = Date.now()
      const timer = setInterval(() => {
        const session = sessionRef.current
        if (session?.done || session?.cancelled || session?.wabaId || Date.now() - started >= 3000) {
          clearInterval(timer)
          resolve(session)
        }
      }, 100)
    })
  }

  async function finish(session, code, pin = '') {
    if (finishingRef.current) return
    const current = clientRef.current
    const clinic = clinicRef.current
    if (!current || !clinic || !code) return
    finishingRef.current = true
    setPending(true)
    const { data, error } = await current.functions.invoke('whatsapp-onboard', {
      body: {
        clinicId: clinic,
        code,
        phoneNumberId: session?.phoneNumberId || '',
        wabaId: session?.wabaId || '',
        event: session?.event || 'CODE_ONLY',
        pin: /^[0-9]{6}$/.test(String(pin ?? '')) ? String(pin) : '',
      },
    })
    let payload = data
    if ((!payload || payload.error) && error?.context && typeof error.context.json === 'function') {
      payload = await error.context.json().catch(() => payload)
    }
    setPending(false)
    const failure = {
      webhook_subscribe_failed: 'A Meta recebeu o cadastro, mas o aviso de mensagens não foi assinado. A linha não está conectada.',
      number_not_returned: 'O Facebook entrou, mas a Meta não devolveu o WhatsApp do celular. Escolha o número que já está no aplicativo e escaneie o QR.',
      multiple_numbers: 'A Meta mostrou mais de um número. Escolha só o WhatsApp da clínica e tente de novo.',
      signup_incomplete: 'A Meta não concluiu o WhatsApp. Nada foi marcado como conectado.',
      token_expired: 'O código da Meta expirou. Toque em Conectar WhatsApp de novo.',
      upstream: 'A Meta não autorizou o número. Nada foi marcado como conectado.',
      persist_failed: 'O cadastro não foi gravado. Nada foi marcado como conectado.',
    }
    if (payload?.error === 'webhook_subscribe_failed') {
      setSignupNotice(signupFailureMessage(payload, failure, failure.webhook_subscribe_failed))
      setRevision((value) => value + 1)
      return
    }
    if (error || payload?.stored !== true) {
      finishingRef.current = false
      setSignupNotice(
        signupFailureMessage(
          payload,
          failure,
          'O cadastro não foi concluído. A linha não foi marcada como conectada.',
        ),
      )
      return
    }
    setSignupNotice('Cadastro recebido. Peça à paciente que mande um oi para este WhatsApp e responda em Conversas.')
    setRevision((value) => value + 1)
  }

  useEffect(() => {
    function onMessage(event) {
      const session = readSignupSession(event.data, event.origin)
      if (!session) return
      sessionRef.current = session
      if ((session.done || session.wabaId) && codeRef.current) finish(session, codeRef.current, pinRef.current)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  async function onConnect(pin = '') {
    if (!config.configured) return
    finishingRef.current = false
    sessionRef.current = null
    codeRef.current = ''
    pinRef.current = /^[0-9]{6}$/.test(String(pin ?? '')) ? String(pin) : ''
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
        setSignupNotice('A janela da Meta foi fechada antes de ligar o WhatsApp do celular.')
        return
      }
      codeRef.current = code
      const session = await waitForSession()
      if (session?.cancelled && !session?.wabaId) {
        setSignupNotice('A Meta cancelou antes de ligar o WhatsApp do celular.')
        return
      }
      finish(session, code, pinRef.current)
    } catch {
      setSignupNotice('A janela da Meta não abriu. Nada foi marcado como conectado.')
    }
  }

  return { config, pending, signupNotice, onConnect, revision }
}
