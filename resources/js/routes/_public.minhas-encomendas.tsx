import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'
import { Heart, Phone, ChevronRight, ShoppingBag, Package } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useCustomerStore } from '~/store/customer'
import { useProductPreloadStore } from '~/store/productPreload'
import { useMyOrders, useMyFavorites } from '~/lib/hooks'
import { api } from '~/lib/api'
import { formatPrice } from '~/lib/utils'
import type { OrderSummary, CustomerFavorite } from '~/lib/types'

export const Route = createFileRoute('/_public/minhas-encomendas')({
  component: MyOrdersPage,
})

const PAYMENT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  paid:     { label: 'Pago',        color: 'text-emerald-700', bg: 'bg-emerald-50' },
  failed:   { label: 'Falhou',      color: 'text-red-700',     bg: 'bg-red-50'     },
  pending:  { label: 'Pendente',    color: 'text-amber-700',   bg: 'bg-amber-50'   },
  unpaid:   { label: 'Por pagar',   color: 'text-amber-700',   bg: 'bg-amber-50'   },
  refunded: { label: 'Reembolsado', color: 'text-stone-600',   bg: 'bg-stone-100'  },
}

const STATUS_LEFT_BORDER: Record<string, string> = {
  pending:   'border-l-amber-300',
  confirmed: 'border-l-blue-300',
  preparing: 'border-l-violet-400',
  ready:     'border-l-emerald-400',
  delivered: 'border-l-emerald-500',
  cancelled: 'border-l-stone-300',
}

const STATUS_LABELS_PT: Record<string, string> = {
  pending:   'Aguardando confirmação',
  confirmed: 'Confirmada',
  preparing: 'Em preparação',
  ready:     'Pronta para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelada',
}

function PhoneForm({ onSubmit }: { onSubmit: (phone: string) => Promise<void> }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const digits = value.replace(/\D/g, '')
    if (digits.length < 9) {
      setError('Introduza um número válido (mínimo 9 dígitos).')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSubmit(value.trim())
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Não foi possível iniciar sessão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <Helmet>
        <title>As minhas encomendas — Cheesemania</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center">
            <Package size={28} className="text-primary-500" />
          </div>
        </div>

        <h1 className="font-serif text-3xl font-semibold text-stone-900 mb-2 text-center">
          As minhas encomendas
        </h1>
        <p className="text-stone-500 text-sm text-center mb-8 leading-relaxed">
          Introduza o seu número de telefone para ver o histórico das suas encomendas e favoritos.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Phone size={16} className="text-stone-400" />
            </div>
            <input
              type="tel"
              inputMode="tel"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError('') }}
              placeholder="84 000 0000"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-xl text-stone-800 placeholder-stone-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 text-base tracking-wider text-center transition-all"
            />
          </div>
          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white font-medium py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 group"
          >
            {loading ? 'A entrar...' : 'Entrar'}
            {!loading && <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
          </button>
        </form>

        <p className="text-center mt-6">
          <Link to="/menu" className="text-primary-600 hover:text-primary-700 text-xs font-medium">
            Ver o menu →
          </Link>
        </p>
      </div>
    </div>
  )
}

