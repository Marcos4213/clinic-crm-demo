import { plantaoHref } from './config.js'

const href = plantaoHref()
for (const link of document.querySelectorAll('[data-cta]')) {
  if (href) link.setAttribute('href', href)
}
