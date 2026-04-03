import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import { getAdminProducts } from '~/lib/adminApi'
import { formatPrice, cn } from '~/lib/utils'

export const Route = createFileRoute('/admin/products/')({
  component: ProductsPage,
})

function ProductsPage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: getAdminProducts,
  })

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Produtos</h1>
          <p className="text-stone-400 text-sm mt-0.5">{products ? `${products.length} produtos` : '\u00a0'}</p>
        </div>
        <Link to="/admin/products/new"
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <Plus size={15} /> Novo produto
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="aspect-[4/3] bg-stone-100 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-stone-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-stone-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {products?.map((product) => {
            const primary = product.images?.find((i) => i.is_primary) ?? product.images?.[0]
            const available = product.variants?.some((v) => v.is_available)
            const inactive = product.is_active === false
            return (
              <Link
                key={product.id}
                to="/admin/products/$id"
                params={{ id: String(product.id) }}
                className={cn(
                  'bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all group block',
                  inactive ? 'border-stone-200 opacity-60' : 'border-stone-200',
                )}
              >
                <div className="aspect-[4/3] bg-stone-50 overflow-hidden relative">
                  {primary ? (
                    <img
                      src={primary.url}
                      alt={primary.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={32} className="text-stone-200" />
                    </div>
                  )}
                  {inactive && (
                    <div className="absolute inset-0 bg-stone-900/10 flex items-center justify-center">
                      <span className="text-xs font-semibold bg-stone-900/70 text-white px-2.5 py-1 rounded-full">Inativo</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900 truncate text-sm">{product.name}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{product.category?.name ?? '—'}</p>
                    </div>
                    <span className={cn(
                      'shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      available ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-stone-100 text-stone-400 ring-1 ring-stone-200',
                    )}>
                      <span className={cn('w-1 h-1 rounded-full', available ? 'bg-emerald-400' : 'bg-stone-300')} />
                      {available ? 'Stock' : 'Esgotado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stone-50">
                    <p className="text-sm font-semibold text-stone-800">
                      {formatPrice(product.price_range.min)}
                      {product.price_range.max > product.price_range.min && (
                        <span className="text-stone-400 font-normal"> – {formatPrice(product.price_range.max)}</span>
                      )}
                    </p>
                    <p className="text-xs text-stone-400">
                      {product.variants?.length ?? 0} var.
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
