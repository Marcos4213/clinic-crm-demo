// Embedded Signup with a fixed redirect_uri. The JS SDK popup binds the code to an
// internal redirect_uri that Meta then rejects (100/36008), so we open the OAuth
// dialog ourselves and exchange the code with this exact, whitelisted callback URL.
export const META_CALLBACK_FILE = 'meta-callback.html'

export function metaRedirectUri(origin, base = '/') {
  const path = base.endsWith('/') ? base : `${base}/`
  return `${origin}${path}${META_CALLBACK_FILE}`
}

export function buildMetaDialogUrl(config, redirectUri, state, version = 'v27.0') {
  const url = new URL(`https://www.facebook.com/${version}/dialog/oauth`)
  url.searchParams.set('client_id', config.appId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('config_id', config.configId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('override_default_response_type', 'true')
  url.searchParams.set('state', state)
  url.searchParams.set('extras', JSON.stringify({
    setup: {},
    featureType: 'whatsapp_business_app_onboarding',
    sessionInfoVersion: '3',
  }))
  return url.toString()
}

export function readCallbackMessage(event, expectedOrigin, state) {
  if (event.origin !== expectedOrigin) return null
  const data = event.data
  if (!data || data.type !== 'META_OAUTH_CALLBACK' || data.state !== state) return null
  return { code: typeof data.code === 'string' ? data.code : '', error: data.error || '' }
}

export function openMetaSignup(config) {
  const origin = window.location.origin
  const redirectUri = metaRedirectUri(origin, import.meta.env?.BASE_URL || '/')
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36)
  const popup = window.open(buildMetaDialogUrl(config, redirectUri, state), 'meta_signup', 'width=640,height=820')
  if (!popup) return Promise.reject(new Error('popup'))
  return new Promise((resolve) => {
    let done = false
    const finish = (code) => {
      if (done) return
      done = true
      window.removeEventListener('message', onMessage)
      clearInterval(timer)
      resolve({ code, redirectUri })
    }
    function onMessage(event) {
      const result = readCallbackMessage(event, origin, state)
      if (result) finish(result.code)
    }
    window.addEventListener('message', onMessage)
    const timer = setInterval(() => {
      if (popup.closed) setTimeout(() => finish(''), 500)
    }, 400)
  })
}
