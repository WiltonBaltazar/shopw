import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ShoppingBag, ChevronRight, Leaf, Dumbbell, Heart, Check, Star, Clock } from 'lucide-react'
import type { ProductListItem, CustomerFavorite } from '~/lib/types'
import { formatPrice } from '~/lib/utils'
import { useCartStore } from '~/store/cart'

const WEEKDAY_LABELS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

interface Props {
  product: ProductListItem
  favorites?: CustomerFavorite[]
}

export function ProductCard({ product, favorites }: Props) {
  const [hovered, setHovered] = useState(false)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const hasFavorite = favorites?.some((f) => f.product_id === product.id) ?? false

  const isSimple = product.product_type === 'simple' && product.default_variant_id != null
  const deliveryWeekdayLabel = product.delivery_weekday != null
    ? WEEKDAY_LABELS_PT[product.delivery_weekday] ?? null
    : null

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isSimple || product.default_variant_id == null) return
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.primary_image?.url ?? '',
      deliveryWeekday: product.delivery_weekday ?? null,
      variantId: product.default_variant_id,
      variantLabel: '',
      attributes: {},
      addons: [],
      customNotes: '',
      price: product.price_range.min,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const imageObj = hovered && product.secondary_image
    ? product.secondary_image
    : product.primary_image

  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group block active:scale-[0.98] transition-all duration-150"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 shadow-sm group-hover:shadow-md transition-shadow duration-300">
        {imageObj ? (
          <img
            src={imageObj.url}
            alt={imageObj.alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 text-4xl">
            🍰
          </div>
        )}

        {/* Mobile: always-visible bottom bar */}
        <div className="absolute inset-x-0 bottom-0 p-2 md:hidden">
          {isSimple ? (
            <button
              onClick={handleQuickAdd}
              className={`w-full flex items-center justify-center gap-1 backdrop-blur-sm text-white text-[11px] font-semibold rounded-lg px-2.5 py-2 transition-colors ${added ? 'bg-emerald-600/90' : 'bg-stone-900/80'}`}
            >
              {added ? <><Check size={12} /> Adicionado!</> : <><ShoppingBag size={12} /> Adicionar ao carrinho</>}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-1 bg-stone-900/80 backdrop-blur-sm text-white text-[11px] font-semibold rounded-lg px-2.5 py-2">
              <ShoppingBag size={12} />
              Ver detalhes
              <ChevronRight size={12} className="ml-auto" />
            </div>
          )}
        </div>

        {/* Desktop: hover overlay CTA */}
        <div className="hidden md:block absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          {isSimple ? (
            <button
              onClick={handleQuickAdd}
              className={`w-full flex items-center justify-center gap-1.5 backdrop-blur-sm text-white text-xs font-semibold rounded-xl px-3 py-2.5 transition-colors ${added ? 'bg-emerald-600/90' : 'bg-stone-900/90'}`}
            >
              {added ? <><Check size={13} /> Adicionado!</> : <><ShoppingBag size={13} /> Adicionar ao carrinho</>}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-1.5 bg-stone-900/90 backdrop-blur-sm text-white text-xs font-semibold rounded-xl px-3 py-2.5">
              <ShoppingBag size={13} />
              Personalizar &amp; encomendar
            </div>
          )}
        </div>

        {/* Favorites indicator */}
        {hasFavorite && (
          <div className="absolute top-2.5 right-2.5">
            <span className="flex items-center justify-center w-7 h-7 bg-white/90 rounded-full shadow-sm">
              <Heart size={14} className="fill-primary-500 text-primary-500" />
            </span>
          </div>
        )}

        {/* Badges */}
        {(product.is_non_lactose || product.is_fitness) && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {product.is_non_lactose && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-emerald-500 text-white font-semibold shadow-sm leading-none">
                <Leaf size={10} strokeWidth={2.5} />
                Sem Lactose
              </span>
            )}
            {product.is_fitness && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-violet-500 text-white font-semibold shadow-sm leading-none">
                <Dumbbell size={10} strokeWidth={2.5} />
                Fitness
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 px-0.5">
        <h3 className="font-serif font-semibold text-stone-800 text-[15px] md:text-base leading-snug group-hover:text-primary-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-1 gap-2">
          <p className="text-sm text-stone-500 tabular-nums">
            {product.price_range.min === product.price_range.max
              ? formatPrice(product.price_range.min)
              : `A partir de ${formatPrice(product.price_range.min)}`}
          </p>
          {product.average_rating != null && product.reviews_count > 0 && (
            <span className="flex items-center gap-0.5 shrink-0">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              <span className="text-[11px] text-stone-500 tabular-nums">
                {product.average_rating.toFixed(1)}
                <span className="text-stone-300 ml-0.5">({product.reviews_count})</span>
              </span>
            </span>
          )}
        </div>
        {deliveryWeekdayLabel && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
            <Clock size={11} />
            Entrega apenas à {deliveryWeekdayLabel}
          </p>
        )}
      </div>
    </Link>
  )
}
