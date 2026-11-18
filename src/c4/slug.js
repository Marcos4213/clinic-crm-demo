const EXCLUDED = ['la vie clinic', 'instituto aurea']

export function fold(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function clinicSlug(name) {
  const slug = fold(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug.slice(0, 80).replace(/-+$/g, '')
}

export function isExcludedClinic(name) {
  const folded = fold(name)
  return EXCLUDED.some((item) => folded === item || folded.startsWith(`${item} `))
}

export function cleanLabel(value, max = 80) {
  const text = String(value ?? '')
    .replace(/[\p{Cc}\p{Cf}<>]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!/\p{L}/u.test(text)) return ''
  return [...text].slice(0, max).join('').trim()
}
