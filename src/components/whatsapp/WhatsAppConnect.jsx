export function WhatsAppConnect({ config, pending = false, onConnect }) {
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
        Toque no botão e continue até a Meta pedir o número da clínica. A primeira tela é a do Facebook. Uma mensagem recebida é a prova de que a linha entrou.
      </p>
      <button type="button" onClick={onConnect} disabled={pending} className="mt-4 h-12 rounded-xl bg-emerald px-5 text-[15px] font-semibold text-[#080F1C] disabled:opacity-50">
        {pending ? 'Abrindo a Meta…' : 'Conectar WhatsApp'}
      </button>
    </div>
  )
}
