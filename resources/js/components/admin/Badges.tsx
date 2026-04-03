import { cn } from '~/lib/utils'

const STATUS_MAP: Record<string, { label: string; className: string; dot: string }> = {
  pending:    { label: 'Pendente',   className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',     dot: 'bg-amber-400' },
  confirmed:  { label: 'Confirmada', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',        dot: 'bg-blue-400' },
  processing: { label: 'Em preparo', className: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',  dot: 'bg-orange-400' },
  ready:      { label: 'Pronta',     className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-400' },
  delivered:  { label: 'Entregue',   className: 'bg-stone-50 text-stone-500 ring-1 ring-stone-200',     dot: 'bg-stone-300' },
  cancelled:  { label: 'Cancelada',  className: 'bg-red-50 text-red-600 ring-1 ring-red-200',           dot: 'bg-red-400' },
}

const PAYMENT_MAP: Record<string, { label: string; className: string; dot: string }> = {
  paid:    { label: 'Pago',     className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-400' },
  pending: { label: 'Pendente', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',       dot: 'bg-amber-400' },
  failed:  { label: 'Falhou',   className: 'bg-red-50 text-red-600 ring-1 ring-red-200',             dot: 'bg-red-400' },
}

export function StatusBadge({ status }: { status: string }) {
  const entry = STATUS_MAP[status] ?? { label: status, className: 'bg-stone-50 text-stone-500 ring-1 ring-stone-200', dot: 'bg-stone-300' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', entry.className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', entry.dot)} />
      {entry.label}
    </span>
  )
}

export function PaymentBadge({ status }: { status: string }) {
  const entry = PAYMENT_MAP[status] ?? { label: status, className: 'bg-stone-50 text-stone-500 ring-1 ring-stone-200', dot: 'bg-stone-300' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', entry.className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', entry.dot)} />
      {entry.label}
    </span>
  )
}
