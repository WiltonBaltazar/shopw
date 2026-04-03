import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { CheckCircle, Clock, Package, Truck, XCircle, Check, AlertCircle, ChevronRight } from 'lucide-react'
import { useOrder } from '~/lib/hooks'
import { formatPrice } from '~/lib/utils'
import { api } from '~/lib/api'
import type { Order } from '~/lib/types'

const WHATSAPP_NUMBER_FALLBACK = '258840000000'

function useWhatsAppNumber(): string {
  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.get<{ data: { whatsapp_number: string } }>('/settings').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  return data?.whatsapp_number ?? WHATSAPP_NUMBER_FALLBACK
}

const WEEKDAYS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

function formatDeliveryDate(raw: string): string {
  const d = new Date(raw)
  if (isNaN(d.getTime())) return raw
  const weekday = WEEKDAYS_PT[d.getDay()]
  const date = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  return `${weekday}, ${date} às ${time}`
}

function buildWhatsAppMessage(order: Order): string {
  const lines: string[] = []

  lines.push(`*Nova Encomenda — Cheesemania*`)
  lines.push(``)
  lines.push(`*Referência:* ${order.reference}`)
  lines.push(`*Cliente:* ${order.customer_name ?? '—'}`)
  lines.push(`*Telefone:* ${order.customer_phone ?? '—'}`)
  if (order.customer_address) lines.push(`*Morada:* ${order.customer_address}`)
  if (order.delivery_type === 'pickup') {
    lines.push(`*Método:* Levantamento`)
  } else if (order.delivery_region) {
    lines.push(`*Região de entrega:* ${order.delivery_region.name}`)
  }
  if (order.delivery_date) lines.push(`*Data de entrega:* ${formatDeliveryDate(order.delivery_date)}`)
  if (order.delivery_fee && order.delivery_fee > 0) lines.push(`*Taxa de entrega:* ${formatPrice(order.delivery_fee)}`)
  lines.push(`*Pagamento:* ${order.payment_status === 'paid' ? 'Pago via M-Pesa' : 'Pendente'}`)
  lines.push(``)
  lines.push(`*Itens:*`)

  if (order.items && order.items.length > 0) {
    for (const item of order.items) {
      const label = item.variant_label ? ` (${item.variant_label})` : ''
      lines.push(`- ${item.product_name}${label} x${item.quantity} — ${formatPrice(item.subtotal)}`)
      for (const addon of item.addons?.filter((a) => a.value) ?? []) {
        const addonPrice = addon.price > 0 ? ` (+${formatPrice(addon.price)})` : ''
        lines.push(`  ${addon.addon_name}: ${addon.value}${addonPrice}`)
      }
      if (item.custom_notes) {
        lines.push(`  Nota: ${item.custom_notes}`)
      }
    }
  }

  lines.push(``)
  lines.push(`*Total: ${formatPrice(order.total)}*`)

  return lines.join('\n')
}

