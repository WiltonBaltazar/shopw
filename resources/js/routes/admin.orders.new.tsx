import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ChevronLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import {
  getAdminProducts,
  getAdminProduct,
  createAdminOrder,
  type AdminProductFull,
} from '~/lib/adminApi'
import { formatPrice } from '~/lib/utils'

export const Route = createFileRoute('/admin/orders/new')({
  component: NewOrderPage,
})

interface ItemState {
  product_id: number
  variant_id: number
  quantity: number
  custom_notes: string
  addons: { addon_id: number; value: string }[]
  _product: AdminProductFull
}

function variantLabel(product: AdminProductFull, variantId: number): string {
  const variant = product.variants.find((v) => v.id === variantId)
  if (!variant) return `Variante #${variantId}`
  if (!variant.attribute_value_ids?.length) return formatPrice(variant.price)
  const labels: string[] = []
  for (const attr of product.attributes ?? []) {
    for (const val of attr.values) {
      if (variant.attribute_value_ids.includes(val.id)) labels.push(val.value)
    }
  }
  return labels.length ? `${labels.join(' / ')} — ${formatPrice(variant.price)}` : formatPrice(variant.price)
}

function ItemBuilder({
  onAdd,
}: {
  onAdd: (item: ItemState) => void
}) {
  const [productId, setProductId] = useState<number | null>(null)
  const [variantId, setVariantId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [customNotes, setCustomNotes] = useState('')
  const [addonValues, setAddonValues] = useState<Record<number, string>>({})

  const { data: products = [] } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: getAdminProducts,
  })

  const { data: product } = useQuery({
    queryKey: ['admin', 'product', productId],
    queryFn: () => getAdminProduct(String(productId)),
    enabled: !!productId,
  })

  function handleSelectProduct(id: number) {
    setProductId(id)
    setVariantId(null)
    setAddonValues({})
  }

  function handleAdd() {
    if (!productId || !variantId || !product) return
    onAdd({
      product_id: productId,
      variant_id: variantId,
      quantity,
      custom_notes: customNotes,
      addons: Object.entries(addonValues)
        .filter(([, v]) => v.trim() !== '')
        .map(([id, value]) => ({ addon_id: Number(id), value })),
      _product: product,
    })
    setProductId(null)
    setVariantId(null)
    setQuantity(1)
    setCustomNotes('')
    setAddonValues({})
  }

  return (
    <div className="border border-dashed border-stone-300 rounded-xl p-4 space-y-3">
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Adicionar item</p>

      <select
        value={productId ?? ''}
        onChange={(e) => e.target.value ? handleSelectProduct(Number(e.target.value)) : setProductId(null)}
        className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400 text-stone-700"
      >
        <option value="">Selecionar produto…</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {product && (
        <>
          <select
            value={variantId ?? ''}
            onChange={(e) => setVariantId(Number(e.target.value))}
            className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400 text-stone-700"
          >
            <option value="">Selecionar variante…</option>
            {product.variants.filter((v) => v.is_available).map((v) => (
              <option key={v.id} value={v.id}>{variantLabel(product, v.id)}</option>
            ))}
          </select>

          {(product.addons ?? []).map((addon) => (
            <div key={addon.id}>
              <label className="text-xs text-stone-500 block mb-1">
                {addon.name}{addon.is_required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              {addon.type === 'select' && addon.options ? (
                <select
                  value={addonValues[addon.id] ?? ''}
                  onChange={(e) => setAddonValues((p) => ({ ...p, [addon.id]: e.target.value }))}
                  className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400 text-stone-700"
                >
                  <option value="">Escolher…</option>
                  {addon.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  value={addonValues[addon.id] ?? ''}
                  onChange={(e) => setAddonValues((p) => ({ ...p, [addon.id]: e.target.value }))}
                  placeholder={addon.placeholder ?? ''}
                  className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400 text-stone-700"
                />
              )}
            </div>
          ))}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-stone-500">Qty</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-16 text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400 text-stone-700"
              />
            </div>
            <input
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Notas do item (opcional)"
              className="flex-1 text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400 text-stone-700"
            />
          </div>
        </>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!productId || !variantId}
        className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
      >
        <Plus size={14} /> Adicionar item
      </button>
    </div>
  )
}

function NewOrderPage() {
  const navigate = useNavigate()
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid')
  const [items, setItems] = useState<ItemState[]>([])

  const mutation = useMutation({
    mutationFn: createAdminOrder,
    onSuccess: (order) => {
      navigate({ to: '/admin/orders/$id', params: { id: String(order.id) } })
    },
  })

  const subtotal = items.reduce((sum, item) => {
    const variant = item._product.variants.find((v) => v.id === item.variant_id)
    if (!variant) return sum
    const addonTotal = item.addons.reduce((s, a) => {
      const addon = item._product.addons?.find((ad) => ad.id === a.addon_id)
      return s + (addon?.price ?? 0)
    }, 0)
    return sum + (variant.price + addonTotal) * item.quantity
  }, 0)

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress || undefined,
      notes: notes || undefined,
      delivery_date: deliveryDate || undefined,
      payment_status: paymentStatus,
      items: items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        custom_notes: item.custom_notes || undefined,
        addons: item.addons,
      })),
    })
  }

  return (
    <div className="p-8 max-w-2xl">
      <button
        onClick={() => navigate({ to: '/admin/orders' })}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
      >
        <ChevronLeft size={15} /> Encomendas
      </button>

      <h1 className="font-serif text-3xl text-stone-900 mb-8">Nova encomenda</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer */}
        <div className="bg-white rounded-2xl border border-stone-200 px-5 py-5 space-y-4">
          <h2 className="font-medium text-stone-900">Cliente</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 block mb-1">Nome *</label>
              <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="text-xs text-stone-500 block mb-1">Telefone *</label>
              <input required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400" />
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">Endereço</label>
            <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 block mb-1">Data de entrega</label>
              <input type="datetime-local" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="text-xs text-stone-500 block mb-1">Pagamento</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'unpaid')}
                className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400 text-stone-700">
                <option value="paid">Pago</option>
                <option value="unpaid">Não pago</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400 resize-none" />
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-stone-200 px-5 py-5 space-y-4">
          <h2 className="font-medium text-stone-900">Itens</h2>

          {items.map((item, i) => {
            const variant = item._product.variants.find((v) => v.id === item.variant_id)
            return (
              <div key={i} className="flex items-start gap-3 bg-stone-50 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800">{item._product.name}</p>
                  <p className="text-xs text-stone-500">{variantLabel(item._product, item.variant_id)} × {item.quantity}</p>
                  {item.addons.filter((a) => a.value).map((a, j) => {
                    const addonDef = item._product.addons?.find((ad) => ad.id === a.addon_id)
                    return <p key={j} className="text-xs text-stone-400">{addonDef?.name}: {a.value}</p>
                  })}
                </div>
                {variant && (
                  <p className="text-sm font-medium text-stone-900 shrink-0">
                    {formatPrice(variant.price * item.quantity)}
                  </p>
                )}
                <button type="button" onClick={() => removeItem(i)} className="p-1 text-stone-300 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}

          <ItemBuilder onAdd={(item) => setItems((prev) => [...prev, item])} />

          {items.length > 0 && (
            <div className="flex justify-between items-center pt-3 border-t border-stone-100">
              <span className="text-sm font-medium text-stone-700">Total estimado</span>
              <span className="text-base font-bold text-stone-900">{formatPrice(subtotal)}</span>
            </div>
          )}
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            Erro ao criar encomenda. Verifique os dados e tente novamente.
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || items.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
        >
          {mutation.isPending && <Loader2 size={15} className="animate-spin" />}
          Criar encomenda
        </button>
      </form>
    </div>
  )
}
