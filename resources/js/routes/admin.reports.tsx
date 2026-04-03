import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, ShoppingBag, DollarSign,
  BarChart2, ArrowDownToLine, Loader2,
} from 'lucide-react'
import { getReport, exportReportXlsx, type ReportData } from '~/lib/adminApi'
import { formatPrice, cn } from '~/lib/utils'

export const Route = createFileRoute('/admin/reports')({
  component: Reports,
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function monthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function subtractDays(from: string, n: number) {
  const d = new Date(from + 'T12:00:00')
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function lastMonthRange(): [string, string] {
  const d = new Date()
  const end = new Date(d.getFullYear(), d.getMonth(), 0)
  const start = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
}

function shortDay(day: string) {
  return new Date(day + 'T12:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}

const STATUS_LABELS: Record<string, string> = {
  pending:   'Pendente',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  processing:'A processar',
}

const STATUS_COLORS: Record<string, string> = {
  pending:    '#f59e0b',
  completed:  '#10b981',
  cancelled:  '#ef4444',
  processing: '#6366f1',
}

const PIE_FALLBACK = ['#e9c46a', '#f4845f', '#4ecdc4', '#a78bfa', '#fb7185']

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-medium text-stone-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-stone-600">
          <span className="inline-block w-3 h-3 rounded-sm mr-2" style={{ background: p.color }} />
          {p.name === 'revenue' ? formatPrice(p.value) : `${p.value} enc.`}
        </p>
      ))}
    </div>
  )
}

// ─── Delta badge ──────────────────────────────────────────────────────────────