function whatsAppUrl(number: string, order: Order): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`
}

export const Route = createFileRoute('/_public/encomenda/$reference')({
  component: OrderPage,
})

// ── Status stepper ────────────────────────────────────────────────────────────

const ORDER_STEPS: { key: Order['status']; label: string }[] = [
  { key: 'pending',   label: 'Recebida'   },
  { key: 'confirmed', label: 'Confirmada' },
  { key: 'preparing', label: 'Preparação' },
  { key: 'ready',     label: 'Pronta'     },
  { key: 'delivered', label: 'Entregue'   },
]

function StatusStepper({ status }: { status: Order['status'] }) {
  if (status === 'cancelled') return null

  const currentIndex = ORDER_STEPS.findIndex((s) => s.key === status)

  return (
    <div className="relative flex items-start justify-between mb-8 px-2">
      {/* Background connector */}
      <div className="absolute top-4 left-6 right-6 h-0.5 bg-stone-200" />
      {/* Filled connector */}
      {currentIndex > 0 && (
        <div
          className="absolute top-4 left-6 h-0.5 bg-primary-400 transition-all duration-500"
          style={{ width: `calc(${(currentIndex / (ORDER_STEPS.length - 1)) * 100}% - 12px)` }}
        />
      )}

      {ORDER_STEPS.map((step, i) => {
        const isCompleted = i < currentIndex
        const isCurrent = i === currentIndex

        return (
          <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted
                  ? 'bg-primary-500 text-white shadow-sm shadow-primary-200'
                  : isCurrent
                  ? 'bg-primary-500 text-white ring-4 ring-primary-100 shadow-sm'
                  : 'bg-white text-stone-300 border-2 border-stone-200'
              }`}
            >
              {isCompleted ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>
            <span
              className={`text-[10px] font-medium text-center leading-tight ${
                isCurrent
                  ? 'text-primary-600'
                  : isCompleted
                  ? 'text-stone-500'
                  : 'text-stone-300'
              }`}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function OrderPage() {
  const { reference } = Route.useParams()
  const queryClient = useQueryClient()
  const { data: order, isLoading } = useOrder(reference)
  const whatsAppNumber = useWhatsAppNumber()
  const [verifying, setVerifying] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState('')

  // Poll every 10 seconds while pending/confirmed/preparing
  useEffect(() => {
    const active = order && ['pending', 'confirmed', 'preparing'].includes(order.status)
    if (!active) return
    const id = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['order', reference] })
    }, 10_000)
    return () => clearInterval(id)
  }, [order?.status, reference, queryClient])

  async function handleVerify() {
    setVerifying(true)
    setRetryError('')
    try {
      const { data } = await api.get(`/mpesa/verify/${reference}`)
      if (data.no_transaction) {
        setRetryError('Não foi possível confirmar — o pedido de pagamento não chegou ao M-Pesa. Use o botão abaixo para tentar novamente.')
      }
      queryClient.invalidateQueries({ queryKey: ['order', reference] })
    } finally {
      setVerifying(false)
    }
  }

  async function handleRetryPayment() {
    setRetrying(true)
    setRetryError('')
    try {
      await api.post(`/orders/${reference}/pay`)
      queryClient.invalidateQueries({ queryKey: ['order', reference] })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setRetryError(e.response?.data?.message ?? 'Erro ao iniciar pagamento. Tente novamente.')
    } finally {
      setRetrying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 space-y-4">
        <div className="h-6 bg-stone-100 rounded-full animate-pulse w-1/3" />
        <div className="h-32 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="h-24 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="h-24 bg-stone-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center text-stone-400">
        <Package size={32} className="mx-auto mb-4 text-stone-300" />
        <p className="text-sm">Encomenda não encontrada.</p>
      </div>
    )
  }

  const isCancelled = order.status === 'cancelled'
  const isPaid = order.payment_status === 'paid'
  const isPending = order.payment_status === 'pending' || order.payment_status === 'unpaid'
  const isFailed = order.payment_status === 'failed'

  return (
    <div className="max-w-lg mx-auto px-4 py-10 pb-16">
      <Helmet>
        <title>Encomenda #{order.reference} — Cheesemania</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Reference header */}
      <div className="flex items-center gap-2 mb-6">
        <Link to="/minhas-encomendas" className="text-stone-400 hover:text-stone-600 transition-colors">
          <ChevronRight size={16} className="rotate-180" />
        </Link>
        <span className="text-xs text-stone-400 font-mono tracking-wider">#{order.reference}</span>
      </div>

      {/* Status stepper */}
      {!isCancelled && <StatusStepper status={order.status} />}

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
          <XCircle size={20} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800 text-sm">Encomenda cancelada</p>
            <p className="text-xs text-red-500 mt-0.5">Esta encomenda foi cancelada.</p>
          </div>
        </div>
      )}

      {/* Payment pending notice */}
      {isPending && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <Clock size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 text-sm">Aguardando confirmação M-Pesa</p>
              <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                Verifique o seu telemóvel e introduza o PIN para confirmar o pagamento.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 pl-7">
            <button
              onClick={handleVerify}
              disabled={verifying || retrying}
              className="text-xs font-medium text-amber-700 hover:text-amber-900 underline disabled:opacity-50 text-left transition-colors"
            >
              {verifying ? 'A verificar...' : 'Já paguei — verificar agora'}
            </button>
            <button
              onClick={handleRetryPayment}
              disabled={retrying || verifying}
              className="text-xs font-medium text-amber-700 hover:text-amber-900 underline disabled:opacity-50 text-left transition-colors"
            >
              {retrying ? 'A iniciar pagamento...' : 'Não recebi o pedido — pagar agora'}
            </button>
          </div>
          {retryError && <p className="text-xs text-red-600 mt-3 pl-7">{retryError}</p>}
        </div>
      )}

      {/* Payment failed */}
      {isFailed && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 text-sm">Pagamento não concluído</p>
              <p className="text-xs text-red-500 mt-0.5">O pagamento anterior falhou. Tente novamente.</p>
            </div>
          </div>
          <button
            onClick={handleRetryPayment}
            disabled={retrying}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium py-3 rounded-xl transition-colors text-sm mt-1"
          >
            {retrying ? 'A iniciar pagamento...' : 'Pagar via M-Pesa'}
          </button>
          {retryError && <p className="text-xs text-red-600 mt-2">{retryError}</p>}
        </div>
      )}

      {/* Order summary card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
        <h2 className="font-serif text-base font-semibold text-stone-800 mb-4">Resumo</h2>
        <div className="space-y-3 text-sm">
          {order.customer_name && (
            <div className="flex justify-between items-center">
              <span className="text-stone-400 text-xs">Cliente</span>
              <span className="font-medium text-stone-800">{order.customer_name}</span>
            </div>
          )}
          {order.customer_phone && (
            <div className="flex justify-between items-center">
              <span className="text-stone-400 text-xs">Telefone</span>
              <span className="font-mono text-stone-700 text-xs">{order.customer_phone}</span>
            </div>
          )}
          {order.delivery_type === 'pickup' ? (
            <div className="flex justify-between items-center">
              <span className="text-stone-400 text-xs">Método</span>
              <span className="text-stone-700">Levantamento</span>
            </div>
          ) : order.delivery_region ? (
            <div className="flex justify-between items-center">
              <span className="text-stone-400 text-xs">Região</span>
              <span className="text-stone-700">{order.delivery_region.name}</span>
            </div>
          ) : null}
          {order.delivery_date && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-stone-400 text-xs flex-shrink-0">Data</span>
              <span className="text-stone-700 text-right text-xs leading-relaxed">
                {formatDeliveryDate(order.delivery_date)}
              </span>
            </div>
          )}

          <div className="border-t border-stone-100 pt-3 mt-3 space-y-2">
            {order.delivery_fee != null && order.delivery_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-stone-400 text-xs">Taxa de entrega</span>
                <span className="text-stone-600 tabular-nums">{formatPrice(order.delivery_fee)}</span>
              </div>
            )}
            {order.discount_amount != null && order.discount_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-stone-400 text-xs">
                  Desconto{order.coupon_code ? ` (${order.coupon_code})` : ''}
                </span>
                <span className="text-emerald-600 font-medium tabular-nums">
                  −{formatPrice(order.discount_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1">
              <span className="font-medium text-stone-700">Total</span>
              <span className="font-serif font-semibold text-stone-900 text-lg tabular-nums">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {/* Payment status badge */}
          <div className="flex justify-between items-center pt-1">
            <span className="text-stone-400 text-xs">Pagamento</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isPaid
                ? 'bg-emerald-50 text-emerald-700'
                : isFailed
                ? 'bg-red-50 text-red-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {isPaid ? 'Pago via M-Pesa' : isFailed ? 'Falhou' : 'Pendente'}
            </span>
          </div>
        </div>
      </div>

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
          <h2 className="font-serif text-base font-semibold text-stone-800 mb-4">Itens</h2>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className={`${i > 0 ? 'border-t border-stone-100 pt-4' : ''}`}>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 text-sm leading-snug">{item.product_name}</p>
                    {item.variant_label && (
                      <p className="text-xs text-stone-400 mt-0.5">{item.variant_label}</p>
                    )}
                    {item.addons?.filter((a) => a.value).map((a, j) => (
                      <p key={j} className="text-xs text-stone-400 mt-0.5">
                        {a.addon_name}: {a.value}
                      </p>
                    ))}
                    {item.custom_notes && (
                      <p className="text-xs text-stone-400 mt-1 italic">"{item.custom_notes}"</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-stone-800 text-sm tabular-nums">{formatPrice(item.subtotal)}</p>
                    <p className="text-xs text-stone-400">× {item.quantity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp CTA — paid orders */}
      {isPaid && (
        <a
          href={whatsAppUrl(whatsAppNumber, order)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 w-full text-white font-medium py-3.5 rounded-xl transition-colors text-sm mb-4"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Enviar encomenda via WhatsApp
        </a>
      )}

      {/* Navigation */}
      <div className="flex flex-col gap-3 mt-2">
        <Link
          to="/menu"
          className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          Fazer nova encomenda
        </Link>
        <Link
          to="/minhas-encomendas"
          className="block text-center text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          Ver todas as minhas encomendas
        </Link>
        {!isPaid && (
          <a
            href={`https://wa.me/${whatsAppNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Contactar via WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
