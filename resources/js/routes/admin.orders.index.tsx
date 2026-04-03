import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight, Download, Plus, X } from 'lucide-react'
import { getOrders, bulkUpdateOrderStatus, exportOrdersCsv } from '~/lib/adminApi'
import { formatPrice, cn } from '~/lib/utils'
import { StatusBadge, PaymentBadge } from '~/components/admin/Badges'

export const Route = createFileRoute('/admin/orders/')({
  component: OrdersPage,
})

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os estados' },
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'processing', label: 'Em preparo' },
  { value: 'ready', label: 'Pronta' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelada' },
]

const BULK_STATUS_OPTIONS = STATUS_OPTIONS.filter((o) => o.value !== '')

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function monthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function OrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('confirmed')

  // CSV export
  const [showExport, setShowExport] = useState(false)
  const [exportFrom, setExportFrom] = useState(monthStart())
  const [exportTo, setExportTo] = useState(today())
  const [exporting, setExporting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', { page, status, search }],
    queryFn: () => getOrders({ page, status: status || undefined, search: search || undefined }),
    placeholderData: (prev) => prev,
  })

  const bulkMutation = useMutation({
    mutationFn: () => bulkUpdateOrderStatus(Array.from(selectedIds), bulkStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      setSelectedIds(new Set())
    },
  })

  async function handleExport() {
    setExporting(true)
    try {
      await exportOrdersCsv(exportFrom, exportTo)
      setShowExport(false)
    } finally {
      setExporting(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
  }

  const orders = data?.data ?? []
  const allChecked = orders.length > 0 && orders.every((o) => selectedIds.has(o.id))

  function toggleAll() {
    if (allChecked) setSelectedIds(new Set())
    else setSelectedIds(new Set(orders.map((o) => o.id)))
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Encomendas</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {data?.meta.total != null ? `${data.meta.total} no total` : '\u00a0'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExport(!showExport)}
            className={cn(
              'flex items-center gap-1.5 text-sm border px-3.5 py-2 rounded-xl transition-colors',
              showExport
                ? 'border-stone-300 bg-stone-100 text-stone-700'
                : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-600',
            )}
          >
            <Download size={14} /> Exportar
          </button>
          <Link
            to="/admin/orders/new"
            className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} /> Nova encomenda
          </Link>
        </div>
      </div>

      {/* CSV export panel */}
      {showExport && (
        <div className="flex items-center gap-3 mb-4 bg-white border border-stone-200 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-stone-600 shrink-0">Exportar CSV</p>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="date"
              value={exportFrom}
              onChange={(e) => setExportFrom(e.target.value)}
              className="text-sm border border-stone-200 rounded-lg bg-stone-50 px-3 py-1.5 focus:outline-none focus:border-primary-400 text-stone-700"
            />
            <span className="text-stone-300 text-sm">→</span>
            <input
              type="date"
              value={exportTo}
              onChange={(e) => setExportTo(e.target.value)}
              className="text-sm border border-stone-200 rounded-lg bg-stone-50 px-3 py-1.5 focus:outline-none focus:border-primary-400 text-stone-700"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-sm bg-stone-900 hover:bg-stone-800 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors shrink-0"
          >
            <Download size={13} /> {exporting ? 'A exportar…' : 'Descarregar'}
          </button>
          <button onClick={() => setShowExport(false)} className="text-stone-400 hover:text-stone-600 ml-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Referência, nome, telefone…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20"
          />
        </form>
        <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl px-1 py-1">
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => { setStatus(o.value); setPage(1) }}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap',
                status === o.value
                  ? 'bg-stone-900 text-white font-medium'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-stone-900 text-white px-5 py-3 rounded-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
          <span className="text-sm font-medium">{selectedIds.size} selecionada{selectedIds.size !== 1 ? 's' : ''}</span>
          <div className="w-px h-4 bg-stone-700" />
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="text-sm bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-white focus:outline-none"
          >
            {BULK_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => bulkMutation.mutate()}
            disabled={bulkMutation.isPending}
            className="text-sm bg-primary-500 hover:bg-primary-400 disabled:opacity-50 px-4 py-1.5 rounded-lg font-medium transition-colors"
          >
            {bulkMutation.isPending ? 'A guardar…' : 'Aplicar'}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto flex items-center gap-1 text-sm text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X size={14} /> Cancelar
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/60">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="rounded border-stone-300 text-primary-500 focus:ring-primary-400"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider">Referência</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider">Pagamento</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider">Total</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5" />
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 bg-stone-100 rounded animate-pulse" style={{ width: j === 1 ? '60%' : '80%' }} />
                      </td>
                    ))}
                    <td className="px-4 py-3.5">
                      <div className="h-3 bg-stone-100 rounded animate-pulse w-20" />
                    </td>
                  </tr>
                ))
              : orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate({ to: '/admin/orders/$id', params: { id: String(order.id) } })}
                    className={cn(
                      'cursor-pointer transition-colors group',
                      selectedIds.has(order.id)
                        ? 'bg-primary-50/60 hover:bg-primary-50'
                        : 'hover:bg-stone-50',
                    )}
                  >
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleOne(order.id)}
                        className="rounded border-stone-300 text-primary-500 focus:ring-primary-400"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-stone-400">{order.reference}</span>
                      {(order as any).order_type === 'event' && (
                        <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Evento</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-stone-800">{order.customer_name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{order.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3.5"><PaymentBadge status={order.payment_status} /></td>
                    <td className="px-4 py-3.5 text-right font-semibold text-stone-900">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-stone-500">
                        {new Date(order.created_at).toLocaleDateString('pt-MZ', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-stone-400">
                        {new Date(order.created_at).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {/* Empty state */}
        {!isLoading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center mb-3">
              <Search size={18} className="text-stone-300" />
            </div>
            <p className="text-sm font-medium text-stone-500">Nenhuma encomenda encontrada</p>
            <p className="text-xs text-stone-400 mt-1">Tente ajustar os filtros</p>
          </div>
        )}

        {/* Pagination */}
        {data && data.meta.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-stone-100 bg-stone-50/50">
            <p className="text-xs text-stone-400">
              Página <span className="font-medium text-stone-600">{data.meta.current_page}</span> de <span className="font-medium text-stone-600">{data.meta.last_page}</span>
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center border transition-colors',
                  page === 1 ? 'border-stone-100 text-stone-300' : 'border-stone-200 text-stone-600 hover:bg-stone-100',
                )}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === data.meta.last_page}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center border transition-colors',
                  page === data.meta.last_page ? 'border-stone-100 text-stone-300' : 'border-stone-200 text-stone-600 hover:bg-stone-100',
                )}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
