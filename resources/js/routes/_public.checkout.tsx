import { useState, useMemo, useRef, useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCustomerStore } from '~/store/customer'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Tag, X, CheckCircle2, Loader2, Truck, Store, Clock } from 'lucide-react'
import { useCartStore } from '~/store/cart'
import { useBlockedDates, useBlockedWeekdays, useDeliveryHours } from '~/lib/hooks'
import { api } from '~/lib/api'
import { formatPrice, cn } from '~/lib/utils'

interface PublicDeliveryRegion {
  id: number
  name: string
  price: number
}

interface AppliedCoupon {
  code: string
  type: 'fixed' | 'percentage'
  value: number
  discount: number
  description?: string
}

function useDeliveryRegions() {
  const { data } = useQuery({
    queryKey: ['delivery-regions'],
    queryFn: () => api.get<{ data: PublicDeliveryRegion[] }>('/delivery-regions').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  return data ?? []
}

export const Route = createFileRoute('/_public/checkout')({
  component: CheckoutPage,
})

function allSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = []
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === endHour && m > 0) break
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

function availableSlotsForDate(dateStr: string, startHour: number, endHour: number): string[] {
  if (!dateStr) return []
  const minDelivery = new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
  return allSlots(startHour, endHour).filter((slot) => {
    const [h, m] = slot.split(':').map(Number)
    const slotDt = new Date(dateStr)
    slotDt.setHours(h, m, 0, 0)
    return slotDt > minDelivery
  })
}

interface FormState {
  customer_name: string
  customer_phone: string
  customer_address: string
  delivery_date: string
  delivery_time: string
  delivery_type: 'delivery' | 'pickup'
  delivery_region_id: string
  notes: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-stone-50">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-semibold flex items-center justify-center leading-none">
          {number}
        </span>
        <h2 className="text-sm font-semibold text-stone-800 tracking-wide uppercase">{title}</h2>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  )
}

// ── Floating input ─────────────────────────────────────────────────────────

function FloatInput({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">{label}</label>
      <div
        className={cn(
          '[&_input,&_textarea]:w-full [&_input,&_textarea]:bg-stone-50 [&_input,&_textarea]:border [&_input,&_textarea]:rounded-xl [&_input,&_textarea]:px-4 [&_input,&_textarea]:py-3 [&_input,&_textarea]:text-sm [&_input,&_textarea]:text-stone-800 [&_input,&_textarea]:placeholder-stone-300 [&_input,&_textarea]:outline-none [&_input,&_textarea]:transition-all',
          error
            ? '[&_input,&_textarea]:border-red-300 [&_input,&_textarea]:bg-red-50'
            : '[&_input,&_textarea]:border-stone-200 [&_input,&_textarea]:focus:border-primary-400 [&_input,&_textarea]:focus:bg-white [&_input,&_textarea]:focus:shadow-[0_0_0_3px_rgba(104,93,148,0.12)]',
        )}
      >
        {children}
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1">{error}</p>}
    </div>
  )
}

// ── Delivery type cards ────────────────────────────────────────────────────

function DeliveryTypeCard({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all',
        active
          ? 'border-primary-400 bg-primary-50'
          : 'border-stone-200 bg-stone-50 hover:border-stone-300',
      )}
    >
      <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', active ? 'bg-primary-500 text-white' : 'bg-stone-200 text-stone-500')}>
        {icon}
      </span>
      <div>
        <p className={cn('text-sm font-semibold', active ? 'text-primary-700' : 'text-stone-700')}>{title}</p>
        <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>
      </div>
    </button>
  )
}

// ── Region card grid ───────────────────────────────────────────────────────

