import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ShoppingBag, X, ArrowRight } from 'lucide-react'
import { useCartStore } from '~/store/cart'
import { formatPrice } from '~/lib/utils'
import { cn } from '~/lib/utils'

const DURATION = 4500

export function CartToast({ onOpenCart }: { onOpenCart: () => void }) {
  const lastAdded = useCartStore((s) => s.lastAdded)
  const clearLastAdded = useCartStore((s) => s.clearLastAdded)
  const total = useCartStore((s) => s.total)
  const itemCount = useCartStore((s) => s.itemCount)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!lastAdded) return

    setVisible(true)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(clearLastAdded, 350)
    }, DURATION)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [lastAdded])

  if (!lastAdded) return null

  const itemPrice = (lastAdded.price + lastAdded.addons.reduce((s, a) => s + a.price, 0)) * lastAdded.quantity

  return (
    <div
      className={cn(
        'fixed bottom-24 right-4 z-[60] w-80 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none',
      )}
    >
      {/* Progress bar */}
      <div
        className="h-0.5 bg-primary-500 origin-left"
        style={{ animation: visible ? `shrink ${DURATION}ms linear forwards` : 'none' }}
      />
      <style>{`@keyframes shrink { from { transform: scaleX(1) } to { transform: scaleX(0) } }`}</style>

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Product image or icon */}
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0">
            {lastAdded.productImage ? (
              <img src={lastAdded.productImage} alt={lastAdded.productName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">🍰</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-0.5">Adicionado ao carrinho</p>
            <p className="text-sm font-medium text-stone-800 truncate">{lastAdded.productName}</p>
            <p className="text-xs text-stone-500">{lastAdded.variantLabel} · {formatPrice(itemPrice)}</p>
          </div>

          <button
            onClick={() => { setVisible(false); setTimeout(clearLastAdded, 350) }}
            className="p-1 text-stone-300 hover:text-stone-500 shrink-0 -mt-0.5"
          >
            <X size={14} />
          </button>
        </div>

        {/* CTAs */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { onOpenCart(); setVisible(false); setTimeout(clearLastAdded, 350) }}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-stone-700 border border-stone-200 rounded-xl py-2 hover:bg-stone-50 transition-colors"
          >
            <ShoppingBag size={12} />
            Ver carrinho ({itemCount()})
          </button>
          <Link
            to="/checkout"
            onClick={() => { setVisible(false); setTimeout(clearLastAdded, 350) }}
            className="flex-1 flex items-center justify-center gap-1 text-xs font-medium bg-primary-500 hover:bg-primary-400 text-white rounded-xl py-2 transition-colors"
          >
            Finalizar
            <ArrowRight size={12} />
          </Link>
        </div>

        <p className="text-center text-xs text-stone-400 mt-2">
          {formatPrice(total())} no total
        </p>
      </div>
    </div>
  )
}
