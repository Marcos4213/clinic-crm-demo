import { useId } from 'react'

export function WhatsAppMark({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <path
        fill="#fff"
        d="M16.2 7.4a8.5 8.5 0 0 0-7.3 12.8L8.2 24.6l4.6-1.2a8.5 8.5 0 1 0 3.4-16Zm5 12.4c-.2.6-1.2 1.1-1.6 1.1-.4.1-1 .1-1.5-.1-.4-.1-.8-.3-1.4-.5-2.3-1-3.8-3.3-3.9-3.5-.1-.2-.9-1.2-.9-2.4s.6-1.7.8-1.9c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .5.4.2.6.7 1.9.8 2 .1.2.1.3 0 .5l-.5.6c-.1.2-.3.3-.1.6.2.3.8 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.3.2.1.4.1.6-.1.2-.2.7-.8.9-1.1.2-.3.3-.2.6-.1.2.1 1.5.7 1.8.9.2.1.4.2.5.3.1.3 0 .9-.2 1.4Z"
      />
    </svg>
  )
}

export function InstagramMark({ className = 'h-7 w-7' }) {
  const id = useId()
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="30%" cy="110%" r="130%">
          <stop offset="0%" stopColor="#feda75" />
          <stop offset="28%" stopColor="#fa7e1e" />
          <stop offset="52%" stopColor="#d62976" />
          <stop offset="76%" stopColor="#962fbf" />
          <stop offset="100%" stopColor="#4f5bd5" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <rect x="8" y="8" width="16" height="16" rx="5" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="3.6" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="21.4" cy="10.6" r="1.1" fill="#fff" />
    </svg>
  )
}

export function ProductMark({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="10" y="3" width="4" height="18" rx="1" fill="#E7EEF6" />
      <rect x="3" y="10" width="18" height="4" rx="1" fill="#34D399" />
    </svg>
  )
}