function RegionPicker({
  regions,
  value,
  onChange,
  error,
}: {
  regions: PublicDeliveryRegion[]
  value: string
  onChange: (id: string) => void
  error?: string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Região de entrega *</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {regions.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(String(r.id))}
            className={cn(
              'rounded-xl border-2 px-3 py-3 text-left transition-all',
              value === String(r.id)
                ? 'border-primary-400 bg-primary-50'
                : 'border-stone-200 bg-stone-50 hover:border-stone-300',
            )}
          >
            <p className={cn('text-sm font-medium', value === String(r.id) ? 'text-primary-700' : 'text-stone-700')}>{r.name}</p>
            <p className={cn('text-xs mt-0.5', value === String(r.id) ? 'text-primary-500' : 'text-stone-400')}>{formatPrice(r.price)}</p>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ── Time picker ────────────────────────────────────────────────────────────

function slotEndTime(slot: string): string {
  const [h, m] = slot.split(':').map(Number)
  const total = h * 60 + m + 15
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function TimeChipPicker({
  slots,
  value,
  onChange,
  disabled,
  error,
}: {
  slots: string[]
  value: string
  onChange: (t: string) => void
  disabled: boolean
  error?: string
}) {
  if (disabled) {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Horário *</label>
        <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-400 flex items-center gap-2">
          <Clock size={14} className="shrink-0" />
          <span>Escolha a data primeiro</span>
        </div>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Horário *</label>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Sem horários disponíveis para este dia.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Horário *</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-stone-700 appearance-none',
          'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
          error ? 'border-red-300' : 'border-stone-200',
        )}
      >
        <option value="">Selecione um horário</option>
        {slots.map((slot) => (
          <option key={slot} value={slot}>
            {slot} – {slotEndTime(slot)}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

function CheckoutPage() {
  const navigate = useNavigate()
  const { items, total, clearCart } = useCartStore()
  const setCustomerPhone = useCustomerStore((s) => s.setPhone)
  const deliveryRegions = useDeliveryRegions()
  const blockedDates = useBlockedDates()
  const blockedWeekdays = useBlockedWeekdays()
  const { start: deliveryStart, end: deliveryEnd } = useDeliveryHours()

  const [form, setForm] = useState<FormState>({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    delivery_date: '',
    delivery_time: '',
    delivery_type: 'delivery',
    delivery_region_id: '',
    notes: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  // ── Coupon state ──────────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponApplying, setCouponApplying] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null)
  const [autoApplyChecked, setAutoApplyChecked] = useState(false)
  const phoneBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const slots = useMemo(
    () => availableSlotsForDate(form.delivery_date, deliveryStart, deliveryEnd),
    [form.delivery_date, deliveryStart, deliveryEnd],
  )

  const selectedRegion = deliveryRegions.find((r) => r.id === Number(form.delivery_region_id)) ?? null
  const deliveryFee = form.delivery_type === 'delivery' && selectedRegion ? selectedRegion.price : 0
  const cartTotal = total()
  const discountAmount = appliedCoupon?.discount ?? 0
  const grandTotal = Math.max(0, cartTotal + deliveryFee - discountAmount)

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-stone-400 mb-4">O carrinho está vazio.</p>
        <button onClick={() => navigate({ to: '/menu' })} className="text-primary-600 hover:underline text-sm">
          Ver o menu
        </button>
      </div>
    )
  }

  function set(field: keyof FormState, value: string) {
    setForm((f) => {
      const next = { ...f, [field]: value }
      if (field === 'delivery_date') {
        const available = availableSlotsForDate(value, deliveryStart, deliveryEnd)
        if (!available.includes(f.delivery_time)) next.delivery_time = ''
      }
      return next
    })
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const handlePhoneBlur = useCallback(async (phone: string) => {
    if (autoApplyChecked || appliedCoupon || phone.replace(/\s/g, '').length < 8) return
    setAutoApplyChecked(true)
    try {
      const { data } = await api.get<{ data: null | { code: string; type: 'fixed' | 'percentage'; value: number; description?: string } }>(
        `/coupons/auto-apply?phone=${encodeURIComponent(phone)}`,
      )
      if (data.data) {
        const coupon = data.data
        const cartItems = items.map((i) => ({ product_id: i.productId, price: i.price, quantity: i.quantity }))
        const res = await api.post<{ data: { coupon: typeof coupon; discount: number } }>('/coupons/apply', {
          code: coupon.code,
          customer_phone: phone,
          items: cartItems,
          cart_total: cartTotal,
        })
        setAppliedCoupon({
          code: res.data.data.coupon.code,
          type: res.data.data.coupon.type,
          value: res.data.data.coupon.value,
          discount: res.data.data.discount,
          description: coupon.description,
        })
        setCouponInput(res.data.data.coupon.code)
      }
    } catch {
      // Silent
    }
  }, [autoApplyChecked, appliedCoupon, items, cartTotal])

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponError('')
    setCouponApplying(true)
    try {
      const cartItems = items.map((i) => ({ product_id: i.productId, price: i.price, quantity: i.quantity }))
      const { data } = await api.post<{ data: { coupon: { code: string; type: 'fixed' | 'percentage'; value: number; description?: string }; discount: number } }>(
        '/coupons/apply',
        { code, customer_phone: form.customer_phone || undefined, items: cartItems, cart_total: cartTotal },
      )
      setAppliedCoupon({
        code: data.data.coupon.code,
        type: data.data.coupon.type,
        value: data.data.coupon.value,
        discount: data.data.discount,
        description: data.data.coupon.description,
      })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setCouponError(e.response?.data?.message ?? 'Código inválido.')
      setAppliedCoupon(null)
    } finally {
      setCouponApplying(false)
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError('')
  }

  function validate(): boolean {
    const errs: FormErrors = {}
    if (!form.customer_name.trim()) errs.customer_name = 'Campo obrigatório'
    if (!form.customer_phone.trim()) errs.customer_phone = 'Campo obrigatório'
    else if (!/^\d{8,12}$/.test(form.customer_phone.replace(/\s/g, '')))
      errs.customer_phone = 'Número inválido'
    if (!form.delivery_date) errs.delivery_date = 'Escolha uma data'
    if (!form.delivery_time) errs.delivery_time = 'Escolha um horário'
    if (form.delivery_type === 'delivery' && deliveryRegions.length > 0 && !form.delivery_region_id)
      errs.delivery_region_id = 'Escolha uma região de entrega'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setServerError('')
    try {
      const payload = {
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_address: form.customer_address,
        notes: form.notes,
        delivery_date: `${form.delivery_date} ${form.delivery_time}:00`,
        delivery_type: form.delivery_type,
        delivery_region_id: form.delivery_type === 'delivery' && form.delivery_region_id ? Number(form.delivery_region_id) : null,
        payment_method: 'mpesa',
        coupon_code: appliedCoupon?.code ?? null,
        items: items.map((item) => ({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
          custom_notes: item.customNotes,
          addons: item.addons.map((a) => ({ addon_id: a.id, value: a.value })),
        })),
      }
      const { data } = await api.post('/orders', payload)
      if (data.data?.payment_status !== 'failed') clearCart()
      setCustomerPhone(form.customer_phone)
      navigate({ to: '/encomenda/$reference', params: { reference: data.data.reference } })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      if (e.response?.data?.errors) {
        const apiErrors: FormErrors = {}
        const unhandledErrors: string[] = []
        for (const [k, v] of Object.entries(e.response.data.errors)) {
          const formKey = k as keyof FormState
          if (formKey in { customer_name: 1, customer_phone: 1, customer_address: 1, delivery_date: 1, delivery_time: 1, delivery_type: 1, delivery_region_id: 1, notes: 1 }) {
            apiErrors[formKey] = v[0]
          } else {
            unhandledErrors.push(v[0])
          }
        }
        setErrors(apiErrors)
        if (unhandledErrors.length > 0) setServerError(unhandledErrors[0])
      } else {
        setServerError(e.response?.data?.message ?? 'Erro ao submeter a encomenda. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const deliveryLabel = form.delivery_date && form.delivery_time
    ? `${new Date(`${form.delivery_date}T${form.delivery_time}`).toLocaleDateString('pt-MZ', { weekday: 'short', day: 'numeric', month: 'short' })} às ${form.delivery_time}`
    : null

  return (
    <div className="min-h-screen bg-surface-muted">
      <Helmet>
        <title>Finalizar Encomenda — Cheesemania</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Page header */}
      <div className="bg-white border-b border-stone-100 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="font-semibold text-stone-900 text-base">Finalizar Encomenda</h1>
          <span className="text-xs text-stone-400">
            {items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'itens'}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <div className="grid md:grid-cols-5 gap-6">

          {/* ── Left: Form ──────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="md:col-span-3 space-y-4">

            {/* Section 1: Contact */}
            <Section number="1" title="Os seus dados">
              <div className="grid sm:grid-cols-2 gap-4">
                <FloatInput label="Nome completo *" error={errors.customer_name}>
                  <input
                    value={form.customer_name}
                    onChange={(e) => set('customer_name', e.target.value)}
                    placeholder="O seu nome"
                  />
                </FloatInput>
                <FloatInput label="Telefone MPesa *" error={errors.customer_phone}>
                  <input
                    value={form.customer_phone}
                    onChange={(e) => set('customer_phone', e.target.value)}
                    onBlur={(e) => {
                      if (phoneBlurTimer.current) clearTimeout(phoneBlurTimer.current)
                      phoneBlurTimer.current = setTimeout(() => handlePhoneBlur(e.target.value), 400)
                    }}
                    placeholder="84 000 0000"
                    type="tel"
                    inputMode="tel"
                  />
                </FloatInput>
              </div>
            </Section>

            {/* Section 2: Delivery */}
            <Section number="2" title="Como receber">
              <div className="flex gap-3">
                <DeliveryTypeCard
                  active={form.delivery_type === 'delivery'}
                  icon={<Truck size={16} />}
                  title="Entrega ao domicílio"
                  subtitle="Entregamos na sua porta"
                  onClick={() => set('delivery_type', 'delivery')}
                />
                <DeliveryTypeCard
                  active={form.delivery_type === 'pickup'}
                  icon={<Store size={16} />}
                  title="Levantamento"
                  subtitle="Gratuito — leve pessoalmente"
                  onClick={() => { set('delivery_type', 'pickup'); set('delivery_region_id', '') }}
                />
              </div>

              {form.delivery_type === 'delivery' && deliveryRegions.length > 0 && (
                <RegionPicker
                  regions={deliveryRegions}
                  value={form.delivery_region_id}
                  onChange={(id) => set('delivery_region_id', id)}
                  error={errors.delivery_region_id}
                />
              )}

              {form.delivery_type === 'delivery' && (
                <FloatInput label="Endereço de entrega" error={errors.customer_address}>
                  <input
                    value={form.customer_address}
                    onChange={(e) => set('customer_address', e.target.value)}
                    placeholder="Bairro, rua, número..."
                  />
                </FloatInput>
              )}
            </Section>

            {/* Section 3: Date & Time */}
            <Section number="3" title="Quando">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider">Data de entrega *</label>
                <DatePicker
                  value={form.delivery_date}
                  onChange={(d) => set('delivery_date', d)}
                  blockedDates={blockedDates}
                  blockedWeekdays={blockedWeekdays}
                  deliveryStart={deliveryStart}
                  deliveryEnd={deliveryEnd}
                  error={errors.delivery_date}
                />
              </div>

              <TimeChipPicker
                slots={slots}
                value={form.delivery_time}
                onChange={(t) => set('delivery_time', t)}
                disabled={!form.delivery_date}
                error={errors.delivery_time}
              />
            </Section>

            {/* Section 4: Notes + Coupon */}
            <Section number="4" title="Extras">
              <FloatInput label="Notas adicionais" error={errors.notes}>
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Instruções especiais, alergia, pedido personalizado..."
                  rows={3}
                  className="resize-none"
                />
              </FloatInput>

              <CouponSection
                couponInput={couponInput}
                setCouponInput={setCouponInput}
                couponError={couponError}
                setCouponError={setCouponError}
                couponApplying={couponApplying}
                appliedCoupon={appliedCoupon}
                onApply={applyCoupon}
                onRemove={removeCoupon}
              />
            </Section>

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            {/* Desktop submit */}
            <div className="hidden md:block pt-1">
              <SubmitButton submitting={submitting} grandTotal={grandTotal} />
              <p className="text-xs text-stone-400 text-center mt-3">
                Ao confirmar, será iniciado o pagamento por MPesa para o número introduzido.
              </p>
            </div>

            {/* Mobile spacer */}
            <div className="h-28 md:hidden" />
          </form>

          {/* ── Right: Order summary ────────────────────────────────────── */}
          <aside className="hidden md:block md:col-span-2">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm sticky top-[72px] overflow-hidden">
              <div className="px-5 pt-5 pb-3 border-b border-stone-50">
                <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wide">Resumo do pedido</h2>
              </div>

              <div className="px-5 py-4 space-y-3 max-h-[280px] overflow-y-auto">
                {items.map((item) => {
                  const addonTotal = item.addons.reduce((s, a) => s + a.price, 0)
                  return (
                    <div key={item.variantId} className="flex gap-3 items-start">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-stone-100 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{item.productName}</p>
                        <p className="text-xs text-stone-400">{item.variantLabel} · ×{item.quantity}</p>
                        {item.addons.filter((a) => a.value).map((a, i) => (
                          <p key={i} className="text-xs text-stone-400">{a.name}: {a.value}</p>
                        ))}
                      </div>
                      <p className="text-sm font-medium text-stone-700 whitespace-nowrap">
                        {formatPrice((item.price + addonTotal) * item.quantity)}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="px-5 pb-5 space-y-2 border-t border-stone-50 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="text-stone-700">{formatPrice(cartTotal)}</span>
                </div>

                {form.delivery_type === 'pickup' ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Levantamento</span>
                    <span className="text-green-600 font-medium">Gratuita</span>
                  </div>
                ) : selectedRegion ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Entrega — {selectedRegion.name}</span>
                    <span className="text-stone-700">{formatPrice(selectedRegion.price)}</span>
                  </div>
                ) : null}

                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 flex items-center gap-1.5">
                      <Tag size={12} />
                      {appliedCoupon.code}
                    </span>
                    <span className="text-green-600 font-medium">−{formatPrice(appliedCoupon.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-stone-100">
                  <span className="font-semibold text-stone-800">Total</span>
                  <span className="font-bold text-stone-900 text-lg">{formatPrice(grandTotal)}</span>
                </div>

                {deliveryLabel && (
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100 text-xs text-stone-500">
                    <Clock size={12} className="flex-shrink-0" />
                    {deliveryLabel}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile: Sticky bottom bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-100 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="px-4 pt-3 pb-3 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">Total a pagar</span>
            <div className="text-right">
              {appliedCoupon && (
                <span className="block text-xs text-green-600">−{formatPrice(appliedCoupon.discount)} desconto</span>
              )}
              <span className="font-bold text-stone-900">{formatPrice(grandTotal)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const formEl = document.querySelector('form')
              if (formEl) formEl.requestSubmit()
            }}
            disabled={submitting}
            className="w-full bg-primary-500 active:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-4 rounded-xl transition-colors text-sm active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> A processar...</>
            ) : (
              'Confirmar e Pagar via MPesa'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Submit button ──────────────────────────────────────────────────────────

function SubmitButton({ submitting, grandTotal }: { submitting: boolean; grandTotal: number }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
    >
      {submitting ? (
        <><Loader2 size={16} className="animate-spin" /> A processar...</>
      ) : (
        `Confirmar e Pagar · ${formatPrice(grandTotal)}`
      )}
    </button>
  )
}

// ── Coupon UI ──────────────────────────────────────────────────────────────

interface CouponSectionProps {
  couponInput: string
  setCouponInput: (v: string) => void
  couponError: string
  setCouponError: (v: string) => void
  couponApplying: boolean
  appliedCoupon: AppliedCoupon | null
  onApply: () => void
  onRemove: () => void
}

function CouponSection({
  couponInput,
  setCouponInput,
  couponError,
  setCouponError,
  couponApplying,
  appliedCoupon,
  onApply,
  onRemove,
}: CouponSectionProps) {
  if (appliedCoupon) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-800">{appliedCoupon.code}</p>
            <p className="text-xs text-green-600 truncate">
              {appliedCoupon.description
                ? appliedCoupon.description
                : appliedCoupon.type === 'fixed'
                ? `${formatPrice(appliedCoupon.value)} de desconto`
                : `${appliedCoupon.value}% de desconto`}
              {' · '}
              <span className="font-medium">−{formatPrice(appliedCoupon.discount)}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 text-green-500 hover:text-green-700 transition-colors p-1"
          aria-label="Remover cupão"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
        <Tag size={12} />
        Código de desconto
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={couponInput}
          onChange={(e) => {
            setCouponInput(e.target.value.toUpperCase())
            if (couponError) setCouponError('')
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onApply() } }}
          placeholder="PROMO25"
          className={cn(
            'flex-1 bg-stone-50 border rounded-xl px-4 py-3 text-sm text-stone-800 placeholder-stone-300 outline-none transition-all uppercase tracking-widest',
            couponError
              ? 'border-red-300 bg-red-50'
              : 'border-stone-200 focus:border-primary-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(104,93,148,0.12)]',
          )}
        />
        <button
          type="button"
          onClick={onApply}
          disabled={couponApplying || !couponInput.trim()}
          className="flex-shrink-0 bg-stone-800 hover:bg-stone-900 disabled:bg-stone-200 disabled:text-stone-400 text-white text-sm font-medium px-5 rounded-xl transition-colors flex items-center gap-1.5"
        >
          {couponApplying ? <Loader2 size={14} className="animate-spin" /> : null}
          Aplicar
        </button>
      </div>
      {couponError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <X size={11} className="flex-shrink-0" />
          {couponError}
        </p>
      )}
    </div>
  )
}

// ── DatePicker ─────────────────────────────────────────────────────────────

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function DatePicker({
  value,
  onChange,
  blockedDates,
  blockedWeekdays,
  deliveryStart,
  deliveryEnd,
  error,
}: {
  value: string
  onChange: (date: string) => void
  blockedDates: string[]
  blockedWeekdays: number[]
  deliveryStart: number
  deliveryEnd: number
  error?: string
}) {
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [])

  const initialDate = useMemo(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00')
      return { year: d.getFullYear(), month: d.getMonth() }
    }
    return { year: today.getFullYear(), month: today.getMonth() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [viewYear, setViewYear] = useState(initialDate.year)
  const [viewMonth, setViewMonth] = useState(initialDate.month)

  const blocked = useMemo(() => new Set(blockedDates), [blockedDates])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(viewYear, viewMonth, i + 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }),
  ]

  return (
    <div className={cn('rounded-xl border bg-stone-50 overflow-hidden', error ? 'border-red-300' : 'border-stone-200')}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-stone-100">
        <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors">
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-semibold text-stone-700">{MONTHS_PT[viewMonth]} {viewYear}</span>
        <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors">
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="px-3 pb-3 pt-2">
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS_SHORT.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-stone-400 py-1 uppercase tracking-wide">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((dateStr, idx) => {
            if (!dateStr) return <div key={idx} />

            const date = new Date(dateStr + 'T00:00:00')
            const isPast = date < today
            const isBlocked = blocked.has(dateStr) || blockedWeekdays.includes(date.getDay())
            const hasNoSlots = !isPast && !isBlocked && availableSlotsForDate(dateStr, deliveryStart, deliveryEnd).length === 0
            const isDisabled = isPast || isBlocked || hasNoSlots
            const isSelected = dateStr === value

            return (
              <button
                key={dateStr}
                type="button"
                disabled={isDisabled}
                onClick={() => onChange(dateStr)}
                className={cn(
                  'flex items-center justify-center h-9 w-full rounded-lg text-xs transition-all select-none',
                  isSelected && 'bg-primary-500 text-white font-bold shadow-sm',
                  !isSelected && isBlocked && 'bg-red-50 text-red-300 line-through cursor-not-allowed',
                  !isSelected && (isPast || hasNoSlots) && 'text-stone-300 cursor-not-allowed',
                  !isSelected && !isDisabled && 'text-stone-700 hover:bg-primary-100 hover:text-primary-700 cursor-pointer font-medium',
                )}
                title={isBlocked ? 'Data indisponível' : undefined}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>

      {error && <p className="text-xs text-red-500 px-3 pb-2.5">{error}</p>}
    </div>
  )
}
