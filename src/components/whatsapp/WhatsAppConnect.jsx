import { useState } from 'react'

export function WhatsAppConnect({ config, pending = false, onConnect }) {
  const [pin, setPin] = useState('')
  if (config?.ready === false) {
    return <p className="mt-3 text-[13px] text-muted">Carregando a conexão do WhatsApp.</p>
  }
  if (!config?.configured) {
    return (
      <p className="mt-3 max-w-xl text-[13px] leading-5 text-muted">
        A conexão do WhatsApp ainda não está liberada neste painel. Nada foi marcado como conectado.
      </p>
    )
  }
  return (
    <div className="mt-4">
      <p className="max-w-xl text-[13px] leading-5 text-muted">
        A primeira tela é a do Facebook. Depois escolha o WhatsApp que já está no celular. Quando o QR aparecer, abra o WhatsApp Business, toque em Aparelhos conectados e escaneie esse QR. Isso é o que liga o aplicativo.
      </p>
      <label className="mt-3 block max-w-xs text-[12px] font-semibold text-muted" htmlFor="wa-pin">
        PIN de duas etapas (opcional, 6 dígitos)
        <input
          id="wa-pin"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
          className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-ink"
        />
      </label>
      <button type="button" onClick={() => onConnect?.(pin)} disabled={pending} className="mt-4 h-12 rounded-xl bg-emerald px-5 text-[15px] font-semibold text-[#080F1C] disabled:opacity-50">
        {pending ? 'Abrindo a Meta…' : 'Conectar WhatsApp'}
      </button>
    </div>
  )
}
