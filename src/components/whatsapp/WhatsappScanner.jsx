import { useEffect, useId, useRef, useState } from 'react'
import { readWhatsappQr } from '../../domain/whatsapp-qr'

export function WhatsappScanner({ onScan }) {
  const fileId = useId()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const onScanRef = useRef(onScan)
  const [live, setLive] = useState(false)
  const [hint, setHint] = useState('')

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  function stop() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setLive(false)
  }

  useEffect(() => stop, [])

  useEffect(() => {
    if (!live || !videoRef.current || !streamRef.current) return undefined
    const video = videoRef.current
    video.srcObject = streamRef.current
    let stopped = false
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
    video.play?.()?.catch(() => {})
    let timer
    async function tick() {
      if (stopped) return
      try {
        const codes = await detector.detect(video)
        const raw = codes[0]?.rawValue
        if (raw) {
          const parsed = readWhatsappQr(raw)
          if (!parsed) setHint('Esse QR não é do WhatsApp.')
          else {
            stopped = true
            stop()
            onScanRef.current?.(parsed.href)
            return
          }
        }
      } catch {
        // The camera frame is not ready yet.
      }
      timer = window.setTimeout(tick, 250)
    }
    timer = window.setTimeout(tick, 300)
    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [live])

  async function start() {
    setHint('')
    if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
      setHint('Neste navegador, envie a foto do QR.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setLive(true)
    } catch {
      setHint('A câmera não abriu. Envie a foto do QR.')
    }
  }

  async function onFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!window.BarcodeDetector) {
      setHint('Este navegador não lê a foto do QR.')
      return
    }
    try {
      const bitmap = await createImageBitmap(file)
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      const codes = await detector.detect(bitmap)
      bitmap.close?.()
      const parsed = readWhatsappQr(codes[0]?.rawValue)
      if (!parsed) {
        setHint('Esse QR não é do WhatsApp.')
        return
      }
      setHint('')
      onScanRef.current?.(parsed.href)
    } catch {
      setHint('Não foi possível ler essa foto.')
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <button type="button" onClick={start} className="h-10 rounded-lg bg-emerald px-4 text-[13px] font-semibold text-[#080F1C]">
        Escanear QR do WhatsApp
      </button>
      <label className="block text-[12px] font-semibold text-muted" htmlFor={fileId}>
        Enviar foto do QR
        <input id={fileId} type="file" accept="image/*" onChange={onFile} className="mt-1 block w-full text-[13px] text-ink" />
      </label>
      {live && (
        <div>
          <video ref={videoRef} muted playsInline aria-label="Câmera para o QR do WhatsApp" className="aspect-square w-full max-w-xs rounded-xl bg-black object-cover" />
          <button type="button" onClick={stop} className="mt-2 h-9 rounded-lg border border-line px-3 text-[13px] font-semibold text-ink">
            Fechar câmera
          </button>
        </div>
      )}
      {hint && <p className="text-[13px] text-muted">{hint}</p>}
    </div>
  )
}
