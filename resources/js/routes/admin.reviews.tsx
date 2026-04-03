import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getReviews, updateReview, type AdminReview } from '~/lib/adminApi'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/admin/reviews')({
  component: ReviewsPage,
})

const TABS = [
  { label: 'Todas', value: '' },
  { label: 'Pendentes', value: '0' },
  { label: 'Aprovadas', value: '1' },
]

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={cn(i < rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200 fill-stone-200')}
        />
      ))}
    </div>
  )
}

function ReviewsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', { tab, page }],
    queryFn: () => getReviews({ is_approved: tab !== '' ? tab : undefined, page }),
    placeholderData: (prev) => prev,
  })

  const mutation = useMutation({
    mutationFn: ({ id, is_approved }: { id: number; is_approved: boolean }) => updateReview(id, is_approved),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
  })

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-stone-900">Avaliações</h1>
        <p className="text-stone-500 text-sm mt-1">
          {data?.meta.total != null ? `${data.meta.total} avaliações` : ''}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-stone-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value); setPage(1) }}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              tab === t.value ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-stone-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 space-y-2">
                <div className="h-3 w-36 bg-stone-100 rounded animate-pulse" />
                <div className="h-4 w-full bg-stone-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : !data?.data.length ? (
          <p className="text-center text-stone-400 text-sm py-12">Nenhuma avaliação encontrada.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {data.data.map((review) => (
              <ReviewRow key={review.id} review={review} onUpdate={(is_approved) => mutation.mutate({ id: review.id, is_approved })} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.meta.last_page > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-100">
            <p className="text-xs text-stone-500">Página {data.meta.current_page} de {data.meta.last_page}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className={cn('w-8 h-8 rounded-lg flex items-center justify-center border transition-colors', page === 1 ? 'border-stone-100 text-stone-300' : 'border-stone-200 hover:bg-stone-50 text-stone-600')}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === data.meta.last_page}
                className={cn('w-8 h-8 rounded-lg flex items-center justify-center border transition-colors', page === data.meta.last_page ? 'border-stone-100 text-stone-300' : 'border-stone-200 hover:bg-stone-50 text-stone-600')}
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

function ReviewRow({ review, onUpdate }: { review: AdminReview; onUpdate: (approved: boolean) => void }) {
  return (
    <div className="px-6 py-4 flex gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <Stars rating={review.rating} />
          <span className="text-sm font-medium text-stone-800">{review.customer_name}</span>
          {review.product && (
            <span className="text-xs text-stone-400">{review.product.name}</span>
          )}
          <span className="text-xs text-stone-400">
            {new Date(review.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {review.is_approved ? (
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">Aprovada</span>
          ) : (
            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">Pendente</span>
          )}
        </div>
        {review.body && <p className="text-sm text-stone-600 line-clamp-2">{review.body}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!review.is_approved ? (
          <button
            onClick={() => onUpdate(true)}
            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 border border-emerald-200 hover:border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Check size={12} /> Aprovar
          </button>
        ) : (
          <button
            onClick={() => onUpdate(false)}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <X size={12} /> Rejeitar
          </button>
        )}
      </div>
    </div>
  )
}
