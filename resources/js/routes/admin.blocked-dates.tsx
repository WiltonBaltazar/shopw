import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import {
  getBlockedDates,
  createBlockedDates,
  deleteBlockedDate,
  updateSettings,
  type BlockedDate,
} from '~/lib/adminApi'
import { api } from '~/lib/api'

export const Route = createFileRoute('/admin/blocked-dates')({
  component: BlockedDatesPage,
})

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function BlockedDatesPage() {
  const queryClient = useQueryClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reason, setReason] = useState('')

  const { data: blockedDates = [], isLoading } = useQuery({
    queryKey: ['admin-blocked-dates'],
    queryFn: getBlockedDates,
  })

  const blockedSet = new Set(blockedDates.map((d) => d.date))

  const blockMutation = useMutation({
    mutationFn: ({ dates, reason }: { dates: string[]; reason?: string }) =>
      createBlockedDates(dates, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blocked-dates'] })
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] })
      setSelected(new Set())
      setReason('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBlockedDate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blocked-dates'] })
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] })
    },
  })

  const { data: blockedWeekdays = [] } = useQuery({
    queryKey: ['blocked-weekdays'],
    queryFn: () => api.get<{ data: number[] }>('/blocked-weekdays').then((r) => r.data.data),
  })

  const weekdayMutation = useMutation({
    mutationFn: (days: number[]) =>
      updateSettings({ blocked_weekdays: JSON.stringify(days) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-weekdays'] })
    },
  })

  function toggleWeekday(day: number) {
    const next = blockedWeekdays.includes(day)
      ? blockedWeekdays.filter((d) => d !== day)
      : [...blockedWeekdays, day]
    weekdayMutation.mutate(next)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function getDaysInMonth(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  function toggleDay(dateStr: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr)
      else next.add(dateStr)
      return next
    })
  }

  const { firstDay, daysInMonth } = getDaysInMonth(viewYear, viewMonth)

  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(viewYear, viewMonth, i + 1)
      return toDateStr(d)
    }),
  ]

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-stone-800 mb-1">Datas Bloqueadas</h1>
      <p className="text-stone-500 text-sm mb-8">
        Bloqueie dias em que não haverá entregas. Os clientes não poderão escolher essas datas ao encomendar.
      </p>

      <div className="space-y-6">
        {/* Weekday blocking */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-medium text-stone-800 mb-1">Dias da semana bloqueados</h2>
          <p className="text-stone-400 text-xs mb-4">
            Os clientes não poderão selecionar estes dias da semana ao encomendar.
          </p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((label, day) => {
              const isBlocked = blockedWeekdays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  disabled={weekdayMutation.isPending}
                  onClick={() => toggleWeekday(day)}
                  className={[
                    'px-4 py-2 rounded-xl text-sm font-medium transition-colors border',
                    isBlocked
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400',
                  ].join(' ')}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Calendar */}
        <section className="bg-white rounded-2xl border border-stone-200">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <button onClick={prevMonth} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <h2 className="font-medium text-stone-800 text-sm">
              {MONTHS[viewMonth]} {viewYear}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium text-stone-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((dateStr, idx) => {
                if (!dateStr) return <div key={idx} />

                const date = new Date(dateStr + 'T00:00:00')
                const isPast = date < today
                const isBlocked = blockedSet.has(dateStr)
                const isSelected = selected.has(dateStr)

                let cellClass = 'relative flex items-center justify-center h-9 w-full rounded-lg text-sm transition-colors'

                if (isPast) {
                  cellClass += ' text-stone-300 cursor-default'
                } else if (isBlocked) {
                  cellClass += ' bg-red-100 text-red-600 font-medium cursor-default line-through'
                } else if (isSelected) {
                  cellClass += ' bg-primary-500 text-white font-medium cursor-pointer'
                } else {
                  cellClass += ' text-stone-700 hover:bg-stone-100 cursor-pointer'
                }

                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isPast || isBlocked}
                    onClick={() => !isPast && !isBlocked && toggleDay(dateStr)}
                    className={cellClass}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Block action bar */}
          {selected.size > 0 && (
            <div className="px-6 py-4 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo (opcional)"
                className="flex-1 border border-stone-200 rounded-xl px-3.5 py-2 text-sm text-stone-800 placeholder-stone-300 outline-none focus:border-primary-400"
              />
              <button
                type="button"
                disabled={blockMutation.isPending}
                onClick={() => blockMutation.mutate({ dates: Array.from(selected), reason: reason || undefined })}
                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors whitespace-nowrap"
              >
                {blockMutation.isPending ? 'A bloquear...' : `Bloquear ${selected.size} ${selected.size === 1 ? 'data' : 'datas'}`}
              </button>
            </div>
          )}
        </section>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-red-100 inline-block" /> Bloqueada</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-primary-500 inline-block" /> Selecionada</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-stone-100 inline-block" /> Passada (não selecionável)</span>
        </div>

        {/* Blocked dates list */}
        <section className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          <div className="px-6 py-4">
            <h2 className="font-medium text-stone-800">Datas bloqueadas</h2>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-stone-100 rounded animate-pulse" />
              ))}
            </div>
          ) : blockedDates.length === 0 ? (
            <div className="p-6 text-center text-stone-400 text-sm">
              Nenhuma data bloqueada.
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {blockedDates.map((item: BlockedDate) => (
                <li key={item.id} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <span className="text-sm font-medium text-stone-800">
                      {new Date(item.date + 'T00:00:00').toLocaleDateString('pt-MZ', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                    {item.reason && (
                      <span className="ml-2 text-xs text-stone-400">— {item.reason}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="p-1.5 text-stone-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    title="Desbloquear"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