function Delta({ pct }: { pct: number }) {
  const up = pct >= 0
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
      up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? '+' : ''}{pct}%
    </span>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, accent, delta,
}: { label: string; value: string; sub?: string; accent: string; delta?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-sm transition-shadow">
      <div className={cn('h-0.5', accent)} />
      <div className="p-5">
        <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-3">{label}</p>
        <p className="text-2xl font-bold text-stone-900 tracking-tight mb-1">{value}</p>
        <div className="flex items-center gap-2">
          {sub && <p className="text-xs text-stone-400">{sub}</p>}
          {delta !== undefined && <Delta pct={delta} />}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function Reports() {
  const today = todayStr()
  const [start, setStart] = useState(monthStart)
  const [end,   setEnd]   = useState(today)
  const [exporting, setExporting] = useState(false)

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ['admin', 'reports', start, end],
    queryFn: () => getReport(start, end),
    enabled: !!start && !!end,
  })

  function applyPreset(s: string, e: string) {
    setStart(s)
    setEnd(e)
  }

  async function handleExport() {
    setExporting(true)
    try { await exportReportXlsx(start, end) } finally { setExporting(false) }
  }

  const k = data?.kpis
  const c = data?.comparison

  const chartData = (data?.revenue_over_time ?? []).map((d) => ({ ...d, label: shortDay(d.day) }))

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">Análise</p>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <BarChart2 size={22} className="text-stone-400" />
            Relatórios
          </h1>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
        >
          {exporting
            ? <Loader2 size={14} className="animate-spin" />
            : <ArrowDownToLine size={14} />}
          Exportar XLSX
        </button>
      </div>

      {/* Date range bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { label: 'Últimos 7 dias',  s: subtractDays(today, 6), e: today },
            { label: 'Últimos 30 dias', s: subtractDays(today, 29), e: today },
            { label: 'Este mês',        s: monthStart(), e: today },
            { label: 'Mês passado',     s: lastMonthRange()[0], e: lastMonthRange()[1] },
          ].map(({ label, s, e }) => (
            <button
              key={label}
              onClick={() => applyPreset(s, e)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                start === s && end === e
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={start}
            max={end}
            onChange={(e) => setStart(e.target.value)}
            className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
          <span className="text-xs text-stone-400">→</span>
          <input
            type="date"
            value={end}
            min={start}
            max={today}
            onChange={(e) => setEnd(e.target.value)}
            className="text-xs border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <KpiCard
          label="Receita do período"
          value={isLoading ? '—' : formatPrice(k?.revenue ?? 0)}
          sub={c ? `vs ${formatPrice(c.prev_revenue)}` : undefined}
          accent="bg-emerald-500"
          delta={c?.revenue_change_pct}
        />
        <KpiCard
          label="Encomendas"
          value={isLoading ? '—' : String(k?.orders ?? 0)}
          sub={c ? `vs ${c.prev_orders} enc.` : undefined}
          accent="bg-primary-500"
          delta={c?.orders_change_pct}
        />
        <KpiCard
          label="Valor médio"
          value={isLoading ? '—' : formatPrice(k?.avg_order_value ?? 0)}
          accent="bg-violet-500"
          delta={c?.avg_order_change_pct}
        />
        <KpiCard
          label="Taxa de conclusão"
          value={isLoading ? '—' : `${k?.completed_pct ?? 0}%`}
          accent="bg-blue-500"
        />
        <KpiCard
          label="Pendentes"
          value={isLoading ? '—' : `${k?.pending_pct ?? 0}%`}
          accent="bg-amber-500"
        />
        <KpiCard
          label="Entrega / Recolha"
          value={isLoading ? '—' : `${k?.delivery_count ?? 0} / ${k?.pickup_count ?? 0}`}
          accent="bg-stone-400"
        />
      </div>

      {/* Revenue over time */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-medium text-stone-900">Receita ao longo do tempo</h2>
          <p className="text-xs text-stone-400 mt-0.5">Encomendas pagas</p>
        </div>
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="h-52 bg-stone-50 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#a8a29e' }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.floor(chartData.length / 10) - 1)}
                />
                <YAxis yAxisId="revenue" orientation="left" tick={{ fontSize: 10, fill: '#a8a29e' }} tickLine={false} axisLine={false} width={48} />
                <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 10, fill: '#a8a29e' }} tickLine={false} axisLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} />
                <Bar yAxisId="revenue" dataKey="revenue" name="revenue" fill="#e9c46a" radius={[3, 3, 0, 0]} maxBarSize={20} />
                <Line yAxisId="orders" dataKey="orders" name="orders" stroke="#f4845f" dot={false} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row: pie + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders by status */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="font-medium text-stone-900">Encomendas por estado</h2>
          </div>
          <div className="px-4 py-4">
            {isLoading ? (
              <div className="h-48 bg-stone-50 rounded-xl animate-pulse" />
            ) : !data?.orders_by_status.length ? (
              <p className="text-sm text-stone-400 text-center py-12">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.orders_by_status}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {data.orders_by_status.map((entry, i) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? PIE_FALLBACK[i % PIE_FALLBACK.length]}
                      />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => STATUS_LABELS[value] ?? value}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value, name) => [value, STATUS_LABELS[name as string] ?? name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100">
            <h2 className="font-medium text-stone-900">Top produtos</h2>
            <p className="text-xs text-stone-400 mt-0.5">Por quantidade vendida</p>
          </div>
          <div className="overflow-auto">
            {isLoading ? (
              <div className="p-6 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-stone-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !data?.top_products.length ? (
              <p className="text-sm text-stone-400 text-center py-12">Sem dados</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-stone-400 uppercase tracking-wider border-b border-stone-100">
                    <th className="px-6 py-2.5 font-medium">#</th>
                    <th className="px-2 py-2.5 font-medium">Produto</th>
                    <th className="px-2 py-2.5 font-medium text-right">Qtd</th>
                    <th className="px-6 py-2.5 font-medium text-right">Receita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data.top_products.map((p, i) => (
                    <tr key={p.product_name} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-3 text-stone-400 text-xs">{i + 1}</td>
                      <td className="px-2 py-3 font-medium text-stone-800 truncate max-w-[160px]">{p.product_name}</td>
                      <td className="px-2 py-3 text-right text-stone-600">{p.quantity}</td>
                      <td className="px-6 py-3 text-right text-stone-900 font-medium">{formatPrice(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
