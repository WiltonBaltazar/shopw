import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'
import { usePaymentInfo } from '~/lib/hooks'
import { api } from '~/lib/api'
import { formatPrice } from '~/lib/utils'

export const Route = createFileRoute('/_public/pagar/$reference')({
  component: PaymentPage,
})

function PendingScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  const [showEscape, setShowEscape] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowEscape(true), 20000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="max-w-sm mx-auto px-4 py-24 text-center">
      <Helmet><title>Pagamento em Processamento — Cheesemania</title></Helmet>
      <Clock size={56} className="text-amber-500 mx-auto mb-6" />
      <h1 className="font-serif text-2xl font-semibold text-stone-800 mb-2">A aguardar confirmação</h1>
      <p className="text-stone-500 text-sm mb-6">{message || 'Confirme o pagamento no seu telemóvel com o PIN M-Pesa.'}</p>
      {showEscape && (
        <div className="mt-4 border-t border-stone-100 pt-5">
          <p className="text-xs text-stone-400 mb-3">Não recebeu o pedido no telemóvel?</p>
          <button
            onClick={onRetry}
            className="text-sm text-primary-600 underline underline-offset-2 hover:text-primary-700"
          >
            Tentar com outro número
          </button>
        </div>
      )}
    </div>
  )
}

