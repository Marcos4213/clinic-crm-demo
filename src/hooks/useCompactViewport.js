import { useEffect, useState } from 'react'

const QUERY = '(max-width: 1023px)'

export default function useCompactViewport() {
  const [compact, setCompact] = useState(() => window.matchMedia(QUERY).matches)

  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const onChange = () => setCompact(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return compact
}
