import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'
import { useCategories, useProducts, useSeoSettings, useMyFavorites } from '~/lib/hooks'
import { useCustomerStore } from '~/store/customer'
import { ProductCard } from '~/components/ui/ProductCard'

export const Route = createFileRoute('/_public/menu')({
  component: MenuPage,
})

function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>()
  const { data: categories } = useCategories()
  const { data: products, isLoading } = useProducts(activeCategory)
  const seo = useSeoSettings()
  const phone = useCustomerStore((s) => s.phone)
  const { data: favorites } = useMyFavorites(phone)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
      <Helmet>
        <title>{seo.seo_menu_title}</title>
        <meta name="description" content={seo.seo_menu_description} />
        <meta property="og:title" content={seo.seo_menu_title} />
        <meta property="og:description" content={seo.seo_menu_description} />
        <meta property="og:type" content="website" />
        {seo.seo_og_image && <meta property="og:image" content={seo.seo_og_image} />}
      </Helmet>

      {/* Page header */}
      <div className="mb-10 md:mb-12">
        <div className="flex items-baseline gap-3 mb-2">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-stone-900 leading-none">
            Menu
          </h1>
          <span className="font-serif text-lg md:text-xl text-stone-400 italic">artesanal</span>
        </div>
        <p className="text-stone-500 text-sm mt-2">
          Todos os cheesecakes disponíveis para encomenda.
        </p>
        <div className="mt-4 h-px w-32 bg-gradient-to-r from-primary-300 to-transparent" />
      </div>

      {/* Category filter */}
      <div className="relative mb-8">
        <div className="flex md:flex-wrap gap-2 overflow-x-auto md:overflow-x-visible scrollbar-hide pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          <button
            onClick={() => setActiveCategory(undefined)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
              !activeCategory
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:bg-stone-50'
            }`}
          >
            Todos
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug === activeCategory ? undefined : cat.slug)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                activeCategory === cat.slug
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-[#faf8f5] to-transparent pointer-events-none md:hidden" />
      </div>

      {/* Product count cue */}
      {!isLoading && products && products.length > 0 && (
        <p className="text-xs text-stone-400 mb-6 tabular-nums">
          {products.length} {products.length === 1 ? 'produto' : 'produtos'}
          {activeCategory && ' nesta categoria'}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3" style={{ animationDelay: `${i * 60}ms` }}>
              <div
                className="aspect-square rounded-2xl bg-stone-100 animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
              <div className="h-4 bg-stone-100 rounded-full animate-pulse w-3/4"
                style={{ animationDelay: `${i * 60 + 100}ms` }} />
              <div className="h-3 bg-stone-100 rounded-full animate-pulse w-1/2"
                style={{ animationDelay: `${i * 60 + 160}ms` }} />
            </div>
          ))}
        </div>
      ) : products?.length === 0 ? (
        <div className="text-center py-24 text-stone-400">
          <p className="text-sm mb-4">Nenhum produto encontrado nesta categoria.</p>
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(undefined)}
              className="text-primary-600 text-sm font-medium hover:underline"
            >
              Ver todos os produtos
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products?.map((p) => (
            <ProductCard key={p.id} product={p} favorites={favorites} />
          ))}
        </div>
      )}
    </div>
  )
}
