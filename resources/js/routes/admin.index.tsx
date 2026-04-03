import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, ShoppingBag, Clock, Package, DollarSign, ChevronRight } from 'lucide-react'
import { getDashboard } from '~/lib/adminApi'
import { formatPrice, cn } from '~/lib/utils'
import { StatusBadge, PaymentBadge } from '~/components/admin/Badges'
import { OrderCalendar } from '~/components/admin/OrderCalendar'
import { RevenueChart } from '~/components/admin/RevenueChart'

export const Route = createFileRoute('/admin/')({
  component: Dashboard,
})

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getDashboard,
    refetchInterval: 60_000,
  })

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">{greeting}</p>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Dashboard</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <StatCard
          label="Encomendas hoje"
          value={isLoading ? '—' : String(data?.orders_today ?? 0)}
          icon={ShoppingBag}
          accent="bg-primary-500"
        />
        <StatCard
          label="Receita hoje"
          value={isLoading ? '—' : formatPrice(data?.revenue_today ?? 0)}
          icon={TrendingUp}
          accent="bg-emerald-500"
        />
        <StatCard
          label="Pendentes"
          value={isLoading ? '—' : String(data?.orders_pending ?? 0)}
          icon={Clock}
          accent="bg-amber-500"
          highlight={!!data?.orders_pending}
        />
        <StatCard
          label="Total encomendas"
          value={isLoading ? '—' : String(data?.orders_total ?? 0)}
          icon={Package}
          accent="bg-blue-500"
        />
        <StatCard
          label="Receita total"
          value={isLoading ? '—' : formatPrice(data?.revenue_total ?? 0)}
          icon={DollarSign}
          accent="bg-violet-500"
        />
        <StatCard
          label="Produtos ativos"
          value={isLoading ? '—' : String(data?.products_active ?? 0)}
          icon={Package}
          accent="bg-stone-400"
        />
      </div>

      {/* Revenue chart */}
      <div className="mb-8">
        <RevenueChart />
      </div>

      {/* Calendar */}
      <div className="mb-8">
        <OrderCalendar />
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-800">Últimas encomendas</h2>
          <Link to="/admin/orders" className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-0.5 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
            Ver todas <ChevronRight size={13} />
          </Link>
        </div>

        {isLoading ? (
          <div className="divide-y divide-stone-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center gap-4">
                <div className="h-4 w-28 bg-stone-100 rounded animate-pulse" />
                <div className="h-4 w-36 bg-stone-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-stone-100 rounded animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        ) : !data?.recent_orders.length ? (
          <p className="px-6 py-8 text-sm text-stone-400 text-center">Nenhuma encomenda ainda.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {data.recent_orders.map((order) => (
              <Link
                key={order.reference}
                to="/admin/orders"
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-stone-50 transition-colors group"
              >
                <span className="font-mono text-xs text-stone-500 w-28">{order.reference}</span>
                <span className="text-sm text-stone-700 flex-1 truncate">{order.customer_name}</span>
                <StatusBadge status={order.status} />
                <PaymentBadge status={order.payment_status} />
                <span className="text-sm font-medium text-stone-900 w-24 text-right">{formatPrice(order.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  highlight,
}: {
  label: string
  value: string
  icon: React.ElementType
  accent: string
  highlight?: boolean
}) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-sm',
      highlight ? 'border-amber-200 shadow-amber-50' : 'border-stone-200',
    )}>
      <div className={cn('h-0.5', accent)} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs text-stone-400 font-medium uppercase tracking-wider leading-none">{label}</p>
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center opacity-10', accent)}>
            <Icon size={14} className="text-stone-900" />
          </div>
        </div>
        <p className={cn('text-2xl font-bold tracking-tight', highlight ? 'text-amber-600' : 'text-stone-900')}>{value}</p>
      </div>
    </div>
  )
}