function OrderCard({ order }: { order: OrderSummary }) {
  const payment = PAYMENT_LABELS[order.payment_status] ?? { label: order.payment_status, color: 'text-stone-500', bg: 'bg-stone-100' }
  const borderColor = STATUS_LEFT_BORDER[order.status] ?? 'border-l-stone-200'
  const needsAction = order.payment_status === 'failed' || order.payment_status === 'unpaid'

  return (
    <Link
      to="/encomenda/$reference"
      params={{ reference: order.reference }}
      className={`group flex items-stretch bg-white hover:bg-stone-50 rounded-2xl border-l-[3px] ${borderColor} shadow-sm hover:shadow transition-all overflow-hidden`}
    >
      <div className="flex-1 p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-medium text-stone-800 text-sm font-mono tracking-wide">
              #{order.reference}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {new Date(order.created_at).toLocaleDateString('pt-PT', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
          <p className="font-semibold text-stone-900 text-sm tabular-nums">{formatPrice(order.total)}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">
              {STATUS_LABELS_PT[order.status] ?? order.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${payment.bg} ${payment.color}`}>
              {payment.label}
            </span>
            {needsAction && (
              <span className="text-xs bg-primary-500 text-white px-2.5 py-0.5 rounded-full font-medium">
                Pagar
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center pr-3 text-stone-300 group-hover:text-stone-400 transition-colors">
        <ChevronRight size={16} />
      </div>
    </Link>
  )
}

function FavoriteCard({ favorite, phone }: { favorite: CustomerFavorite; phone: string }) {
  const navigate = useNavigate()
  const preloadStore = useProductPreloadStore()
  const queryClient = useQueryClient()
  const [removing, setRemoving] = useState(false)

  function handleOpen() {
    preloadStore.set({
      selectedValues: favorite.selected_values,
      flavourSelections: favorite.flavour_selections,
      addonValues: favorite.addon_values,
    })
    navigate({ to: '/produto/$slug', params: { slug: favorite.product_slug } })
  }

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    setRemoving(true)
    try {
      await api.delete(`/my-favorites/${favorite.id}`, { data: { phone } })
      queryClient.invalidateQueries({ queryKey: ['my-favorites', phone] })
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div
      onClick={handleOpen}
      className="group flex items-center gap-3 bg-white hover:bg-stone-50 rounded-2xl p-3.5 shadow-sm hover:shadow transition-all cursor-pointer"
    >
      {favorite.product_image ? (
        <img
          src={favorite.product_image}
          alt={favorite.product_name}
          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center text-2xl flex-shrink-0">
          🍰
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-serif font-medium text-stone-800 text-sm truncate leading-snug">
          {favorite.product_name}
        </p>
        {favorite.variant_label && (
          <p className="text-xs text-stone-400 mt-0.5 truncate">{favorite.variant_label}</p>
        )}
        <p className="text-xs font-semibold text-stone-700 mt-1 tabular-nums">
          {formatPrice(favorite.price)}
        </p>
      </div>
      <button
        onClick={handleRemove}
        disabled={removing}
        className="p-2 flex-shrink-0 text-primary-400 hover:text-primary-600 disabled:opacity-40 transition-colors"
        aria-label="Remover dos favoritos"
      >
        <Heart size={16} className="fill-current" />
      </button>
    </div>
  )
}

function ProfileView({ phone, onLogout }: { phone: string; onLogout: () => Promise<void> }) {
  const { data: orders, isLoading: ordersLoading, isError: ordersError } = useMyOrders(phone)
  const { data: favorites, isLoading: favLoading, isError: favError } = useMyFavorites(phone)
  const [loggingOut, setLoggingOut] = useState(false)
  const [tab, setTab] = useState<'orders' | 'favorites'>('orders')

  const activeOrders = orders?.filter(o => !['delivered', 'cancelled'].includes(o.status)) ?? []

  return (
    <div className="max-w-lg mx-auto px-4 py-10 pb-16">
      <Helmet>
        <title>As minhas encomendas — Cheesemania</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span className="text-primary-600 font-semibold text-lg">
            {phone.replace(/\D/g, '').slice(-2)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-xl font-semibold text-stone-900">O meu perfil</h1>
          <p className="text-xs text-stone-400 mt-0.5 font-mono tracking-wider">{phone}</p>
        </div>
        <button
          onClick={async () => {
            if (loggingOut) return
            setLoggingOut(true)
            try {
              await onLogout()
            } finally {
              setLoggingOut(false)
            }
          }}
          className="text-xs text-stone-400 hover:text-stone-600 underline flex-shrink-0 transition-colors"
        >
          {loggingOut ? 'A sair...' : 'Sair'}
        </button>
      </div>

      {/* Active orders banner */}
      {activeOrders.length > 0 && (
        <Link
          to="/encomenda/$reference"
          params={{ reference: activeOrders[0].reference }}
          className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-3.5 mb-6 hover:bg-amber-100/60 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          <span className="text-xs text-amber-800 font-medium flex-1">
            {activeOrders.length === 1
              ? `Encomenda #${activeOrders[0].reference} em curso`
              : `${activeOrders.length} encomendas em curso`}
          </span>
          <ChevronRight size={14} className="text-amber-500 flex-shrink-0" />
        </Link>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="font-serif text-2xl font-semibold text-stone-900 tabular-nums">
            {ordersLoading ? '—' : (orders?.length ?? 0)}
          </p>
          <p className="text-xs text-stone-400 mt-1">Encomendas</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="font-serif text-2xl font-semibold text-stone-900 tabular-nums">
            {favLoading ? '—' : (favorites?.length ?? 0)}
          </p>
          <p className="text-xs text-stone-400 mt-1">Favoritos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab('orders')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'orders'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Encomendas
          {orders && orders.length > 0 && (
            <span className="ml-1.5 text-[10px] text-stone-400">({orders.length})</span>
          )}
        </button>
        <button
          onClick={() => setTab('favorites')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            tab === 'favorites'
              ? 'bg-white text-stone-900 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Favoritos
          {favorites && favorites.length > 0 && (
            <span className="ml-1.5 text-[10px] text-stone-400">({favorites.length})</span>
          )}
        </button>
      </div>

      {/* Orders tab */}
      {tab === 'orders' && (
        <>
          {ordersLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[76px] bg-stone-100 rounded-2xl animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          )}
          {ordersError && (
            <p className="text-red-500 text-sm text-center py-12">
              Erro ao carregar encomendas.
            </p>
          )}
          {!ordersLoading && !ordersError && orders?.length === 0 && (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={22} className="text-stone-300" />
              </div>
              <p className="text-stone-400 text-sm mb-4">Nenhuma encomenda encontrada.</p>
              <Link to="/menu" className="text-primary-600 text-sm font-medium hover:underline">
                Ver o menu →
              </Link>
            </div>
          )}
          {!ordersLoading && orders && orders.length > 0 && (
            <div className="space-y-3">
              {orders.map((order) => <OrderCard key={order.reference} order={order} />)}
            </div>
          )}
        </>
      )}

      {/* Favorites tab */}
      {tab === 'favorites' && (
        <>
          {favLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-[76px] bg-stone-100 rounded-2xl animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          )}
          {favError && (
            <p className="text-red-500 text-sm text-center py-12">
              Erro ao carregar favoritos.
            </p>
          )}
          {!favLoading && !favError && favorites?.length === 0 && (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <Heart size={22} className="text-stone-300" />
              </div>
              <p className="text-stone-400 text-sm mb-2">Ainda não tem favoritos guardados.</p>
              <p className="text-xs text-stone-300 mb-4">
                Toque no <Heart size={11} className="inline" /> num produto para guardar.
              </p>
              <Link to="/menu" className="text-primary-600 text-sm font-medium hover:underline">
                Ver o menu →
              </Link>
            </div>
          )}
          {!favLoading && favorites && favorites.length > 0 && (
            <div className="space-y-3">
              {favorites.map((fav) => (
                <FavoriteCard key={fav.id} favorite={fav} phone={phone} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MyOrdersPage() {
  const phone = useCustomerStore((s) => s.phone)
  const token = useCustomerStore((s) => s.token)
  const setSession = useCustomerStore((s) => s.setSession)
  const clearSession = useCustomerStore((s) => s.clearSession)
  const [bootstrapping, setBootstrapping] = useState(false)

  useEffect(() => {
    if (!token || phone) return
    let active = true
    setBootstrapping(true)
    api.get<{ data: { phone: string } }>('/customer/me')
      .then(({ data }) => {
        if (!active) return
        setSession({ phone: data.data.phone, token })
      })
      .catch(() => {
        if (!active) return
        clearSession()
      })
      .finally(() => {
        if (active) setBootstrapping(false)
      })

    return () => {
      active = false
    }
  }, [token, phone, setSession, clearSession])

  async function handleLogin(phoneInput: string) {
    const { data } = await api.post<{ data: { phone: string; token: string } }>('/customer/login', { phone: phoneInput })
    setSession({ phone: data.data.phone, token: data.data.token })
  }

  async function handleLogout() {
    try {
      await api.post('/customer/logout')
    } catch {
      // Ignore backend errors; local logout should still happen.
    } finally {
      clearSession()
    }
  }

  if (bootstrapping) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-stone-500">
        A carregar conta...
      </div>
    )
  }

  if (!phone) return <PhoneForm onSubmit={handleLogin} />
  return <ProfileView phone={phone} onLogout={handleLogout} />
}
