import { useMemo, useState } from 'react'
import { DEAL_TYPES, PROPERTY_STATUSES, PROPERTY_TYPES, filterProperties, formatPropertyPrice, nextPropertyCode, priceRangesFor, propertyRegions, propertyStatusLabel, propertyTypeLabel } from '../domain/properties'
import { useCrm } from '../state/useCrm'

const EMPTY = {
  code: '',
  title: '',
  dealType: 'venda',
  propertyType: 'apartamento',
  region: '',
  price: '',
  bedrooms: 2,
  area: '',
  status: 'disponivel',
  details: '',
}

function Badge({ status, dealType }) {
  const tone = status === 'disponivel' ? 'bg-emerald/15 text-emerald' : status === 'reservado' ? 'bg-white/10 text-[#D6E4F5]' : 'bg-white/5 text-muted'
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase ${tone}`}>{propertyStatusLabel(status, dealType)}</span>
}

function PropertyForm({ initial, codeSuggestion, onCancel, onSave }) {
  const [form, setForm] = useState({
    ...EMPTY,
    ...initial,
    code: initial?.code || codeSuggestion,
    price: initial?.price ?? '',
    bedrooms: initial?.bedrooms ?? 2,
    area: initial?.area ?? '',
  })

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <form
      className="surface-card p-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({
          ...form,
          id: initial?.id,
          photo: initial?.photo || '/imoveis/im-generic.svg',
          price: Number(String(form.price).replace(',', '.')),
          bedrooms: Number(form.bedrooms),
          area: form.area === '' ? null : Number(form.area),
        })
      }}
    >
      <h2 className="text-[16px] font-semibold">{initial?.id ? 'Editar imóvel' : 'Novo imóvel'}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-[12px] font-semibold text-muted">
          Código
          <input required value={form.code} onChange={(event) => set('code', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-ink" />
        </label>
        <label className="text-[12px] font-semibold text-muted">
          Status
          <select value={form.status} onChange={(event) => set('status', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-ink">
            {PROPERTY_STATUSES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="text-[12px] font-semibold text-muted sm:col-span-2">
          Título
          <input required minLength={2} value={form.title} onChange={(event) => set('title', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-ink" />
        </label>
        <label className="text-[12px] font-semibold text-muted">
          Operação
          <select value={form.dealType} onChange={(event) => set('dealType', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-ink">
            {DEAL_TYPES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="text-[12px] font-semibold text-muted">
          Tipo
          <select value={form.propertyType} onChange={(event) => set('propertyType', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-ink">
            {PROPERTY_TYPES.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
        <label className="text-[12px] font-semibold text-muted">
          Região
          <input required minLength={2} value={form.region} onChange={(event) => set('region', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-ink" />
        </label>
        <label className="text-[12px] font-semibold text-muted">
          Valor
          <input required type="number" min="1" step="1" value={form.price} onChange={(event) => set('price', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-ink" />
        </label>
        <label className="text-[12px] font-semibold text-muted">
          Dormitórios
          <input type="number" min="0" max="20" value={form.bedrooms} onChange={(event) => set('bedrooms', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-ink" />
        </label>
        <label className="text-[12px] font-semibold text-muted">
          Área (m²)
          <input type="number" min="10" value={form.area} onChange={(event) => set('area', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-canvas px-3 text-[13px] font-medium text-ink" />
        </label>
        <label className="text-[12px] font-semibold text-muted sm:col-span-2">
          Detalhes
          <textarea value={form.details} onChange={(event) => set('details', event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] text-ink" />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" className="h-9 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-navy-950">
          Gravar imóvel
        </button>
        <button type="button" onClick={onCancel} className="h-9 rounded-lg border border-line px-3 text-[12.5px] font-semibold text-ink">
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default function Imoveis() {
  const crm = useCrm()
  const demo = crm.mode === 'demo'
  const properties = crm.properties ?? []
  const [filters, setFilters] = useState({ dealType: '', type: '', region: '', rangeId: '', bedrooms: '', query: '' })
  const [editing, setEditing] = useState(null)
  const visible = useMemo(() => filterProperties(properties, filters), [properties, filters])
  const regions = propertyRegions(properties)
  const ranges = priceRangesFor(filters.dealType)

  function setFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value, ...(field === 'dealType' ? { rangeId: '' } : {}) }))
  }

  if (editing) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
        <div className="mx-auto max-w-3xl pb-24">
          <PropertyForm
            initial={editing === 'new' ? { ...EMPTY, code: nextPropertyCode(properties) } : editing}
            codeSuggestion={nextPropertyCode(properties)}
            onCancel={() => setEditing(null)}
            onSave={(payload) => {
              const result = crm.saveProperty?.(payload)
              if (!result?.error) setEditing(null)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 pb-24">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight sm:text-[28px]">Imóveis</h1>
            <p className="mt-1 text-[13px] text-muted">{visible.length} {visible.length === 1 ? 'imóvel' : 'imóveis'}</p>
          </div>
          {demo && (
            <button type="button" onClick={() => setEditing('new')} className="h-9 rounded-lg bg-emerald px-3 text-[12.5px] font-semibold text-navy-950">
              Novo imóvel
            </button>
          )}
        </header>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <label className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Operação
            <select aria-label="Filtrar por operação" value={filters.dealType} onChange={(event) => setFilter('dealType', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-2 text-[13px] font-medium normal-case tracking-normal text-ink">
              <option value="">Todas</option>
              {DEAL_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Tipo
            <select aria-label="Filtrar por tipo" value={filters.type} onChange={(event) => setFilter('type', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-2 text-[13px] font-medium normal-case tracking-normal text-ink">
              <option value="">Todos</option>
              {PROPERTY_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Região
            <select aria-label="Filtrar por região" value={filters.region} onChange={(event) => setFilter('region', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-2 text-[13px] font-medium normal-case tracking-normal text-ink">
              <option value="">Todas</option>
              {regions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Faixa
            <select aria-label="Filtrar por faixa de valor" value={filters.rangeId} onChange={(event) => setFilter('rangeId', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-2 text-[13px] font-medium normal-case tracking-normal text-ink">
              <option value="">Todas</option>
              {ranges.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Dormitórios
            <select aria-label="Filtrar por dormitórios" value={filters.bedrooms} onChange={(event) => setFilter('bedrooms', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-2 text-[13px] font-medium normal-case tracking-normal text-ink">
              <option value="">Todos</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4+">4+</option>
            </select>
          </label>
          <label className="text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
            Busca
            <input aria-label="Buscar imóvel" value={filters.query} onChange={(event) => setFilter('query', event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-[13px] font-medium normal-case tracking-normal text-ink" />
          </label>
        </div>

        {properties.length === 0 ? (
          <p className="surface-card px-4 py-8 text-center text-[14px] text-muted">Nenhum imóvel cadastrado.</p>
        ) : visible.length === 0 ? (
          <p className="surface-card px-4 py-8 text-center text-[14px] text-muted">Nenhum imóvel neste filtro.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((item) => (
              <li key={item.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <div className="aspect-[16/10] bg-navy-800">
                  <img src={item.photo} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[11px] font-semibold tracking-wide text-muted">{item.code}</p>
                    <Badge status={item.status} dealType={item.dealType} />
                  </div>
                  <h2 className="mt-1 truncate text-[16px] font-semibold">{item.title}</h2>
                  <p className="mt-1 text-[12px] text-muted">{propertyTypeLabel(item.propertyType)} · {item.region}</p>
                  <p className="mt-2 text-[20px] font-extrabold tracking-tight text-emerald tabular-nums">{formatPropertyPrice(item)}</p>
                  {demo && (
                    <button type="button" onClick={() => setEditing(item)} className="mt-3 h-9 w-full rounded-lg border border-line text-[12.5px] font-semibold text-ink">
                      Editar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
