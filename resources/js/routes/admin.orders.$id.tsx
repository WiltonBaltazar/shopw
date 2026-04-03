import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Loader2, User, Phone, MapPin, Calendar, FileText, Printer, Link2, Check } from 'lucide-react'
import { getOrder, updateOrderStatus, updateOrderNotes, setPaymentDue, resetPayment } from '~/lib/adminApi'
import { formatPrice } from '~/lib/utils'
import { StatusBadge, PaymentBadge } from '~/components/admin/Badges'

export const Route = createFileRoute('/admin/orders/$id')({
  component: OrderDetailPage,
})

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'processing', label: 'Em preparo' },
  { value: 'ready', label: 'Pronta' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelada' },
]

function OrderDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin', 'orders', id],
    queryFn: () => getOrder(id),
  })

  const [selectedStatus, setSelectedStatus] = useState('')
  const [saved, setSaved] = useState(false)
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [notesSaved, setNotesSaved] = useState(false)
  const [notesInitialized, setNotesInitialized] = useState(false)

  if (order && !notesInitialized) {
    setAdminNotes(order.admin_notes ?? '')
    setNotesInitialized(true)
  }

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateOrderStatus(Number(id), status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const notesMutation = useMutation({
    mutationFn: (notes: string) => updateOrderNotes(Number(id), notes || null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', id] })
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    },
  })

  const currentStatus = selectedStatus || order?.status || ''

  function handleSaveStatus() {
    if (!selectedStatus || selectedStatus === order?.status) return
    statusMutation.mutate(selectedStatus)
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-stone-100 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-2xl border border-stone-200 h-64 animate-pulse" />
          <div className="bg-white rounded-2xl border border-stone-200 h-64 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!order) return null

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-content { padding: 0 !important; }
        }
      `}</style>

      <div className="p-8 max-w-5xl print-content">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 no-print">
          <button
            onClick={() => navigate({ to: '/admin/orders' })}
            className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors"
          >
            <ChevronLeft size={15} /> Encomendas
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl px-3 py-1.5 transition-colors"
          >
            <Printer size={14} /> Imprimir
          </button>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-serif text-3xl text-stone-900">{order.reference}</h1>
              {order.order_type === 'event' && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">Evento</span>
              )}
            </div>
            <p className="text-stone-500 text-sm">
              {new Date(order.created_at).toLocaleDateString('pt-MZ', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.payment_status} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Left: items + notes */}
          <div className="col-span-2 space-y-5">
            {/* Items */}
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h2 className="font-medium text-stone-900">Itens ({order.items?.length ?? 0})</h2>
              </div>
              <div className="divide-y divide-stone-100">
                {order.items?.map((item) => (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-stone-800">{item.product_name}</p>
                        {item.custom_notes && (
                          <p className="text-xs text-stone-400 mt-0.5">{item.custom_notes}</p>
                        )}
                        {item.addons?.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {item.addons.map((addon, i) => (
                              <p key={i} className="text-xs text-stone-500">
                                <span className="text-stone-400">{addon.name}:</span> {addon.value}
                                {addon.price > 0 && <span className="text-stone-400"> (+{formatPrice(addon.price)})</span>}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-6 shrink-0">
                        <p className="text-sm text-stone-500">× {item.quantity}</p>
                        <p className="font-medium text-stone-900">{formatPrice(item.subtotal)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-100 flex justify-between">
                <span className="text-sm font-medium text-stone-700">Total</span>
                <span className="text-base font-semibold text-stone-900">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Customer notes */}
            {order.notes && (
              <div className="bg-primary-50 border border-primary-100 rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-primary-600" />
                  <p className="text-sm font-medium text-primary-800">Notas do cliente</p>
                </div>
                <p className="text-sm text-primary-700">{order.notes}</p>
              </div>
            )}

            {/* Admin notes */}
            <div className="bg-white rounded-2xl border border-stone-200 px-5 py-4 no-print">
              <h2 className="font-medium text-stone-900 mb-3">Notas internas</h2>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Adicione notas internas sobre esta encomenda…"
                className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary-400 text-stone-700 resize-none placeholder:text-stone-300"
              />
              <button
                onClick={() => notesMutation.mutate(adminNotes)}
                disabled={notesMutation.isPending}
                className="mt-2 flex items-center gap-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                {notesMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                {notesSaved ? 'Guardado!' : 'Guardar notas'}
              </button>
            </div>
          </div>

          {/* Right: customer + status */}
          <div className="space-y-4">
            {/* Customer */}
            <div className="bg-white rounded-2xl border border-stone-200 px-5 py-4 space-y-3">
              <h2 className="font-medium text-stone-900 mb-3">Cliente</h2>
              <InfoRow icon={User} text={order.customer_name} />
              <InfoRow icon={Phone} text={order.customer_phone} />
              {order.customer_address && (
                <InfoRow icon={MapPin} text={order.customer_address} />
              )}
              {order.delivery_date && (
                <InfoRow icon={Calendar} text={new Date(order.delivery_date).toLocaleDateString('pt-MZ', { day: 'numeric', month: 'long', year: 'numeric' })} />
              )}
              {order.delivery_type === 'pickup' ? (
                <InfoRow icon={MapPin} text="Levantamento (sem taxa de entrega)" />
              ) : order.delivery_region ? (
                <InfoRow icon={MapPin} text={`Entrega — ${order.delivery_region.name}${order.delivery_fee ? ` (+${order.delivery_fee} MZN)` : ''}`} />
              ) : null}
              <div className="pt-2 border-t border-stone-100">
                <p className="text-xs text-stone-500 mb-1">Pagamento</p>
                <div className="flex items-center gap-2">
                  <PaymentBadge status={order.payment_status} />
                  {order.payment_method && (
                    <span className="text-xs text-stone-400 uppercase">{order.payment_method}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Status updater */}
            <div className="bg-white rounded-2xl border border-stone-200 px-5 py-4 no-print">
              <h2 className="font-medium text-stone-900 mb-3">Estado da encomenda</h2>
              <select
                value={currentStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400 text-stone-700 mb-3"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={handleSaveStatus}
                disabled={statusMutation.isPending || !selectedStatus || selectedStatus === order.status}
                className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-xl transition-colors"
              >
                {statusMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {saved ? 'Guardado!' : 'Guardar estado'}
              </button>
            </div>
          </div>
        </div>

        {/* Payment link section — event orders only */}
        {order.order_type === 'event' && (
          <PaymentLinkSection order={order} onSaved={() => queryClient.invalidateQueries({ queryKey: ['admin', 'orders', id] })} />
        )}
      </div>
    </>
  )
}

type PaymentMode = 'full' | 'split'

function PaymentLinkSection({ order, onSaved }: { order: any; onSaved: () => void }) {
  const amountPaid = order.amount_paid ?? 0
  const remaining = Math.max(0, order.total - amountPaid)
  const isSecondPayment = amountPaid > 0

  // For first payment only: choose mode
  const defaultMode: PaymentMode = order.payment_due && order.payment_due < remaining ? 'split' : 'full'
  const [mode, setMode] = useState<PaymentMode>(defaultMode)
  const [splitAmount, setSplitAmount] = useState(
    String(order.payment_due && order.payment_due < remaining ? order.payment_due : Math.round(remaining / 2))
  )
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const resetMut = useMutation({
    mutationFn: () => resetPayment(order.id),
    onSuccess: () => { onSaved(); setError('') },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Erro ao resetar.'),
  })

  const paymentUrl = order.payment_token
    ? `${window.location.origin}/pagar/${order.reference}?token=${order.payment_token}`
    : `${window.location.origin}/pagar/${order.reference}`

  // Second payment always charges remaining; first payment depends on mode
  const amount = isSecondPayment ? remaining : (mode === 'full' ? remaining : Number(splitAmount))
  const secondInstalment = (!isSecondPayment && mode === 'split') ? Math.max(0, remaining - Number(splitAmount)) : 0

  const mut = useMutation({
    mutationFn: () => setPaymentDue(order.id, amount),
    onSuccess: () => { onSaved(); setSaved(true); setError(''); setTimeout(() => setSaved(false), 2000) },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Erro ao guardar.'),
  })

  function copyUrl() {
    navigator.clipboard.writeText(paymentUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (remaining <= 0) {
    return (
      <div className="mt-5 bg-white rounded-2xl border border-stone-200 px-6 py-5 no-print">
        <h2 className="font-medium text-stone-900 mb-3">Pagamento do evento</h2>
        <div className="flex items-center gap-2 text-green-600 mb-1">
          <Check size={16} />
          <span className="text-sm font-medium">Pagamento totalmente concluído</span>
        </div>
        <p className="text-xs text-stone-400">Total pago: {formatPrice(order.total)}</p>
      </div>
    )
  }

  return (
    <div className="mt-5 bg-white rounded-2xl border border-stone-200 px-6 py-5 no-print">
      <h2 className="font-medium text-stone-900 mb-1">Pagamento do evento</h2>
      <p className="text-xs text-stone-400 mb-4">
        {isSecondPayment ? 'Gere o link para o pagamento restante.' : 'Defina o modo de pagamento e partilhe o link com o cliente.'}
      </p>

      {/* Payment progress — always visible */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-stone-500 mb-1.5">
          <span>Pago: <strong className="text-stone-700">{formatPrice(amountPaid)}</strong></span>
          <span>Total: <strong className="text-stone-700">{formatPrice(order.total)}</strong></span>
        </div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full transition-all"
            style={{ width: `${Math.min(100, (amountPaid / order.total) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-stone-400 mt-1">Restante: <strong className="text-stone-600">{formatPrice(remaining)}</strong></p>
      </div>

      {/* Stuck pending warning */}
      {order.mpesa_status === 'pending' && order.payment_status !== 'paid' && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">Transação M-Pesa em suspensão</p>
          <p className="text-xs text-amber-600 mb-2">
            O cliente não recebeu o pedido no telemóvel? Resete o pagamento para desbloquear.
          </p>
          <button
            onClick={() => resetMut.mutate()}
            disabled={resetMut.isPending}
            className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            {resetMut.isPending && <Loader2 size={11} className="animate-spin" />}
            Resetar pagamento
          </button>
        </div>
      )}

      {/* Second payment: just show the fixed amount, no mode choice */}
      {isSecondPayment ? (
        <div className="mb-4 bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-primary-700 mb-0.5">2.ª parte — valor a cobrar</p>
          <p className="text-2xl font-bold text-primary-800">{formatPrice(remaining)}</p>
        </div>
      ) : (
        <>
          {/* First payment: mode selector */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => { setMode('full'); setSaved(false) }}
              className={`flex flex-col items-center gap-1 border-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                mode === 'full'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              <span className="text-base">💳</span>
              <span>Pagamento total</span>
              <span className="text-xs font-normal opacity-70">{formatPrice(remaining)}</span>
            </button>
            <button
              onClick={() => { setMode('split'); setSaved(false) }}
              className={`flex flex-col items-center gap-1 border-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                mode === 'split'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300'
              }`}
            >
              <span className="text-base">✂️</span>
              <span>Em 2 partes</span>
              <span className="text-xs font-normal opacity-70">50% agora + 50% depois</span>
            </button>
          </div>

          {mode === 'split' && (
            <div className="mb-4 bg-stone-50 rounded-xl px-4 py-3 space-y-3">
              <p className="text-xs font-medium text-stone-600">1.ª parte (a cobrar agora)</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 border border-stone-200 bg-white rounded-xl px-3 py-2">
                  <span className="text-xs text-stone-400">MT</span>
                  <input
                    type="number"
                    value={splitAmount}
                    onChange={(e) => { setSplitAmount(e.target.value); setSaved(false) }}
                    min="1"
                    max={remaining - 1}
                    placeholder="0"
                    className="flex-1 text-sm focus:outline-none text-stone-800"
                  />
                </div>
                <button
                  onClick={() => setSplitAmount(String(Math.round(remaining / 2)))}
                  className="text-xs px-3 py-2 border border-stone-200 bg-white rounded-xl text-stone-600 hover:border-stone-400 transition-colors whitespace-nowrap"
                >
                  50%
                </button>
              </div>
              {secondInstalment > 0 && (
                <p className="text-xs text-stone-500">
                  2.ª parte (depois): <strong className="text-stone-700">{formatPrice(secondInstalment)}</strong>
                </p>
              )}
            </div>
          )}

          {mode === 'full' && (
            <p className="text-xs text-stone-500 mb-4">
              O cliente pagará o total de <strong className="text-stone-700">{formatPrice(remaining)}</strong> de uma só vez.
            </p>
          )}
        </>
      )}

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending || (!isSecondPayment && mode === 'split' && (!splitAmount || Number(splitAmount) <= 0 || Number(splitAmount) >= remaining))}
          className="flex items-center gap-1.5 text-sm bg-stone-800 hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors"
        >
          {mut.isPending && <Loader2 size={13} className="animate-spin" />}
          {saved ? 'Guardado!' : 'Gerar link de pagamento'}
        </button>
      </div>

      {order.payment_due && (
        <div className="mt-3 flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
          <Link2 size={13} className="text-stone-400 shrink-0" />
          <span className="text-xs text-stone-600 truncate flex-1">{paymentUrl}</span>
          <button
            onClick={copyUrl}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 shrink-0 font-medium"
          >
            {copied ? <><Check size={12} /> Copiado</> : 'Copiar'}
          </button>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-stone-400 mt-0.5 shrink-0" />
      <p className="text-sm text-stone-700">{text}</p>
    </div>
  )
}
