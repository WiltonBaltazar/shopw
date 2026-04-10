import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { X, Trash2, ShoppingBag, ChevronRight } from 'lucide-react'
import { useCartStore } from '~/store/cart'
import { useProducts } from '~/lib/hooks'
import { formatPrice } from '~/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

function CrossSell({ onClose }: { onClose: () => void }) {
  const cartItems = useCartStore((s) => s.items)
  const { data: products } = useProducts()

  const cartProductIds = new Set(cartItems.map((i) => i.productId))
  const suggestions = (products ?? [])
    .filter((p) => !cartProductIds.has(p.id) && p.primary_image)
    .slice(0, 3)

  if (suggestions.length === 0) return null

  return (
    <div className="px-5 py-4 border-t border-stone-100">
      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">
        Também vai gostar
      </p>
      <div className="space-y-3">
        {suggestions.map((p) => (
          <Link
            key={p.id}
            to="/produto/$slug"
            params={{ slug: p.slug }}
            onClick={onClose}
            className="flex items-center gap-3 group"
          >
            {p.primary_image && (
              <img
                src={p.primary_image.url}
                alt={p.name}
                loading="lazy"
                decoding="async"
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0 group-hover:opacity-90 transition-opacity"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate group-hover:text-primary-600 transition-colors">
                {p.name}
              </p>
              <p className="text-xs text-stone-400 tabular-nums mt-0.5">
                {p.price_range.min === p.price_range.max
                  ? formatPrice(p.price_range.min)
                  : `A partir de ${formatPrice(p.price_range.min)}`}
              </p>
            </div>
            <ChevronRight size={14} className="text-stone-300 group-hover:text-primary-400 flex-shrink-0 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}

export function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQuantity, total, itemCount } = useCartStore()

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-white shadow-xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h2 className="font-serif text-lg font-semibold text-stone-800">
            Carrinho {itemCount() > 0 && <span className="text-stone-400 font-sans text-sm font-normal">({itemCount()})</span>}
          </h2>
          <button onClick={onClose} className="p-3 -mr-2 text-stone-500 hover:text-stone-800" aria-label="Fechar carrinho">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-stone-400 px-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                  <ShoppingBag size={28} strokeWidth={1.2} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-stone-600">O carrinho está vazio</p>
                  <p className="text-xs text-stone-400 mt-1">Adicione cheesecakes para começar</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-sm font-medium text-white bg-primary-500 hover:bg-primary-400 px-5 py-2.5 rounded-xl transition-colors"
                >
                  Ver o menu
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.variantId}-${item.productId}`} className="flex gap-3">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      loading="lazy"
                      decoding="async"
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{item.productName}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{item.variantLabel}</p>
                    {item.addons.filter((a) => a.value).map((a, i) => (
                      <p key={i} className="text-xs text-stone-400">
                        {a.name}: {a.value}{a.price > 0 ? ` (+${formatPrice(a.price)})` : ''}
                      </p>
                    ))}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => item.quantity > 1 ? updateQuantity(item.variantId, item.quantity - 1) : removeItem(item.variantId)}
                          className="w-8 h-8 rounded-full border border-stone-200 text-stone-600 text-sm flex items-center justify-center hover:border-stone-400"
                          aria-label="Diminuir quantidade"
                        >
                          −
                        </button>
                        <span className="text-sm w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-stone-200 text-stone-600 text-sm flex items-center justify-center hover:border-stone-400"
                          aria-label="Aumentar quantidade"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-800">
                          {formatPrice((item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cross-sell — only when cart has items */}
          {items.length > 0 && <CrossSell onClose={onClose} />}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-stone-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Total</span>
              <span className="font-semibold text-stone-900">{formatPrice(total())}</span>
            </div>
            <Link
              to="/checkout"
              onClick={onClose}
              className="block w-full bg-primary-500 hover:bg-primary-600 active:bg-primary-600 text-white text-sm font-medium text-center py-3.5 rounded-xl transition-colors active:scale-[0.98]"
            >
              Finalizar Encomenda
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
