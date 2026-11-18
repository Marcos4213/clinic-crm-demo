/**
 * Builds the public clinic list for the C4 demo.
 * Reads a CSV with columns id, clinica, cidade, telefone_e164, procedimento.
 * Writes only slug, name, city and procedure. Phone numbers never leave this process.
 *
 * Usage: node scripts/build-clinics.mjs <csv> [out]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { clinicSlug, isExcludedClinic } from '../src/c4/slug.js'

const csvPath = process.argv[2]
const outPath = process.argv[3] || 'src/data/clinics.json'

if (!csvPath) {
  console.error('Informe o caminho do CSV.')
  process.exit(1)
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  const source = text.replace(/^\uFEFF/, '')
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((item) => item.some((cell) => cell.trim()))
}

const rows = parseCsv(readFileSync(csvPath, 'utf8'))
const header = rows[0].map((cell) => cell.trim().toLowerCase())
const nameIndex = header.indexOf('clinica')
const cityIndex = header.indexOf('cidade')
const procedureIndex = header.indexOf('procedimento')
if (nameIndex < 0 || cityIndex < 0 || procedureIndex < 0) {
  console.error('CSV sem as colunas clinica, cidade e procedimento.')
  process.exit(1)
}

const used = new Map()
const clinics = []
let excluded = 0

for (const row of rows.slice(1)) {
  const name = row[nameIndex]?.trim() ?? ''
  const city = row[cityIndex]?.trim() ?? ''
  const procedure = row[procedureIndex]?.trim() ?? ''
  if (!name || !city || !procedure) continue
  if (isExcludedClinic(name)) {
    excluded += 1
    continue
  }
  let slug = clinicSlug(name)
  if (!slug) continue
  const count = used.get(slug) ?? 0
  used.set(slug, count + 1)
  if (count > 0) slug = `${slug}-${count + 1}`
  clinics.push({ slug, name, city, procedure })
}

clinics.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
writeFileSync(outPath, `${JSON.stringify(clinics, null, 2)}\n`)
console.log(`clinics=${clinics.length} excluded=${excluded}`)
