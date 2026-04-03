import { Link, useRouterState } from '@tanstack/react-router'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import { useCartStore } from '~/store/cart'
import { formatPrice, cn } from '~/lib/utils'

// Hide on checkout and order confirmation pages — they have their own CTAs
const HIDDEN_ON = ['/checkout', '/encomenda', '/produto']

export function StickyCartBar() {
  const { location } = useRouterState()
  const itemCount = useCartStore((s) => s.itemCount())
  const total = useCartStore((s) => s.total())

  const hidden = HIDDEN_ON.some((p) => location.pathname.startsWith(p))

  if (hidden || itemCount === 0) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 pb-safe pointer-events-none">
      <div className="max-w-lg mx-auto px-4 pb-4 pointer-events-auto">
        <Link
          to="/checkout"
          className={cn(
            'flex items-center gap-4 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl px-5 py-4 shadow-2xl transition-all duration-300',
            'translate-y-0 opacity-100',
          )}
        >
          <div className="relative">
            <ShoppingCart size={20} className="shrink-0" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-primary-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
              {itemCount}
            </span>
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold leading-none">Finalizar encomenda</p>
            <p className="text-xs text-stone-400 mt-0.5">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-bold">{formatPrice(total)}</span>
            <ArrowRight size={16} className="text-stone-400" />
          </div>
        </Link>
      </div>
    </div>
  )
}
