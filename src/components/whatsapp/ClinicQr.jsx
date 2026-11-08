import { useEffect, useRef, useState } from 'react'

const IMAGE = /^data:image\/(?:png|svg\+xml);base64,[A-Za-z0-9+/=]+$/

export function ClinicQr({ onLoad }) {
  const onLoadRef = useRef(onLoad)
  const [image, setImage] = useState('')
  const [hint, setHint] = useState('')
  const [pending, setPending] = useState(true)

  useEffect(() => {
    onLoadRef.current = onLoad
  }, [onLoad])

  async function load() {
    setPending(true)
    setHint('')
    try {
      const result = await onLoadRef.current?.()
      if (IMAGE.test(result?.image ?? '')) {
        setImage(result.image)
        setHint('')
      } else {
        setImage('')
        setHint(result?.error === 'forbidden' ? 'A linha ainda não está disponível nesta clínica.' : 'O QR não abriu. Tente de novo.')
      }
    } catch {
      setImage('')
      setHint('O QR não abriu. Tente de novo.')
    } finally {
      setPending(false)
    }
  }

  useEffect(() => {
    let cancel = false
    onLoadRef.current?.()
      .then((result) => {
        if (cancel) return
        if (IMAGE.test(result?.image ?? '')) setImage(result.image)
        else setHint(result?.error === 'forbidden' ? 'A linha ainda não está disponível nesta clínica.' : 'O QR não abriu. Tente de novo.')
      })
      .catch(() => {
        if (!cancel) setHint('O QR não abriu. Tente de novo.')
      })
      .finally(() => {
        if (!cancel) setPending(false)
      })
    return () => {
      cancel = true
    }
  }, [])

  return (
    <div className="mt-4">
      <p className="max-w-xl text-[13px] leading-5 text-muted">No celular, abra o WhatsApp e aponte a câmera para este código.</p>
      {image && (
        <div className="mt-3 inline-block rounded-2xl bg-white p-4">
          <img src={image} width={280} height={280} alt="QR Code do WhatsApp da clínica" className="h-[280px] w-[280px]" />
        </div>
      )}
      {pending && !image && <p className="mt-3 text-[13px] text-muted">Abrindo o QR…</p>}
      {hint && <p className="mt-3 text-[13px] text-muted">{hint}</p>}
      <button type="button" onClick={load} className="mt-3 h-10 rounded-lg bg-emerald px-4 text-[13px] font-semibold text-[#080F1C]">
        Mostrar QR do WhatsApp
      </button>
    </div>
  )
}
