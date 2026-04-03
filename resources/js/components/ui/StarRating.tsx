import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '~/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: number
  className?: string
}

/**
 * Dual-mode star component.
 *
 * - Read-only:  pass `value` with no `onChange`.
 * - Interactive: pass `onChange` to allow selection.
 *
 * Fractional values (e.g. 3.7) are rendered in read-only mode using
 * a clip-path trick so the filled portion matches the decimal.
 */
export function StarRating({ value, onChange, size = 20, className }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const interactive = typeof onChange === 'function'
  const display = interactive ? (hovered ?? value) : value

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role={interactive ? 'radiogroup' : undefined}
      aria-label={interactive ? 'Classificação por estrelas' : `${value} de 5 estrelas`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1

        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={value === starValue}
              aria-label={`${starValue} estrela${starValue > 1 ? 's' : ''}`}
              onClick={() => onChange(starValue)}
              onMouseEnter={() => setHovered(starValue)}
              onMouseLeave={() => setHovered(null)}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
            >
              <Star
                size={size}
                className={cn(
                  'transition-colors',
                  display >= starValue
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-stone-200 text-stone-200 hover:fill-amber-200 hover:text-amber-200',
                )}
              />
            </button>
          )
        }

        // Read-only with fractional support
        const fill = Math.min(1, Math.max(0, display - i))
        const clipId = `star-clip-${i}-${value}`

        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            {/* Background (empty) star */}
            <Star size={size} className="fill-stone-200 text-stone-200" />
            {/* Foreground (filled) star, clipped to the fill fraction */}
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star size={size} className="fill-amber-400 text-amber-400" />
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
