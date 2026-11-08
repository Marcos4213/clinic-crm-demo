export async function hmacSha256Hex(secret, rawBody) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return mismatch === 0
}

export async function verifyHubSignature(rawBody, header, secret) {
  if (!secret) return { ok: false, reason: 'unconfigured' }
  const given = String(header ?? '').trim().toLowerCase()
  if (!given.startsWith('sha256=')) return { ok: false, reason: 'bad_signature' }
  const expected = await hmacSha256Hex(secret, rawBody)
  const presented = given.slice('sha256='.length)
  if (!timingSafeEqual(presented, expected)) return { ok: false, reason: 'bad_signature' }
  return { ok: true }
}
