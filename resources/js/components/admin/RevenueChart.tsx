import { useQuery } from '@tanstack/react-query'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { getRevenueChart } from '~/lib/adminApi'
import { formatPrice } from '~/lib/utils'

function shortDay(day: string) {
  const d = new Date(day + 'T12:00:00')
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}

function CustomTooltip({ active, payload, label }: any) {
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

export function RevenueChart() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin', 'revenue-chart'],
    queryFn: getRevenueChart,
    refetchInterval: 120_000,
  })

  const chartData = data.map((d) => ({ ...d, label: shortDay(d.day) }))

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100">
        <h2 className="font-medium text-stone-900">Receita — últimos 30 dias</h2>
        <p className="text-xs text-stone-400 mt-0.5">Encomendas pagas</p>
      </div>
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="h-48 bg-stone-50 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#a8a29e' }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                yAxisId="revenue"
                orientation="left"
                tick={{ fontSize: 10, fill: '#a8a29e' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
                width={42}
              />
              <YAxis
                yAxisId="orders"
                orientation="right"
                tick={{ fontSize: 10, fill: '#a8a29e' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="revenue" dataKey="revenue" name="revenue" fill="#e9c46a" radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Line yAxisId="orders" dataKey="orders" name="orders" stroke="#f4845f" dot={false} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
