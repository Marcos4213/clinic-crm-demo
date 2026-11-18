/**
 * WhatsApp do Marcos para o botão "Marcar 30 minutos".
 * Só dígitos, com DDI (Brasil: 55 + DDD + número).
 * É o mesmo número já usado na apresentação das clínicas.
 * TODO: se o número do C4 for outro, troque apenas esta constante.
 */
export const C4_WHATSAPP_E164 = '5511913221587'

export const C4_SITE = 'https://c4.devbrasil.online/'

export const C4_HOST = 'c4.devbrasil.online'

export function showsClinicDemoAtRoot(hostname) {
  return hostname === C4_HOST
}

export const C4_SLOGAN = 'Do primeiro oi à consulta, nenhum paciente perdido.'

/** Nome da agente. Troque só aqui quando o Marcos escolher outro. */
export const C4_AGENT_NAME = 'Helena'

/** Como a Helena aparece no hero, no chat e no texto alternativo do avatar. */
export const C4_AGENT_LINE = `${C4_AGENT_NAME}, da C4 Clinic`

export const C4_HEADLINE = 'A mensagem chegou. A recepção já tinha fechado.'

export const C4_SUBHEAD =
  'De noite, no fim de semana, quando a paciente para de responder ou marca e não vem: o C4 segura o WhatsApp. A equipe continua no comando.'

export const C4_MAX_TURNS = 15
export const C4_MAX_CHARS = 400
