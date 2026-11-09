export function WhatsAppConnect({ config, pending = false, onConnect }) {
  if (!config?.configured) {
    return (
      <p className="mt-3 max-w-xl text-[13px] leading-5 text-muted">
        Falta o config_id do Embedded Signup. No app da Meta, crie a configuração de Facebook Login for Business do WhatsApp e grave esse ID no segredo EMBEDDED_SIGNUP_CONFIG_ID, junto com WHATSAPP_APP_ID. Este painel não mostra um QR e não marca a linha como conectada.
      </p>
    )
  }
  return (
    <div className="mt-3">
      <p className="max-w-xl text-[13px] leading-5 text-muted">
        A primeira tela é a do Facebook, porque a conta comercial do WhatsApp fica nela. Depois ela pede o número da clínica. O token fica só no servidor. Uma mensagem recebida é a prova de que a linha entrou.
      </p>
      <button type="button" onClick={onConnect} disabled={pending} className="mt-3 h-10 rounded-lg bg-emerald px-4 text-[13px] font-semibold text-[#080F1C] disabled:opacity-50">
        Conectar WhatsApp
      </button>
    </div>
  )
}