function PaymentPage() {
  const { reference } = Route.useParams()
  const token = new URLSearchParams(window.location.search).get('token') ?? undefined
  const { data: info, isLoading, isError, refetch } = usePaymentInfo(reference, token)
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [paying, setPaying] = useState(false)
  const [payState, setPayState] = useState<'idle' | 'pending' | 'paid' | 'failed'>('idle')
  const [serverMessage, setServerMessage] = useState('')

  // Actively poll M-Pesa verify endpoint while pending so we don't rely solely on
  // the callback (which may not reach the server in dev or if misconfigured).
  useEffect(() => {
    if (payState !== 'pending') return
    const poll = async () => {
      try {
        const params = token ? { token } : {}
        const res = await api.get(`/mpesa/verify/${reference}`, { params })
        const status = res.data.payment_status
        if (status === 'paid') { setPayState('paid'); refetch() }
        else if (status === 'failed') {
          setPayState('failed')
          setServerMessage('Pagamento não foi confirmado. Tente novamente.')
          refetch()
        }
      } catch (_) { /* network error — keep polling */ }
    }
    poll() // check immediately on entering pending state
    const id = setInterval(poll, 8000)
    return () => clearInterval(id)
  }, [payState, reference, refetch, token])

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 9) { setPhoneError('Número inválido (mínimo 9 dígitos).'); return }
    setPhoneError('')
    setPaying(true)
    try {
      const res = await api.post(`/orders/${reference}/pay`, { phone: phone.trim(), token })
      const status = res.data.data?.payment_status ?? 'pending'
      const partialSuccess = res.data.data?.partial_payment === true
      setServerMessage(res.data.message ?? '')
      if (status === 'paid' || partialSuccess) setPayState('paid')
      else if (status === 'failed') setPayState('failed')
      else setPayState('pending')
      refetch()
    } catch (err: any) {
      setServerMessage(err?.response?.data?.message ?? 'Erro ao processar pagamento.')
      setPayState('failed')
    } finally {
      setPaying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center">
        <div className="h-8 w-48 bg-stone-100 rounded-xl animate-pulse mx-auto mb-4" />
        <div className="h-20 bg-stone-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (isError || !info) {
    const is403 = (isError as any)?.response?.status === 403
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center">
        <AlertCircle size={40} className="text-stone-300 mx-auto mb-4" />
        <p className="text-stone-500 text-sm">
          {is403
            ? 'Este link de pagamento é inválido ou já expirou. Solicite um novo link ao administrador.'
            : 'Encomenda não encontrada.'}
        </p>
      </div>
    )
  }

  if (info.payment_status === 'paid' || payState === 'paid') {
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center">
        <Helmet><title>Pagamento Confirmado — Cheesemania</title></Helmet>
        <CheckCircle size={56} className="text-green-500 mx-auto mb-6" />
        <h1 className="font-serif text-2xl font-semibold text-stone-800 mb-2">Pagamento confirmado!</h1>
        <p className="text-stone-500 text-sm mb-1">Referência: <strong>{reference}</strong></p>
        {info.order_type === 'event' && info.amount_paid < info.total && (
          <p className="text-xs text-stone-400 mt-3">
            Pago {formatPrice(info.amount_paid)} de {formatPrice(info.total)}. O restante será cobrado posteriormente.
          </p>
        )}
      </div>
    )
  }

  if (payState === 'pending') {
    return <PendingScreen message={serverMessage} onRetry={() => { setPayState('idle'); setServerMessage('') }} />
  }

  if (payState === 'failed') {
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center">
        <Helmet><title>Pagamento Falhado — Cheesemania</title></Helmet>
        <XCircle size={56} className="text-red-400 mx-auto mb-6" />
        <h1 className="font-serif text-2xl font-semibold text-stone-800 mb-2">Pagamento não processado</h1>
        <p className="text-stone-500 text-sm mb-6">{serverMessage || 'Não foi possível processar o pagamento. Verifique o número e tente novamente.'}</p>
        <button
          onClick={() => { setPayState('idle'); setServerMessage('') }}
          className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-3 rounded-full text-sm transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const amountDue = info.payment_due ?? info.total
  const remaining = info.total - info.amount_paid

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <Helmet>
        <title>Pagar Encomenda — Cheesemania</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Order info */}
      <div className="text-center mb-8">
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Encomenda</p>
        <p className="font-mono text-stone-700 font-semibold">{reference}</p>
        <p className="text-sm text-stone-500 mt-0.5">{info.customer_name}</p>
      </div>

      {/* Amount */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl px-6 py-6 text-center mb-6">
        {info.order_type === 'event' && info.total > amountDue ? (
          <p className="text-xs text-primary-600 font-medium mb-1">
            {info.amount_paid > 0 ? '2.ª parte — valor a pagar agora' : '1.ª parte — valor a pagar agora'}
          </p>
        ) : (
          <p className="text-xs text-primary-600 font-medium mb-1">Valor a pagar</p>
        )}
        <p className="font-serif text-4xl font-bold text-primary-700">{formatPrice(amountDue)}</p>
        {info.order_type === 'event' && info.amount_paid > 0 && (
          <p className="text-xs text-stone-500 mt-2">
            Já pago: {formatPrice(info.amount_paid)} · Total: {formatPrice(info.total)}
          </p>
        )}
        {info.order_type === 'event' && info.amount_paid === 0 && info.total > amountDue && (
          <p className="text-xs text-stone-500 mt-2">
            Total do evento: {formatPrice(info.total)} · 2.ª parte após este pagamento: {formatPrice(remaining - amountDue)}
          </p>
        )}
      </div>

      {/* Payment form */}
      <form onSubmit={handlePay} className="space-y-4">
        <div>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setPhoneError('') }}
            placeholder="Nº M-Pesa (ex: 84 000 0000)"
            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 text-center text-lg tracking-wider"
          />
          {phoneError && <p className="text-xs text-red-500 mt-1 text-center">{phoneError}</p>}
        </div>

        {payState === 'failed' && serverMessage && (
          <p className="text-sm text-red-500 text-center">{serverMessage}</p>
        )}

        <button
          type="submit"
          disabled={paying}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium py-3.5 rounded-xl transition-colors"
        >
          {paying ? 'A processar...' : 'Pagar com M-Pesa'}
        </button>
      </form>

      <p className="text-xs text-stone-400 text-center mt-6">
        Receberá uma notificação no telemóvel para confirmar o pagamento com o seu PIN M-Pesa.
      </p>
    </div>
  )
}
