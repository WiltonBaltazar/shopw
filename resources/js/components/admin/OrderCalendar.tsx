import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, X, ArrowLeft } from 'lucide-react'
import { getCalendarOrders, getOrder, type CalendarOrder, type OrderDetail } from '~/lib/adminApi'
import { formatPrice, cn } from '~/lib/utils'
import { StatusBadge, PaymentBadge } from './Badges'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const STATUS_DOT: Record<string, string> = {
  pending:    'bg-amber-400',
  confirmed:  'bg-blue-500',
  processing: 'bg-orange-400',
  ready:      'bg-emerald-500',
  delivered:  'bg-stone-400',
  cancelled:  'bg-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente', confirmed: 'Confirmada', processing: 'Em preparo',
  ready: 'Pronta', delivered: 'Entregue', cancelled: 'Cancelada',
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const days: (number | null)[] = Array(firstDow).fill(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function OrderCalendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const { data: orders = [] } = useQuery({
    queryKey: ['admin', 'calendar', year, month],
    queryFn: () => getCalendarOrders(year, month),
  })

  const { data: orderDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'order', selectedOrderId],
    queryFn: () => getOrder(selectedOrderId!),
    enabled: !!selectedOrderId,
  })

  const ordersByDate = useMemo(() => {
    const map = new Map<string, CalendarOrder[]>()
    for (const o of orders) {
      const list = map.get(o.date) ?? []
      map.set(o.date, [...list, o])
    }
    return map
  }, [orders])

  const calendarDays = useMemo(() => buildCalendarDays(year, month), [year, month])

  const todayStr = dateStr(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const selectedDayOrders = selectedDay ? (ordersByDate.get(selectedDay) ?? []) : []

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  function openDay(day: number) {
    setSelectedDay(dateStr(year, month, day))
    setSelectedOrderId(null)
  }

  function closeModal() {
    setSelectedDay(null)
    setSelectedOrderId(null)
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-medium text-stone-900">Calendário de encomendas</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={16} className="text-stone-600" />
            </button>
            <span className="text-sm font-medium text-stone-700 w-40 text-center">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <ChevronRight size={16} className="text-stone-600" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-stone-100">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-stone-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const ds = day ? dateStr(year, month, day) : null
            const dayOrders = ds ? (ordersByDate.get(ds) ?? []) : []
            const isToday = ds === todayStr
            const visible = dayOrders.slice(0, 5)
            const extra = dayOrders.length - visible.length
            const isLastCol = i % 7 === 6

            return (
              <div
                key={i}
                onClick={() => day && openDay(day)}
                className={cn(
                  'min-h-[76px] p-2 border-b border-r border-stone-100',
                  isLastCol && 'border-r-0',
                  day ? 'cursor-pointer hover:bg-stone-50 transition-colors' : 'bg-stone-50/40',
                )}
              >
                {day && (
                  <>
                    <div className={cn(
                      'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1.5',
                      isToday ? 'bg-primary-500 text-white' : 'text-stone-600',
                    )}>
                      {day}
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      {visible.map((o, j) => (
                        <span
                          key={j}
                          className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_DOT[o.status] ?? 'bg-stone-300')}
                        />
                      ))}
                      {extra > 0 && (
                        <span className="text-[10px] text-stone-400 font-medium">+{extra}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t border-stone-100 flex flex-wrap gap-x-4 gap-y-1.5">
          {Object.entries(STATUS_DOT).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', color)} />
              <span className="text-xs text-stone-500">{STATUS_LABEL[status] ?? status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
              {selectedOrderId ? (
                <button
                  className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors"
                  onClick={() => setSelectedOrderId(null)}
                >
                  <ArrowLeft size={15} />
                  Todas as encomendas
                </button>
              ) : (
                <div>
                  <h3 className="font-medium text-stone-900 capitalize">
                    {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-PT', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {selectedDayOrders.length} encomenda{selectedDayOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
              <button
                onClick={closeModal}
                className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X size={16} className="text-stone-500" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1">
              {!selectedOrderId ? (
                selectedDayOrders.length === 0 ? (
                  <p className="px-6 py-10 text-sm text-stone-400 text-center">
                    Nenhuma encomenda neste dia.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {selectedDayOrders.map(o => (
                      <button
                        key={o.reference}
                        className="w-full text-left px-6 py-4 hover:bg-stone-50 transition-colors flex items-center gap-4"
                        onClick={() => setSelectedOrderId(String(o.id))}
                      >
                        <span
                          className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5', STATUS_DOT[o.status] ?? 'bg-stone-300')}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="font-mono text-xs text-stone-400">{o.reference}</span>
                            <StatusBadge status={o.status} />
                            <PaymentBadge status={o.payment_status} />
                          </div>
                          <p className="text-sm font-medium text-stone-800 truncate">{o.customer_name}</p>
                          <p className="text-xs text-stone-400">{o.customer_phone}</p>
                        </div>
                        <span className="text-sm font-semibold text-stone-900 flex-shrink-0">
                          {formatPrice(o.total)}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              ) : detailLoading ? (
                <div className="px-6 py-8 space-y-3">
                  {[75, 55, 90, 40].map((w, i) => (
                    <div key={i} className="h-4 bg-stone-100 rounded animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : orderDetail ? (
                <OrderDetailView order={orderDetail} />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function OrderDetailView({ order }: { order: OrderDetail }) {
  return (
    <div className="px-6 py-5 space-y-5">
      {/* Badges + reference */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-xs text-stone-400">{order.reference}</span>
        <StatusBadge status={order.status} />
        <PaymentBadge status={order.payment_status} />
      </div>

      {/* Customer info */}
      <div className="space-y-1 text-sm">
        <p className="font-semibold text-stone-900">{order.customer_name}</p>
        {order.customer_phone && <p className="text-stone-500">{order.customer_phone}</p>}
        {order.customer_address && <p className="text-stone-500">{order.customer_address}</p>}
        {order.delivery_date && (
          <p className="text-stone-500">
            Entrega:{' '}
            {new Date(order.delivery_date).toLocaleDateString('pt-PT', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}
        {order.notes && (
          <p className="text-stone-400 italic text-xs mt-1">{order.notes}</p>
        )}
      </div>

      {/* Items */}
      <div>
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Itens</p>
        <div className="space-y-0">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm py-2.5 border-b border-stone-100 last:border-0">
              <div className="min-w-0 pr-4">
                <p className="font-medium text-stone-800">{item.product_name}</p>
                {(item.addons ?? []).filter((a: any) => a.value).map((a: any, j: number) => (
                  <p key={j} className="text-xs text-stone-400">
                    {a.addon_name ?? a.name}: {a.value}
                  </p>
                ))}
                {item.custom_notes && (
                  <p className="text-xs text-stone-400 italic">{item.custom_notes}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-medium text-stone-700">{formatPrice(item.subtotal)}</p>
                <p className="text-xs text-stone-400">× {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-2 border-t border-stone-200">
        <span className="text-sm font-medium text-stone-700">Total</span>
        <span className="text-base font-bold text-stone-900">{formatPrice(order.total)}</span>
      </div>
    </div>
  )
}
