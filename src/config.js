export const SITE_URL = 'https://marcos4213.github.io/clinic-crm-demo/'
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

export function hasPublicConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)
}

export function authRedirectUrl(href = window.location.href) {
  const url = new URL(href)
  url.hash = ''
  url.search = ''
  if (url.pathname.endsWith('/index.html')) {
    url.pathname = url.pathname.slice(0, -'index.html'.length)
  }
  if (!url.pathname.endsWith('/')) url.pathname = `${url.pathname}/`
  return url.toString()
}

export function classifyAuthCallback(href) {
  const url = new URL(href)
  if (url.searchParams.has('code')) return 'pkce'
  const hash = url.hash
  if (hash.includes('access_token=') || hash.includes('error=') || hash.includes('error_description=')) return 'implicit'
  return null
}

export function urlAfterAuthCallback(href) {
  const url = new URL(href)
  url.searchParams.delete('code')
  if (url.pathname.endsWith('/index.html')) {
    url.pathname = url.pathname.slice(0, -'index.html'.length)
  }
  url.hash = '#/app'
  const search = url.searchParams.toString()
  return `${url.origin}${url.pathname}${search ? `?${search}` : ''}${url.hash}`
}
