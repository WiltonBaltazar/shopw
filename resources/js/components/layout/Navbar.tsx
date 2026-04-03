import { useState, useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useCartStore } from '~/store/cart'
import { useSeoSettings } from '~/lib/hooks'
import { CartDrawer } from './CartDrawer'
import { CartToast } from './CartToast'

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const itemCount = useCartStore((s) => s.itemCount())
  const settings = useSeoSettings()
  const [bump, setBump] = useState(false)
  const prevCount = useRef(itemCount)
   const seo = useSeoSettings()
  const whatsapp = seo.whatsapp_number

  // Animate cart icon when item count increases
  useEffect(() => {
    if (itemCount > prevCount.current) {
      setBump(true)
      setTimeout(() => setBump(false), 400)
    }
    prevCount.current = itemCount
  }, [itemCount])

  return (
    <>
      <style>{`
        @keyframes cart-bump {
          0%   { transform: scale(1) }
          40%  { transform: scale(1.35) }
          70%  { transform: scale(0.92) }
          100% { transform: scale(1) }
        }
        .cart-bump { animation: cart-bump 0.4s cubic-bezier(0.36,0.07,0.19,0.97) }
      `}</style>

      <header className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            {settings.brand_logo_url
              ? <img src={settings.brand_logo_url} alt={settings.seo_site_name ?? 'Logo'} className="h-8 w-auto object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              : <span className="font-serif text-xl font-semibold text-stone-800 tracking-wide">{settings.seo_site_name || 'Cheesemania'}</span>
            }
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Início
            </Link>
            <Link to="/menu" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Loja
            </Link>
            <Link to="/blog" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Blog
            </Link>
            <Link to="/minhas-encomendas" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Minhas encomendas
            </Link>
            <Link to="/encomenda-evento" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Eventos
            </Link>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              Contacto
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 text-stone-600 hover:text-stone-900 transition-colors"
              aria-label="Carrinho"
            >
              <ShoppingCart
                size={20}
                className={bump ? 'cart-bump' : ''}
                key={bump ? 'bump' : 'idle'}
              />
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-primary-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1 transition-all duration-200">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2.5 text-stone-600"
              aria-label="Menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-stone-100 bg-white px-4 py-2 flex flex-col">
            <Link to="/" onClick={() => setMenuOpen(false)} className="text-sm text-stone-700 py-3">
              Início
            </Link>
            <Link to="/menu" onClick={() => setMenuOpen(false)} className="text-sm text-stone-700 py-3">
              Loja
            </Link>
            <Link to="/blog" onClick={() => setMenuOpen(false)} className="text-sm text-stone-700 py-3">
              Blog
            </Link>
            <Link to="/minhas-encomendas" onClick={() => setMenuOpen(false)} className="text-sm text-stone-700 py-3">
              Minhas encomendas
            </Link>
            <Link to="/encomenda-evento" onClick={() => setMenuOpen(false)} className="text-sm text-stone-700 py-3">
              Eventos
            </Link>
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-stone-700 py-3"
            >
              Contacto
            </a>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <CartToast onOpenCart={() => setCartOpen(true)} />
    </>
  )
}
