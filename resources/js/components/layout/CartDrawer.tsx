import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '~/store/cart'
import { formatPrice } from '~/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
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
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-stone-400 px-4">
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
