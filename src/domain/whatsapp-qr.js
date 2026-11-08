const PHONE = /^[0-9]{8,15}$/
const CODE = /^[A-Za-z0-9]{4,64}$/

function allowedHost(url) {
  const host = url.hostname.replace(/^www\./, '')
  return host === 'wa.me' || host === 'api.whatsapp.com' || host === 'whatsapp.com' || host === 'chat.whatsapp.com'
}

export function whatsappLabel(href) {
  const phone = String(href ?? '').match(/^https:\/\/wa\.me\/(\d{8,15})$/)
  if (phone) return `Número lido: +${phone[1]}`
  if (href) return 'QR do WhatsApp lido.'
  return ''
}

export function readWhatsappQr(raw) {
  const text = String(raw ?? '').trim()
  if (!text || text.length > 300) return null
  let url
  try {
    url = new URL(text)
  } catch {
    return null
  }
  if (url.username || url.password || url.hash) return null
  const protocol = url.protocol
  if (protocol !== 'https:' && protocol !== 'whatsapp:') return null
  if (protocol === 'https:' && !allowedHost(url)) return null
  if (protocol === 'whatsapp:' && url.hostname !== 'send') return null
  const keys = [...url.searchParams.keys()]

  const fromQuery = (url.searchParams.get('phone') ?? '').replace(/\D/g, '')
  if (keys.length > 0) {
    if (keys.length !== 1 || keys[0] !== 'phone' || !PHONE.test(fromQuery)) return null
    return { href: `https://wa.me/${fromQuery}` }
  }

  if (url.hostname.replace(/^www\./, '') !== 'wa.me') return null
  const [head, value] = url.pathname.split('/').filter(Boolean)
  if (!value && PHONE.test(head ?? '')) return { href: `https://wa.me/${head}` }
  if ((head === 'qr' || head === 'message') && CODE.test(value ?? '') && url.pathname === `/${head}/${value}`) {
    return { href: `https://wa.me/${head}/${value}` }
  }
  return null
}
