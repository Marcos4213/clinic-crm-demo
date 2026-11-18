import clinics from '../data/clinics.json'
import { cleanLabel } from './slug.js'

const bySlug = new Map(clinics.map((clinic) => [clinic.slug, clinic]))

export function listClinics() {
  return clinics
}

export function findClinic(slug) {
  if (!slug) return null
  return bySlug.get(String(slug).toLowerCase()) ?? null
}

export function clinicFromName(name) {
  const clean = cleanLabel(name, 80)
  if (!clean) return null
  return { slug: '', name: clean, city: '', procedure: '' }
}
