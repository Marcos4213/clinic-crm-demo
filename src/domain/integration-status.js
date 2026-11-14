export function integrationBadge(state) {
  if (state === 'connected') {
    return {
      label: 'Conectado',
      detail: 'O canal recebeu uma mensagem da paciente e está ligado nesta clínica.',
    }
  }
  if (state === 'error') {
    return {
      label: 'Erro',
      detail: 'O cadastro começou, mas a inscrição do WhatsApp na Meta não concluiu. Nada foi marcado como conectado.',
    }
  }
  if (state === 'pending') {
    return {
      label: 'Pendente',
      detail: 'O número foi registrado. A primeira mensagem da paciente confirma o canal. Nada parte sozinho.',
    }
  }
  return {
    label: 'Pendente',
    detail: 'A linha entra pela janela oficial da Meta. Este painel não marca o canal como conectado sem prova de entrega.',
  }
}
