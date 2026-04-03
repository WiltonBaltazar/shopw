import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Plus, RotateCcw, X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import { getAdminProducts, updateProduct } from '~/lib/adminApi'
import { formatPrice, cn } from '~/lib/utils'

type ProductsSearch = {
  toast?: string
  toastType?: 'success' | 'info' | 'error'
}

export const Route = createFileRoute('/admin/products/')({
  validateSearch: (search): ProductsSearch => ({
    toast: typeof search.toast === 'string' ? search.toast : undefined,
    toastType:
      search.toastType === 'success' || search.toastType === 'info' || search.toastType === 'error'
        ? search.toastType
        : undefined,
  }),
  component: ProductsPage,
})

function ProductsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const search = Route.useSearch()
  const [showArchivedOnly, setShowArchivedOnly] = useState(false)
  const [restoringId, setRestoringId] = useState<number | null>(null)
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: getAdminProducts,
  })
  const restoreMut = useMutation({
    mutationFn: (productId: number) => updateProduct(productId, { is_active: true }),
    onMutate: (productId: number) => {
      setRestoringId(productId)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      navigate({
        to: '/admin/products',
        search: (prev) => ({ ...prev, toast: 'Produto restaurado com sucesso.', toastType: 'success' }),
        replace: true,
      })
    },
    onError: () => {
      navigate({
        to: '/admin/products',
        search: (prev) => ({ ...prev, toast: 'Não foi possível restaurar o produto.', toastType: 'error' }),
        replace: true,
      })
    },
    onSettled: () => {
      setRestoringId(null)
    },
  })

  const activeCount = useMemo(
    () => (products ?? []).filter((product) => product.is_active !== false).length,
    [products],
  )
  const archivedCount = useMemo(
    () => (products ?? []).filter((product) => product.is_active === false).length,
    [products],
  )
  const visibleProducts = useMemo(
    () => (showArchivedOnly ? (products ?? []).filter((product) => product.is_active === false) : (products ?? [])),
    [products, showArchivedOnly],
  )

  useEffect(() => {
    if (!search.toast) return
    const timer = setTimeout(() => {
      navigate({
        to: '/admin/products',
        search: (prev) => ({ ...prev, toast: undefined, toastType: undefined }),
        replace: true,
      })
    }, 3500)

    return () => clearTimeout(timer)
  }, [search.toast, navigate])

  return (
    <div className="p-8 max-w-6xl">
      {search.toast && (
        <div
          className={cn(
            'mb-4 rounded-xl border px-4 py-3 text-sm flex items-start justify-between gap-3',
            search.toastType === 'info'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : search.toastType === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800',
          )}
        >
          <p>{search.toast}</p>
          <button
            onClick={() =>
              navigate({
                to: '/admin/products',
                search: (prev) => ({ ...prev, toast: undefined, toastType: undefined }),
                replace: true,
              })}
            className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Fechar notificação"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Produtos</h1>
          <p className="text-stone-400 text-sm mt-0.5">{products ? `${products.length} produtos` : '\u00a0'}</p>
          {products && (
            <p className="text-stone-400 text-xs mt-1">
              {activeCount} ativos · {archivedCount} arquivados
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowArchivedOnly((v) => !v)}
            className={cn(
              'text-sm font-medium px-3.5 py-2.5 rounded-xl border transition-colors',
              showArchivedOnly
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300',
            )}
          >
            {showArchivedOnly ? 'A mostrar: arquivados' : 'Ver arquivados'}
          </button>
          <Link to="/admin/products/new"
            className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={15} /> Novo produto
          </Link>
        </div>
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
          {visibleProducts.map((product) => {
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
                  {inactive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        restoreMut.mutate(product.id)
                      }}
                      disabled={restoreMut.isPending}
                      className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300 px-2.5 py-1.5 rounded-full shadow-sm transition-colors"
                    >
                      <RotateCcw size={12} />
                      {restoreMut.isPending && restoringId === product.id ? 'A restaurar...' : 'Restaurar'}
                    </button>
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
          {!isLoading && visibleProducts.length === 0 && (
            <div className="col-span-full bg-white border border-stone-200 rounded-2xl px-5 py-8 text-center">
              <p className="text-sm text-stone-500">
                Nenhum produto arquivado encontrado.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
