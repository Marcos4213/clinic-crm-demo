export async function readSchemaGuard(supabase) {
  const { data, error } = await supabase.rpc('schema_guard')
  if (error) {
    const missing = error.code === 'PGRST202' || error.code === '42883' || /schema_guard/.test(error.message ?? '')
    return { ok: false, missing, message: error.message ?? 'schema_guard failed' }
  }
  return { ok: data?.ok === true, missing: false, version: data?.version ?? null }
}

export function mapLead(row, messages = []) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    procedure: row.procedure_name ?? '',
    temperature: row.temperature,
    column: row.stage,
    stage: row.stage,
    aiActive: row.ai_active,
    messages: messages.map(mapMessage),
  }
}

export function mapMessage(row) {
  return {
    id: row.id,
    role: row.author_role,
    text: row.body,
    at: row.created_at,
    receipt: null,
    localDemo: true,
    delivery: row.delivery,
    channel: row.channel,
  }
}

export function mapAppointment(row) {
  return {
    id: row.id,
    lead_id: row.lead_id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    status: row.status,
    notes: row.notes ?? '',
  }
}
