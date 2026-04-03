import { useState, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'
import { Plus, Minus, Trash2, CheckCircle, ChevronDown, ChevronUp, Sparkles, Calendar, User, Phone, Search, X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useEventProducts } from '~/lib/hooks'
import { api } from '~/lib/api'
import { formatPrice, cn } from '~/lib/utils'
import type { ProductListItem } from '~/lib/types'

export const Route = createFileRoute('/_public/encomenda-evento')({
  component: EventOrderPage,
})

interface EventItem {
  product_id: number
  variant_id: number
  quantity: number
  product_name: string
  variant_label: string
  price: number
  custom_notes: string
}

// ── Reusable field wrapper ────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">
        {step}
      </span>
      <h2 className="font-semibold text-stone-800 text-base">{title}</h2>
      <div className="flex-1 h-px bg-stone-100" />
    </div>
  )
}

// ── Product picker ────────────────────────────────────────────────────────────

function ProductPicker({
  product,
  onAdd,
}: {
  product: ProductListItem & { variants?: { id: number; price: number; attribute_value_ids: number[] }[]; attributes?: { id: number; name: string; values: { id: number; value: string }[] }[]; option_rules?: { condition_value_id: number; target_value_id: number; rule_type: string }[] }
  onAdd: (item: EventItem) => void
}) {
  const [open, setOpen] = useState(false)
  const [selectedValues, setSelectedValues] = useState<Record<number, number>>({})
  const [flavourSelections, setFlavourSelections] = useState<number[]>([])
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const isSimple = product.product_type === 'simple'
  const variants = (product as any).variants as { id: number; price: number; is_available: boolean; attribute_value_ids: number[] }[] ?? []
  const attributes = (product as any).attributes as { id: number; name: string; values: { id: number; value: string }[] }[] ?? []
  const optionRules = (product as any).option_rules as { condition_value_id: number; target_value_id: number; rule_type: string }[] ?? []

  const personalizacaoAttr = attributes.find((a) => a.name === 'Personalização') ?? null
  const saborAttr = attributes.find((a) => a.name === 'Sabor') ?? null

  const flavourCount = useMemo(() => {
    if (!personalizacaoAttr) return 0
    const val = personalizacaoAttr.values.find((v) => v.id === selectedValues[personalizacaoAttr.id])
    if (!val) return 0
    const match = val.value.match(/^(\d+)/)
    return match ? parseInt(match[1]) : 0
  }, [personalizacaoAttr, selectedValues])

  const { disabledValueIds, hiddenValueIds } = useMemo(() => {
    const disabled = new Set<number>()
    const hidden = new Set<number>()
    for (const rule of optionRules) {
      const condAttr = attributes.find((a) => a.values.some((v) => v.id === rule.condition_value_id))
      if (!condAttr) continue
      if (selectedValues[condAttr.id] === rule.condition_value_id) {
        if (rule.rule_type === 'disable') disabled.add(rule.target_value_id)
        else hidden.add(rule.target_value_id)
      }
    }
    return { disabledValueIds: disabled, hiddenValueIds: hidden }
  }, [optionRules, attributes, selectedValues])

  const variantAttrIds = useMemo(() => {
    const valueToAttr = new Map<number, number>()
    for (const attr of attributes) {
      for (const val of attr.values) valueToAttr.set(val.id, attr.id)
    }
    const ids = new Set<number>()
    for (const v of variants) {
      for (const vid of v.attribute_value_ids ?? []) {
        const aid = valueToAttr.get(vid)
        if (aid !== undefined) ids.add(aid)
      }
    }
    return ids
  }, [attributes, variants])

  const matchedVariant = useMemo(() => {
    if (isSimple) return variants[0] ?? null
    const relevantIds = Object.entries(selectedValues)
      .filter(([attrId]) => variantAttrIds.has(Number(attrId)))
      .map(([, valId]) => valId)
    if (relevantIds.length === 0 || relevantIds.length < variantAttrIds.size) return null
    return variants.find((v) => relevantIds.every((id) => v.attribute_value_ids.includes(id))) ?? null
  }, [isSimple, variants, selectedValues, variantAttrIds])

  const flavoursFilled = flavourCount === 0 || flavourSelections.length === flavourCount
  const canAdd = !!matchedVariant && flavoursFilled

  function handleSelectValue(attrId: number, valueId: number) {
    setSelectedValues((s) => ({ ...s, [attrId]: valueId }))
    if (personalizacaoAttr && attrId === personalizacaoAttr.id) setFlavourSelections([])
  }

  function toggleFlavour(valueId: number) {
    setFlavourSelections((prev) => {
      if (prev.includes(valueId)) return prev.filter((id) => id !== valueId)
      if (prev.length >= flavourCount) return prev
      return [...prev, valueId]
    })
  }

  function buildLabel(): string {
    if (isSimple) return ''
    const parts = attributes
      .filter((a) => variantAttrIds.has(a.id) && a.name !== 'Sabor')
      .map((a) => a.values.find((v) => v.id === selectedValues[a.id])?.value ?? '')
      .filter(Boolean)
    if (saborAttr && flavourSelections.length > 0) {
      const names = flavourSelections.map((id) => saborAttr!.values.find((v) => v.id === id)?.value).filter(Boolean)
      parts.push(names.join(', '))
    }
    return parts.join(' · ')
  }

  function handleAdd() {
    if (!canAdd) return
    let customNotes = notes.trim()
    if (saborAttr && flavourSelections.length > 0) {
      const names = flavourSelections.map((id) => saborAttr!.values.find((v) => v.id === id)?.value).filter(Boolean)
      const flavourText = `Sabores: ${names.join(', ')}`
      customNotes = customNotes ? `${customNotes} | ${flavourText}` : flavourText
    }
    onAdd({
      product_id: product.id,
      variant_id: matchedVariant!.id,
      quantity,
      product_name: product.name,
      variant_label: buildLabel(),
      price: matchedVariant!.price,
      custom_notes: customNotes,
    })
    setOpen(false)
    setSelectedValues({})
    setFlavourSelections([])
    setQuantity(1)
    setNotes('')
  }

  const primaryImage = product.primary_image
    ?? ((product as any).images as { url: string; alt: string; is_primary: boolean }[] | undefined)?.find((i) => i.is_primary)
    ?? (product as any).images?.[0]

  return (
    <div className={cn(
      'bg-white rounded-2xl overflow-hidden border transition-all duration-200',
      open ? 'border-primary-200 shadow-sm shadow-primary-100/50' : 'border-stone-100 hover:border-stone-200'
    )}>
      {/* Header row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.alt}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 shadow-sm"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-stone-100 flex items-center justify-center text-2xl flex-shrink-0">🍰</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-800 text-sm leading-snug">{product.name}</p>
          <p className="text-xs text-stone-400 mt-1">
            {product.price_range.min === product.price_range.max
              ? formatPrice(product.price_range.min)
              : `A partir de ${formatPrice(product.price_range.min)}`}
          </p>
          {product.is_non_lactose && (
            <span className="inline-block text-[10px] text-emerald-600 font-medium mt-1">Sem lactose</span>
          )}
        </div>
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
          open ? 'bg-primary-100 text-primary-600' : 'bg-stone-100 text-stone-400'
        )}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Expanded config */}
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-stone-100">
          {/* Attribute selectors */}
          {!isSimple && attributes.filter((a) => a.name !== 'Sabor').map((attr) => (
            <div key={attr.id}>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">{attr.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {attr.values.filter((v) => !hiddenValueIds.has(v.id)).map((val) => {
                  const isDisabled = disabledValueIds.has(val.id)
                  const isSelected = selectedValues[attr.id] === val.id
                  return (
                    <button
                      key={val.id}
                      disabled={isDisabled}
                      onClick={() => handleSelectValue(attr.id, val.id)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-all duration-150',
                        isSelected
                          ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                          : isDisabled
                          ? 'border-stone-100 text-stone-300 cursor-not-allowed'
                          : 'border-stone-200 text-stone-600 hover:border-primary-300 hover:text-primary-700',
                      )}
                    >
                      {val.value}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Sabor multi-select */}
          {saborAttr && flavourCount > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  {flavourCount === 1 ? 'Sabor' : `Sabores (escolha ${flavourCount})`}
                </p>
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full transition-colors',
                  flavourSelections.length === flavourCount
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-stone-100 text-stone-400'
                )}>
                  {flavourSelections.length}/{flavourCount}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {saborAttr.values.map((val) => {
                  const checked = flavourSelections.includes(val.id)
                  const maxed = !checked && flavourSelections.length >= flavourCount
                  return (
                    <button
                      key={val.id}
                      disabled={maxed}
                      onClick={() => toggleFlavour(val.id)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-all duration-150',
                        checked
                          ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                          : maxed
                          ? 'border-stone-100 text-stone-300 cursor-not-allowed'
                          : 'border-stone-200 text-stone-600 hover:border-primary-300',
                      )}
                    >
                      {val.value}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Quantidade</p>
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-1 py-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-white transition-all"
              >
                <Minus size={12} />
              </button>
              <span className="text-sm font-semibold text-stone-800 w-7 text-center tabular-nums">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-white transition-all"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Notes */}
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionais (opcional)"
            className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/15 bg-white placeholder-stone-300 transition-all"
          />

          <button
            onClick={handleAdd}
            disabled={!canAdd}
            className={cn(
              'w-full text-sm font-medium py-2.5 rounded-xl transition-all duration-200',
              canAdd
                ? 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-sm hover:shadow'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            )}
          >
            {canAdd
              ? `Adicionar — ${formatPrice(matchedVariant!.price * quantity)}`
              : !matchedVariant
              ? 'Seleccione as opções'
              : `Faltam ${flavourCount - flavourSelections.length} sabor${flavourCount - flavourSelections.length !== 1 ? 'es' : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function EventOrderPage() {
  const { data: products, isLoading } = useEventProducts()
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<EventItem[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(6)

  const PAGE_SIZE = 6

  const filteredProducts = useMemo(() => {
    if (!products) return []
    const q = search.trim().toLowerCase()
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products
  }, [products, search])

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredProducts.length

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  function addItem(item: EventItem) {
    setItems((prev) => [...prev, item])
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const submitMut = useMutation({
    mutationFn: () =>
      api.post('/event-orders', {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        event_date: eventDate,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
          custom_notes: i.custom_notes || undefined,
        })),
      }),
    onSuccess: (res) => {
      setSubmitted(res.data.data.reference)
    },
    onError: (e: any) => {
      const apiErrors = e?.response?.data?.errors ?? {}
      const mapped: Record<string, string> = {}
      if (apiErrors.customer_name) mapped.customer_name = apiErrors.customer_name[0]
      if (apiErrors.customer_phone) mapped.customer_phone = apiErrors.customer_phone[0]
      if (apiErrors.event_date) mapped.event_date = apiErrors.event_date[0]
      if (apiErrors.items) mapped.items = 'Adicione pelo menos um produto.'
      setErrors(mapped)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!customerName.trim()) newErrors.customer_name = 'Nome obrigatório.'
    if (!customerPhone.trim()) newErrors.customer_phone = 'Telefone obrigatório.'
    if (!eventDate) newErrors.event_date = 'Data do evento obrigatória.'
    if (items.length === 0) newErrors.items = 'Adicione pelo menos um produto.'
    if (Object.keys(newErrors).length) { setErrors(newErrors); return }
    setErrors({})
    submitMut.mutate()
  }

  // ── Success state ────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <Helmet><title>Pedido de Evento — Cheesemania</title></Helmet>
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={40} className="text-emerald-500" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="font-semibold text-2xl text-stone-900 mb-2">
            Pedido recebido!
          </h1>
          <p className="text-stone-500 text-sm mb-6 leading-relaxed">
            A nossa equipa entrará em contacto brevemente com uma proposta personalizada para o seu evento.
          </p>

          <div className="bg-stone-50 border border-stone-100 rounded-2xl px-5 py-4 mb-8 text-left">
            <p className="text-xs text-stone-400 font-medium mb-1">Referência do pedido</p>
            <p className="font-mono font-semibold text-stone-800 text-base tracking-widest">{submitted}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/menu"
              className="block w-full text-center bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 rounded-xl text-sm transition-colors"
            >
              Explorar o menu
            </Link>
            <Link
              to="/"
              className="block text-center text-stone-400 hover:text-stone-600 text-sm transition-colors"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 md:py-14 pb-16">
      <Helmet>
        <title>Encomenda para Evento — Cheesemania</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Page header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Sparkles size={12} />
          Serviço personalizado
        </div>
        <h1 className="font-semibold text-3xl md:text-4xl text-stone-900 mb-3 leading-tight">
          Encomenda para Evento
        </h1>
        <p className="text-stone-500 text-sm leading-relaxed max-w-md">
          Casamentos, aniversários, eventos corporativos. Diga-nos o que precisa — enviamos uma proposta à medida.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">

        {/* ── Section 1: Customer info ── */}
        <section>
          <SectionHeading step="1" title="Os seus dados" />
          <div className="bg-white rounded-2xl border border-stone-100 p-5 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nome completo" error={errors.customer_name}>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => { setCustomerName(e.target.value); setErrors((s) => ({ ...s, customer_name: '' })) }}
                    placeholder="O seu nome"
                    className="w-full pl-9 pr-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/15 text-stone-800 placeholder-stone-300 transition-all"
                  />
                </div>
              </Field>
              <Field label="Telefone" error={errors.customer_phone}>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => { setCustomerPhone(e.target.value); setErrors((s) => ({ ...s, customer_phone: '' })) }}
                    placeholder="84 000 0000"
                    className="w-full pl-9 pr-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/15 text-stone-800 placeholder-stone-300 transition-all"
                  />
                </div>
              </Field>
            </div>

            <Field label="Data do evento" error={errors.event_date}>
              <div className="relative">
                <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => { setEventDate(e.target.value); setErrors((s) => ({ ...s, event_date: '' })) }}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  className="w-full pl-9 pr-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/15 text-stone-800 transition-all"
                />
              </div>
            </Field>

            <Field label="Descrição do evento">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tipo de evento, número de convidados, preferências especiais..."
                rows={3}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/15 resize-none text-stone-800 placeholder-stone-300 transition-all"
              />
            </Field>
          </div>
        </section>

        {/* ── Section 2: Products ── */}
        <section>
          <SectionHeading step="2" title="Selecione os produtos" />

          {/* Search */}
          {!isLoading && !!products?.length && (
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE) }}
                placeholder="Pesquisar produtos..."
                className="w-full pl-9 pr-9 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/15 text-stone-800 placeholder-stone-300 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setVisibleCount(PAGE_SIZE) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[84px] bg-stone-100 rounded-2xl animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          ) : !products?.length ? (
            <div className="text-center py-10 text-stone-400">
              <p className="text-sm">Nenhum produto disponível para eventos de momento.</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <p className="text-sm mb-2">Nenhum produto encontrado para "{search}".</p>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-primary-600 text-xs font-medium hover:underline"
              >
                Limpar pesquisa
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {visibleProducts.map((p) => <ProductPicker key={p.id} product={p as any} onAdd={addItem} />)}
              </div>

              {/* Result count + load more */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-stone-400 tabular-nums">
                  {Math.min(visibleCount, filteredProducts.length)} de {filteredProducts.length} produtos
                </p>
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3.5 py-1.5 rounded-full transition-colors"
                  >
                    Ver mais ({filteredProducts.length - visibleCount})
                  </button>
                )}
              </div>
            </>
          )}

          {errors.items && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-400 inline-block" />
              {errors.items}
            </p>
          )}
        </section>

        {/* ── Section 3: Order summary ── */}
        {items.length > 0 && (
          <section>
            <SectionHeading step="3" title="Resumo do pedido" />
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
              <div className="divide-y divide-stone-50">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-5 py-3.5 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 leading-snug">{item.product_name}</p>
                      {item.variant_label && (
                        <p className="text-xs text-stone-400 mt-0.5 truncate">{item.variant_label}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-stone-700 tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <p className="text-xs text-stone-400">× {item.quantity}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1.5 text-stone-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-100 px-5 py-4 bg-stone-50/50">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium text-stone-600">Total indicativo</span>
                  <span className="font-semibold text-stone-900 text-lg tabular-nums">{formatPrice(total)}</span>
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  Valor sujeito a confirmação pela nossa equipa.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── API error ── */}
        {submitMut.isError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            {(submitMut.error as any)?.response?.data?.message ?? 'Erro ao enviar. Tente novamente.'}
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={submitMut.isPending}
          className="w-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all duration-200 text-sm shadow-sm hover:shadow-md"
        >
          {submitMut.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              A enviar pedido...
            </span>
          ) : (
            'Enviar pedido de evento'
          )}
        </button>

        <p className="text-center text-xs text-stone-400">
          Entraremos em contacto em até 24 horas com a sua proposta.
        </p>
      </form>
    </div>
  )
}
