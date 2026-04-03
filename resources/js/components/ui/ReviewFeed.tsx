import { ShieldCheck } from 'lucide-react'
import { StarRating } from './StarRating'
import type { ProductReview } from '~/lib/types'

interface ReviewFeedProps {
  reviews: ProductReview[]
  averageRating: number | null
  reviewsCount: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-MZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-right text-stone-500">{star}</span>
      <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-stone-400 text-xs">{pct}%</span>
    </div>
  )
}

export function ReviewFeed({ reviews, averageRating, reviewsCount }: ReviewFeedProps) {
  if (reviewsCount === 0) {
    return (
      <div className="py-10 text-center text-stone-400 text-sm">
        Ainda não há avaliações para este produto.
      </div>
    )
  }

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  return (
    <div className="space-y-8">
      {/* Aggregate header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <div className="flex flex-col items-center gap-1 min-w-[80px]">
          <span className="text-5xl font-bold text-stone-900 leading-none">
            {averageRating?.toFixed(1)}
          </span>
          <StarRating value={averageRating ?? 0} size={16} />
          <span className="text-xs text-stone-400">{reviewsCount} avaliações</span>
        </div>
        <div className="flex-1 w-full space-y-1.5">
          {distribution.map(({ star, count }) => (
            <RatingBar key={star} star={star} count={count} total={reviewsCount} />
          ))}
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-5">
        {reviews.map((review) => (
          <div key={review.id} className="border border-stone-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-900 text-sm">{review.customer_name}</span>
                  {review.verified_purchase && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <ShieldCheck size={11} />
                      Compra verificada
                    </span>
                  )}
                </div>
                <StarRating value={review.rating} size={14} />
              </div>
              <time className="text-xs text-stone-400 shrink-0">{formatDate(review.created_at)}</time>
            </div>

            {review.body && (
              <p className="text-stone-600 text-sm leading-relaxed">{review.body}</p>
            )}

            {review.photo_url && (
              <img
                src={review.photo_url}
                alt="Foto da avaliação"
                className="mt-2 rounded-xl w-32 h-32 object-cover border border-stone-100"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
