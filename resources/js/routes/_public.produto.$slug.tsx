import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'
import { ChevronLeft, ChevronRight, ShoppingCart, Clock, Leaf, Dumbbell, Heart } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useProduct, useSeoSettings, useMyFavorites } from '~/lib/hooks'
import { useCartStore } from '~/store/cart'
import { useCustomerStore } from '~/store/customer'
import { useProductPreloadStore } from '~/store/productPreload'
import { api } from '~/lib/api'
import type { ProductAddon, ProductVariant } from '~/lib/types'
import { formatPrice, cn } from '~/lib/utils'
import { ReviewFeed } from '~/components/ui/ReviewFeed'
import { ReviewForm } from '~/components/ui/ReviewForm'

export const Route = createFileRoute('/_public/produto/$slug')({
  component: ProductPage,
})

const WEEKDAY_LABELS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

function ProductPage() {
  const { slug } = Route.useParams()
  const { data: product, isLoading } = useProduct(slug)
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)
  const seo = useSeoSettings()
  const phone = useCustomerStore((s) => s.phone)
  const preloadStore = useProductPreloadStore()
  const queryClient = useQueryClient()
  const { data: favorites } = useMyFavorites(phone)

  const [imageIndex, setImageIndex] = useState(0)
  const [selectedValues, setSelectedValues] = useState<Record<number, number>>({})
  const [addonValues, setAddonValues] = useState<Record<number, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [flavourSelections, setFlavourSelections] = useState<number[]>([])
  const [optimisticFavorited, setOptimisticFavorited] = useState<boolean | null>(null)
  const [showPhonePrompt, setShowPhonePrompt] = useState(false)

  // Mobile image carousel
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setImageIndex(idx)
  }, [])

  const scrollToImage = useCallback((idx: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
  }, [])

  // Personalização → Sabor multi-select
  const personalizacaoAttr = useMemo(
    () => product?.attributes.find((a) => a.name === 'Personalização'),
    [product],
  )
  const saborAttr = useMemo(
    () => product?.attributes.find((a) => a.name === 'Sabor'),
    [product],
  )

  const flavourCount = useMemo(() => {
    if (!personalizacaoAttr) return 0
    const selectedVal = personalizacaoAttr.values.find(
      (v) => v.id === selectedValues[personalizacaoAttr.id],
    )
    if (!selectedVal) return 0
    const match = selectedVal.value.match(/^(\d+)/)
    return match ? parseInt(match[1]) : 0
  }, [personalizacaoAttr, selectedValues])

  function toggleFlavour(valueId: number) {
    setFlavourSelections((prev) => {
      if (prev.includes(valueId)) return prev.filter((id) => id !== valueId)
      if (prev.length >= flavourCount) return prev
      return [...prev, valueId]
    })
  }

  // Build a set of hidden/disabled value ids from option_rules
  const { disabledValueIds, hiddenValueIds } = useMemo(() => {
    const disabled = new Set<number>()
    const hidden = new Set<number>()
    if (!product) return { disabledValueIds: disabled, hiddenValueIds: hidden }

    for (const rule of product.option_rules) {
      const condAttr = product.attributes.find((a) =>
        a.values.some((v) => v.id === rule.condition_value_id),
      )
      if (!condAttr) continue
      const selectedForCond = selectedValues[condAttr.id]
      if (selectedForCond === rule.condition_value_id) {
        if (rule.rule_type === 'disable') disabled.add(rule.target_value_id)
        else hidden.add(rule.target_value_id)
      }
    }
    return { disabledValueIds: disabled, hiddenValueIds: hidden }
  }, [product, selectedValues])

  // Resolve matching variant
  const matchedVariant: ProductVariant | null = useMemo(() => {
    if (!product) return null

    // Simple products have exactly one variant with no attribute requirements
    if (product.product_type === 'simple') return product.variants[0] ?? null

    const selectedIds = Object.values(selectedValues)
    if (selectedIds.length === 0) return null

    // Only match against attributes that are actually used in variants
    const variantAttrIds = getVariantAttrIds(product)
    const relevantIds = selectedIds.filter((id) => {
      const attr = product.attributes.find((a) => a.values.some((v) => v.id === id))
      return attr && variantAttrIds.has(attr.id)
    })
    if (relevantIds.length === 0) return null

    return (
      product.variants.find((v) =>
        relevantIds.every((id) => v.attribute_value_ids.includes(id)),
      ) ?? null
    )
  }, [product, selectedValues])

  const variantAttrIds = useMemo(() => {
    if (!product) return new Set<number>()
    return getVariantAttrIds(product)
  }, [product])

  // Apply preloaded favorite config once when product data is available
  useEffect(() => {
    if (!product) return
    const preload = preloadStore.consume()
    if (!preload) return
    setSelectedValues(preload.selectedValues)
    setFlavourSelections(preload.flavourSelections)
    setAddonValues(preload.addonValues)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!product])

  const isFavorited = useMemo(() => {
    if (optimisticFavorited !== null) return optimisticFavorited
    if (!matchedVariant || !favorites) return false
    return favorites.some((f) => f.variant_id === matchedVariant.id)
  }, [optimisticFavorited, matchedVariant, favorites])

  // Reset optimistic state when variant changes
  useEffect(() => {
    setOptimisticFavorited(null)
  }, [matchedVariant?.id])

  async function handleToggleFavorite() {
    if (!phone) {
      setShowPhonePrompt(true)
      setTimeout(() => setShowPhonePrompt(false), 3000)
      return
    }
    if (!matchedVariant || !product) return

    if (isFavorited) {
      const fav = favorites?.find((f) => f.variant_id === matchedVariant.id)
      if (!fav) return
      setOptimisticFavorited(false)
      try {
        await api.delete(`/my-favorites/${fav.id}`, { data: { phone } })
        queryClient.invalidateQueries({ queryKey: ['my-favorites', phone] })
      } catch {
        setOptimisticFavorited(null)
      }
    } else {
      setOptimisticFavorited(true)
      try {
        await api.post('/my-favorites', {
          phone,
          product_id: product.id,
          product_slug: product.slug,
          product_name: product.name,
          product_image: product.images[0]?.url ?? null,
          variant_id: matchedVariant.id,
          variant_label: buildVariantLabel(),
          price: matchedVariant.price,
          selected_values: selectedValues,
          flavour_selections: flavourSelections,
          addon_values: addonValues,
        })
        queryClient.invalidateQueries({ queryKey: ['my-favorites', phone] })
      } catch {
        setOptimisticFavorited(null)
      }
    }
  }

  const priceToShow = matchedVariant
    ? matchedVariant.price
    : product
    ? Math.min(...product.variants.map((v) => v.price))
    : 0

  function handleSelectValue(attrId: number, valueId: number) {
    setSelectedValues((prev) => ({ ...prev, [attrId]: valueId }))
    if (personalizacaoAttr && attrId === personalizacaoAttr.id) {
      setFlavourSelections([])
    }
  }

  function buildVariantLabel(): string {
    if (!product) return ''
    return product.attributes
      .filter((a) => variantAttrIds.has(a.id))
      .map((a) => {
        const valId = selectedValues[a.id]
        const val = a.values.find((v) => v.id === valId)
        return val ? val.value : ''
      })
      .filter(Boolean)
      .join(' · ')
  }

  function buildAddonsForCart() {
    if (!product) return []
    const result: { id: number; name: string; value: string; price: number }[] = []

    // Standard addons
    for (const addon of product.addons) {
      const value = addonValues[addon.id] ?? ''
      if (!value) continue
      result.push({
        id: addon.id,
        name: addon.name,
        value,
        price: addon.type === 'checkbox' && value === 'yes' ? addon.price : 0,
      })
    }

    // Flavour selections from Sabor attribute
    if (saborAttr && flavourSelections.length > 0) {
      const names = flavourSelections
        .map((id) => saborAttr.values.find((v) => v.id === id)?.value)
        .filter(Boolean)
      result.push({
        id: -1,
        name: 'Sabores',
        value: names.join(', '),
        price: 0,
      })
    }

    return result
  }

  const flavoursFilled = flavourCount === 0 || flavourSelections.length === flavourCount

  // Which attribute hasn't been selected yet? Checks all shown attributes, not just variant-driving ones.
  const firstMissingAttrName = useMemo(() => {
    if (!product || product.product_type === 'simple') return null
    const missing = product.attributes
      .filter((a) => a.name !== 'Sabor')
      .find((a) => selectedValues[a.id] == null)
    if (missing) return missing.name
    if (saborAttr && flavourCount > 0 && !flavoursFilled) return 'Sabor'
    return null
  }, [product, selectedValues, saborAttr, flavourCount, flavoursFilled])

  // Earliest possible delivery date (always tomorrow)
  const earliestDelivery = useMemo(() => {
    const candidate = new Date()
    candidate.setDate(candidate.getDate() + 1)
    return candidate.toLocaleDateString('pt-MZ', { weekday: 'long', day: 'numeric', month: 'long' })
  }, [])

  function handleAddToCart() {
    if (!product || !matchedVariant) return

    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0]?.url ?? '',
      deliveryWeekday: product.delivery_weekday ?? null,
      variantId: matchedVariant.id,
      variantLabel: buildVariantLabel(),
      attributes: Object.fromEntries(
        product.attributes
          .filter((a) => variantAttrIds.has(a.id))
          .map((a) => [a.name, a.values.find((v) => v.id === selectedValues[a.id])?.value ?? '']),
      ),
      addons: buildAddonsForCart(),
      customNotes: product.addons.find((a) => a.type === 'text')
        ? addonValues[product.addons.find((a) => a.type === 'text')!.id] ?? ''
        : '',
      price: matchedVariant.price,
      quantity,
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-12">
        <div className="aspect-square rounded-2xl bg-stone-100 animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 bg-stone-100 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-stone-100 rounded animate-pulse w-1/3" />
          <div className="h-24 bg-stone-100 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center text-stone-400">
        Produto não encontrado.
      </div>
    )
  }

  const images = product.images
  const canAddToCart =
    matchedVariant !== null &&
    matchedVariant.is_available &&
    flavoursFilled &&
    firstMissingAttrName === null
  const deliveryWeekdayLabel = product.delivery_weekday != null
    ? WEEKDAY_LABELS_PT[product.delivery_weekday] ?? null
    : null

  const productTitle = product.seo_title ?? `${product.name} — ${seo.seo_site_name}`
  const productDescription = product.seo_description
    ?? (product.description ? product.description.slice(0, 155) : `${product.name} Homemade feito em Maputo. Encomende online com entrega ao domicílio.`)
  const productImage = product.primary_image?.url ?? seo.seo_og_image ?? ''
  const productUrl = `${window.location.origin}/produto/${product.slug}`

  const sellerRef = {
    '@type': 'LocalBusiness',
    name: seo.seo_site_name,
    url: window.location.origin,
    addressLocality: 'Maputo',
    addressCountry: 'MZ',
  }

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? productDescription,
    image: productImage || undefined,
    brand: { '@type': 'Brand', name: seo.seo_site_name },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: product.price_range.min,
      highPrice: product.price_range.max,
      priceCurrency: 'MZN',
      availability: 'https://schema.org/InStock',
      seller: sellerRef,
      areaServed: [
        { '@type': 'City', name: 'Maputo' },
        { '@type': 'City', name: 'Matola' },
      ],
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Menu', item: `${window.location.origin}/menu` },
      { '@type': 'ListItem', position: 2, name: product.name, item: productUrl },
    ],
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Helmet>
        <title>{productTitle}</title>
        <meta name="description" content={productDescription} />
        <link rel="canonical" href={productUrl} />
        <meta property="og:title" content={productTitle} />
        <meta property="og:description" content={productDescription} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={productUrl} />
        {productImage && <meta property="og:image" content={productImage} />}
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <button
        onClick={() => navigate({ to: '/menu' })}
        className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-6 md:mb-8 py-2 -ml-2 pl-2 pr-3 rounded-lg transition-colors active:bg-stone-50"
      >
        <ChevronLeft size={16} /> Menu
      </button>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Images */}
        <div className="space-y-3">
          {/* Mobile: swipeable carousel */}
          <div className="md:hidden -mx-4">
            <div
              ref={scrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              onScroll={handleScroll}
            >
              {images.length > 0 ? images.map((img, i) => (
                <div key={img.id} className="w-full flex-shrink-0 snap-center">
                  <div className="aspect-[4/5] bg-stone-100">
                    <img
                      src={img.url}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                </div>
              )) : (
                <div className="w-full flex-shrink-0">
                  <div className="aspect-[4/5] bg-stone-100 flex items-center justify-center text-stone-200 text-6xl">🍰</div>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToImage(i)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-200 p-2.5 -m-2.5 box-content',
                      i === imageIndex ? 'bg-primary-500 w-4' : 'bg-stone-300',
                    )}
                    aria-label={`Imagem ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop: static image with arrows + thumbnails */}
          <div className="hidden md:block">
            <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100 relative">
              {images[imageIndex] ? (
                <img
                  src={images[imageIndex].url}
                  alt={images[imageIndex].alt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-200 text-6xl">🍰</div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setImageIndex((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/80 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setImageIndex(i)}
                    className={cn(
                      'w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors',
                      i === imageIndex ? 'border-primary-400' : 'border-transparent',
                    )}
                  >
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info & selectors */}
        <div className="relative">
          {/* Favorite heart button */}
          {matchedVariant && (
            <div className="absolute top-0 right-0">
              <button
                onClick={handleToggleFavorite}
                className="p-3 rounded-full hover:bg-stone-100 transition-colors"
                aria-label={isFavorited ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
              >
                <Heart
                  size={22}
                  className={isFavorited ? 'fill-primary-500 text-primary-500' : 'text-stone-400'}
                />
              </button>
              {showPhonePrompt && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-stone-800 text-white text-xs rounded-xl px-3 py-2.5 shadow-lg z-10">
                  <Link to="/minhas-encomendas" className="underline">Inicie sessão</Link> com o seu número para guardar favoritos.
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-2">{product.category.name}</p>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-stone-900 mb-3">{product.name}</h1>

          {(product.is_non_lactose || product.is_fitness) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {product.is_non_lactose && (
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  <Leaf size={12} strokeWidth={2.5} />
                  Sem Lactose
                </span>
              )}
              {product.is_fitness && (
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-semibold">
                  <Dumbbell size={12} strokeWidth={2.5} />
                  Fitness
                </span>
              )}
            </div>
          )}

          <p className="text-2xl font-light text-stone-700 mb-4">
            {matchedVariant
              ? formatPrice(matchedVariant.price)
              : `A partir de ${formatPrice(Math.min(...product.variants.map((v) => v.price)))}`}
          </p>

          <p className="text-sm md:text-base text-stone-500 leading-relaxed whitespace-pre-line mb-6">
            {product.description}
          </p>

          {product.requires_advance_order && (
            <div className="flex items-center gap-2 text-xs text-primary-700 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2 mb-6">
              <Clock size={14} />
              <span>
                Encomende agora · <span className="font-semibold">Receba a partir de {earliestDelivery}</span>
              </span>
            </div>
          )}

          {deliveryWeekdayLabel && (
            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6">
              <Clock size={14} />
              <span>
                Disponível para entrega apenas à <span className="font-semibold">{deliveryWeekdayLabel}</span>.
              </span>
            </div>
          )}

          {/* Attribute selectors (skip Sabor — rendered as multi-select below; skip for simple products) */}
          {product.product_type !== 'simple' && product.attributes.filter((a) => a.name !== 'Sabor').map((attr) => (
            <div key={attr.id} className="mb-5">
              <p className="text-sm font-medium text-stone-700 mb-2">{attr.name}</p>
              <div className="flex flex-wrap gap-2">
                {attr.values
                  .filter((v) => !hiddenValueIds.has(v.id))
                  .map((val) => {
                    const isDisabled = disabledValueIds.has(val.id)
                    const isSelected = selectedValues[attr.id] === val.id
                    return (
                      <button
                        key={val.id}
                        disabled={isDisabled}
                        onClick={() => handleSelectValue(attr.id, val.id)}
                        className={cn(
                          'px-4 py-2.5 rounded-full border text-sm transition-colors',
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900'
                            : isDisabled
                            ? 'border-stone-100 text-stone-300 cursor-not-allowed'
                            : 'border-stone-200 text-stone-700 hover:border-stone-400',
                        )}
                      >
                        {val.value}
                      </button>
                    )
                  })}
              </div>

            </div>
          ))}

          {/* Sabor multi-select — driven by Personalização count */}
          {saborAttr && flavourCount > 0 && (
            <div className="mb-5">
              <p className="text-sm font-medium text-stone-700 mb-1">
                {flavourCount === 1 ? 'Qual o sabor?' : `Quais os sabores? (escolha ${flavourCount})`}
              </p>
              <p className="text-xs text-stone-400 mb-3">
                {flavourSelections.length}/{flavourCount} selecionados
              </p>
              <div className="flex flex-wrap gap-2">
                {saborAttr.values.map((val) => {
                  const checked = flavourSelections.includes(val.id)
                  const maxed = !checked && flavourSelections.length >= flavourCount
                  return (
                    <button
                      key={val.id}
                      disabled={maxed}
                      onClick={() => toggleFlavour(val.id)}
                      className={cn(
                        'px-3.5 py-2 rounded-full border text-sm transition-colors',
                        checked
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : maxed
                          ? 'border-stone-100 text-stone-300 cursor-not-allowed'
                          : 'border-stone-200 text-stone-700 hover:border-stone-400',
                      )}
                    >
                      {val.value}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Addons */}
          {product.addons.map((addon) => (
            <AddonField
              key={addon.id}
              addon={addon}
              value={addonValues[addon.id] ?? ''}
              onChange={(v) => setAddonValues((prev) => ({ ...prev, [addon.id]: v }))}
            />
          ))}

          {/* Quantity + Add to Cart — Desktop only (inline) */}
          <div className="hidden md:flex items-center gap-4 mt-6">
            <div className="flex items-center border border-stone-200 rounded-full">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center text-stone-600 hover:text-stone-900 rounded-full"
                aria-label="Diminuir quantidade"
              >
                −
              </button>
              <span className="w-6 text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-11 h-11 flex items-center justify-center text-stone-600 hover:text-stone-900 rounded-full"
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-medium transition-colors',
                canAddToCart
                  ? added
                    ? 'bg-green-600 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed',
              )}
            >
              <ShoppingCart size={16} />
              {added
                ? 'Adicionado!'
                : canAddToCart
                ? 'Adicionar ao Carrinho'
                : firstMissingAttrName
                ? `Selecione ${firstMissingAttrName === 'Sabor' ? 'os sabores' : `o ${firstMissingAttrName.toLowerCase()}`}`
                : 'Selecione as opções'}
            </button>
          </div>

          {matchedVariant && !matchedVariant.is_available && (
            <p className="text-sm text-red-500 mt-2">Este tamanho não está disponível de momento.</p>
          )}

          {/* Spacer for sticky bar on mobile */}
          <div className="h-24 md:hidden" />
        </div>
      </div>

      {/* Reviews */}
      <div className="max-w-2xl mx-auto px-4 pb-16 pt-10 space-y-10">
        <section>
          <h2 className="font-serif text-2xl text-stone-900 mb-6">Avaliações</h2>
          <ReviewFeed
            reviews={product.reviews ?? []}
            averageRating={product.average_rating}
            reviewsCount={product.reviews_count}
          />
        </section>

        <section>
          <h3 className="font-serif text-xl text-stone-900 mb-4">Deixar avaliação</h3>
          <ReviewForm productSlug={slug} />
        </section>
      </div>

      {/* Mobile: Sticky bottom Add-to-Cart bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-100 pb-safe">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex items-center border border-stone-200 rounded-full">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-11 h-11 flex items-center justify-center text-stone-600 active:text-stone-900 rounded-full"
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-11 h-11 flex items-center justify-center text-stone-600 active:text-stone-900 rounded-full"
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-medium transition-colors active:scale-[0.97]',
              canAddToCart
                ? added
                  ? 'bg-green-600 text-white'
                  : 'bg-primary-500 active:bg-primary-600 text-white'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed',
            )}
          >
            <ShoppingCart size={16} />
            {added
              ? 'Adicionado!'
              : canAddToCart
              ? `Adicionar · ${formatPrice(priceToShow * quantity)}`
              : firstMissingAttrName
              ? `Selecione ${firstMissingAttrName === 'Sabor' ? 'os sabores' : `o ${firstMissingAttrName.toLowerCase()}`}`
              : 'Selecione as opções'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Attributes whose values appear in variants (i.e. drive pricing)
function getVariantAttrIds(product: NonNullable<ReturnType<typeof useProduct>['data']>) {
  const valueToAttr = new Map<number, number>()
  for (const attr of product.attributes) {
    for (const val of attr.values) valueToAttr.set(val.id, attr.id)
  }
  const ids = new Set<number>()
  for (const v of product.variants) {
    for (const vid of v.attribute_value_ids) {
      const aid = valueToAttr.get(vid)
      if (aid !== undefined) ids.add(aid)
    }
  }
  return ids
}

function AddonField({
  addon,
  value,
  onChange,
}: {
  addon: ProductAddon
  value: string
  onChange: (v: string) => void
}) {
  if (addon.type === 'checkbox') {
    return (
      <label className="flex items-center gap-3 py-3.5 border-b border-stone-100 cursor-pointer">
        <input
          type="checkbox"
          checked={value === 'yes'}
          onChange={(e) => onChange(e.target.checked ? 'yes' : '')}
          className="w-5 h-5 accent-primary-500"
        />
        <span className="text-sm text-stone-700 flex-1">{addon.name}</span>
        {addon.price > 0 && (
          <span className="text-sm text-stone-500">+{formatPrice(addon.price)}</span>
        )}
      </label>
    )
  }

  if (addon.type === 'text') {
    return (
      <div className="mb-4">
        <label className="text-sm font-medium text-stone-700 block mb-1.5">{addon.name}</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={addon.placeholder ?? ''}
          rows={2}
          className="w-full border border-stone-200 rounded-xl px-3.5 py-3 md:py-2.5 text-base md:text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-400/30 resize-none"
        />
      </div>
    )
  }

  const options = addon.options ?? []
  return (
    <div className="mb-5">
      <p className="text-sm font-medium text-stone-700 mb-2">{addon.name}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt === value ? '' : opt)}
            className={cn(
              'px-4 py-2.5 rounded-full border text-sm transition-colors',
              value === opt
                ? 'bg-stone-900 text-white border-stone-900'
                : 'border-stone-200 text-stone-700 hover:border-stone-400',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
