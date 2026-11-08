export async function requestClinicQr(client, clinicId) {
  if (!client || !clinicId) return { error: 'forbidden' }
  const { data, error } = await client.functions.invoke('whatsapp-send', {
    body: { intent: 'qr', clinicId },
  })
  if (error || !data || typeof data !== 'object') return null
  return data
}
