import { useState, useEffect, useRef } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Loader2, Check, ToggleLeft, ToggleRight,
  Trash2, Plus, X, AlertTriangle, Upload, ImagePlus,
} from 'lucide-react'
import {
  getAdminProduct, updateProduct, deleteProduct, convertProductType,
  generateVariants, bulkUpdateVariants, storeVariant, updateVariant, deleteVariant,
  storeAttribute, storeAttributeValue, deleteAttributeValue,
  storeAddon, updateAddon, deleteAddon,
  getCategories, getAttributeSuggestions,
  getGlobalAttributes,
  uploadProductImages, deleteProductImage, reorderProductImages,
} from '~/lib/adminApi'
import { formatPrice, cn } from '~/lib/utils'
import { CategorySelect } from '~/components/admin/CategorySelect'

export const Route = createFileRoute('/admin/products/$id')({
  component: ProductEditPage,
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attr { id: number; name: string; sort_order: number; values: AttrVal[] }
interface AttrVal { id: number; value: string; sort_order: number }
interface Variant { id: number; price: number; is_available: boolean; attribute_value_ids: number[] }
interface Addon { id: number; name: string; price: number; type: string; placeholder: string | null; options: string[] | null; is_required: boolean; sort_order: number }

const DELIVERY_WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProductEditPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: product, isLoading } = useQuery({
    queryKey: ['admin', 'products', id],
    queryFn: () => getAdminProduct(id),
  })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const { data: attrSuggestions } = useQuery({ queryKey: ['admin', 'attr-suggestions'], queryFn: getAttributeSuggestions })

  // ── Basic info state ──
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [deliveryWeekday, setDeliveryWeekday] = useState<number | ''>('')
  const [requiresAdvance, setRequiresAdvance] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [isNonLactose, setIsNonLactose] = useState(false)
  const [isFitness, setIsFitness] = useState(false)
  const [isEvent, setIsEvent] = useState(false)
  const [infoSaved, setInfoSaved] = useState(false)
  const [infoError, setInfoError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!product) return
    setName(product.name)
    setDescription((product as any).description ?? '')
    setSeoTitle((product as any).seo_title ?? '')
    setSeoDescription((product as any).seo_description ?? '')
    setCategoryId(product.category?.id ?? '')
    setDeliveryWeekday((product as any).delivery_weekday ?? '')
    setRequiresAdvance((product as any).requires_advance_order ?? false)
    setIsActive((product as any).is_active ?? true)
    setIsNonLactose((product as any).is_non_lactose ?? false)
    setIsFitness((product as any).is_fitness ?? false)
    setIsEvent((product as any).is_event ?? false)
  }, [product])

  const attrs: Attr[] = (product as any)?.attributes ?? []
  const variants: Variant[] = (product as any)?.variants ?? []
  const addons: Addon[] = (product as any)?.addons ?? []
  const primaryImage = product?.images?.find((i) => i.is_primary) ?? product?.images?.[0]
  const isSimple = (product as any)?.product_type === 'simple'

  // ── Helpers ──
  function variantLabel(valueIds: number[]): string {
    return valueIds
      .map((vid) => {
        for (const a of attrs) {
          const v = a.values.find((v) => v.id === vid)
          if (v) return v.value
        }
        return String(vid)
      })
      .join(' · ')
  }

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['admin', 'products', id] })
    qc.invalidateQueries({ queryKey: ['admin', 'products'] })
  }

  // ── Mutations ──
  const updateInfoMut = useMutation({
    mutationFn: () => updateProduct(Number(id), {
      name, description,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      category_id: categoryId === '' ? undefined : Number(categoryId),
      delivery_weekday: deliveryWeekday === '' ? null : Number(deliveryWeekday),
      requires_advance_order: requiresAdvance,
      is_active: isActive,
      is_non_lactose: isNonLactose,
      is_fitness: isFitness,
      is_event: isEvent,
    }),
    onSuccess: () => { invalidate(); setInfoSaved(true); setInfoError(''); setTimeout(() => setInfoSaved(false), 2000) },
    onError: (e: any) => setInfoError(e?.response?.data?.message ?? 'Erro ao guardar.'),
  })

  const deleteProdMut = useMutation({
    mutationFn: () => deleteProduct(Number(id)),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      navigate({
        to: '/admin/products',
        search: {
          toast: data?.message ?? 'Produto removido.',
          toastType: data?.archived ? 'info' : 'success',
        },
      })
    },
  })

  if (isLoading) return (
    <div className="p-8 space-y-4">
      <div className="h-6 w-40 bg-stone-100 rounded animate-pulse" />
      <div className="h-64 bg-white rounded-2xl border border-stone-200 animate-pulse" />
    </div>
  )
  if (!product) return null

  return (
    <div className="p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/admin/products" className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors">
          <ChevronLeft size={15} /> Produtos
        </Link>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors">
            <Trash2 size={14} /> Eliminar produto
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="text-sm text-red-700">Tem a certeza?</span>
            <button onClick={() => deleteProdMut.mutate()} disabled={deleteProdMut.isPending} className="text-sm font-medium text-red-600 hover:text-red-800">
              {deleteProdMut.isPending ? 'A eliminar...' : 'Sim, eliminar'}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-sm text-stone-400 hover:text-stone-600">Cancelar</button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {primaryImage && <img src={primaryImage.url} alt={primaryImage.alt} className="w-14 h-14 rounded-xl object-cover" />}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-serif text-3xl text-stone-900">{product.name}</h1>
            <span className={cn(
              'text-xs font-medium px-2.5 py-1 rounded-full border',
              isSimple
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-stone-50 border-stone-200 text-stone-500',
            )}>
              {isSimple ? 'Simples' : 'Variável'}
            </span>
          </div>
          <p className="text-stone-500 text-sm">{product.category?.name}</p>
        </div>
      </div>

      {/* ── Basic Info ── */}
      <Section title="Informação básica">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Nome</Label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20" />
          </div>
          <div className="col-span-2">
            <Label>Descrição</Label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 resize-none" />
          </div>

          {/* SEO fields */}
          <div className="col-span-2 border-t border-stone-100 pt-4 space-y-3">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">SEO — Google &amp; partilhas</p>
            <div>
              <Label>Título SEO <span className="font-normal text-stone-400">(deixe em branco para usar "{name || product.name} — Cheesemania")</span></Label>
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                maxLength={120}
                placeholder={`${name || product.name} — Cheesemania`}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20"
              />
              {seoTitle.length > 0 && (
                <p className={`text-xs mt-1 ${seoTitle.length > 60 ? 'text-amber-500' : 'text-stone-400'}`}>
                  {seoTitle.length} caracteres{seoTitle.length > 60 ? ' — ideal até 60' : ''}
                </p>
              )}
            </div>
            <div>
              <Label>Descrição SEO <span className="font-normal text-stone-400">(deixe em branco para usar a descrição do produto)</span></Label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder={description ? description.slice(0, 155) + '…' : 'Descrição para o Google e partilhas em redes sociais…'}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 resize-none"
              />
              {seoDescription.length > 0 && (
                <p className={`text-xs mt-1 ${seoDescription.length > 160 ? 'text-amber-500' : 'text-stone-400'}`}>
                  {seoDescription.length} caracteres{seoDescription.length > 160 ? ' — ideal até 160' : ''}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>Categoria</Label>
            <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
          </div>
          <div>
            <Label>Disponível para entrega</Label>
            <select
              value={deliveryWeekday}
              onChange={(e) => setDeliveryWeekday(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 bg-white"
            >
              <option value="">Qualquer dia</option>
              {DELIVERY_WEEKDAYS.map((day) => (
                <option key={day.value} value={day.value}>{day.label}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex flex-wrap gap-2 items-end pb-0.5">
            <Toggle label="Ativo" value={isActive} onChange={setIsActive} />
            <Toggle label="Pré-encomenda 24h" value={requiresAdvance} onChange={setRequiresAdvance} />
            <Toggle label="Sem Lactose" value={isNonLactose} onChange={setIsNonLactose} />
            <Toggle label="Fitness" value={isFitness} onChange={setIsFitness} />
            <Toggle label="Produto de evento" value={isEvent} onChange={setIsEvent} />
          </div>
        </div>
        <div className="pt-2 flex items-center gap-3">
          <SaveButton loading={updateInfoMut.isPending} saved={infoSaved} onClick={() => updateInfoMut.mutate()} />
          {infoError && <p className="text-sm text-red-500">{infoError}</p>}
        </div>
      </Section>

      {/* ── Images ── */}
      <ImagesSection productId={Number(id)} images={product?.images ?? []} onChanged={invalidate} />

      {/* ── Simple product: price editor ── */}
      {isSimple && variants[0] && (
        <SimplePriceSection variant={variants[0]} productId={Number(id)} onChanged={invalidate} />
      )}

      {/* ── Variable product: attributes + variants ── */}
      {!isSimple && <>
        <Section title="Atributos">
          <div className="space-y-4">
            {attrs.map((attr) => (
              <AttributeRow key={attr.id} attr={attr} productId={Number(id)} onChanged={invalidate} />
            ))}
            <AddAttributeRow productId={Number(id)} onAdded={invalidate} suggestions={attrSuggestions ?? []} />
          </div>
        </Section>
        <VariantsSection variants={variants} attrs={attrs} productId={Number(id)} variantLabel={variantLabel} invalidate={invalidate} />
      </>}

      {/* ── Extras / Toppers ── */}
      <Section title="Extras / Toppers">
        <div className="space-y-0 divide-y divide-stone-100 -mx-6">
          {addons.map((addon) => (
            <AddonRow key={addon.id} addon={addon} productId={Number(id)} onChanged={invalidate} />
          ))}
        </div>
        {addons.length === 0 && (
          <p className="text-sm text-stone-400 py-2">Nenhum extra. Adicione abaixo.</p>
        )}
        <div className="pt-4">
          <AddAddonRow productId={Number(id)} onAdded={invalidate} />
        </div>
      </Section>

      {/* ── Convert type ── */}
      <ConvertTypeSection
        productId={Number(id)}
        currentType={(product as any).product_type ?? 'variable'}
        onConverted={invalidate}
      />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SimplePriceSection({
  variant,
  productId,
  onChanged,
}: {
  variant: Variant
  productId: number
  onChanged: () => void
}) {
  const [price, setPrice] = useState(String(variant.price))
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setPrice(String(variant.price)) }, [variant.price])

  const mut = useMutation({
    mutationFn: () => updateVariant(productId, variant.id, { price: Number(price) }),
    onSuccess: () => { onChanged(); setSaved(true); setError(''); setTimeout(() => setSaved(false), 2000) },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Erro ao guardar.'),
  })

  return (
    <Section title="Preço">
      <div className="flex items-center gap-3 max-w-xs">
        <span className="text-sm text-stone-500 font-medium">MT</span>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min="0"
          className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <SaveButton loading={mut.isPending} saved={saved} onClick={() => mut.mutate()} />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Section>
  )
}

function ConvertTypeSection({
  productId,
  currentType,
  onConverted,
}: {
  productId: number
  currentType: 'simple' | 'variable'
  onConverted: () => void
}) {
  const [open, setOpen] = useState(false)
  const [basePrice, setBasePrice] = useState('')
  const [error, setError] = useState('')
  const targetType = currentType === 'simple' ? 'variable' : 'simple'

  const mut = useMutation({
    mutationFn: () => convertProductType(productId, {
      product_type: targetType,
      ...(targetType === 'simple' ? { base_price: Number(basePrice) } : {}),
    }),
    onSuccess: () => { onConverted(); setOpen(false); setBasePrice(''); setError('') },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Erro ao converter.'),
  })

  const warning = targetType === 'simple'
    ? 'Todos os atributos e variantes serão eliminados permanentemente. O produto passará a ter um preço fixo.'
    : 'A variante atual será eliminada. Terá de adicionar atributos e variantes manualmente após a conversão.'

  return (
    <div className="border border-stone-200 rounded-2xl px-6 py-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-stone-900 text-sm">Tipo de produto</p>
          <p className="text-xs text-stone-400 mt-0.5">
            Atualmente: <span className="font-medium text-stone-600">{currentType === 'simple' ? 'Simples' : 'Variável'}</span>
          </p>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="text-sm text-stone-500 hover:text-stone-700 border border-stone-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            Converter para {targetType === 'simple' ? 'Simples' : 'Variável'}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">{warning}</p>
          </div>

          {targetType === 'simple' && (
            <div className="flex items-center gap-3 max-w-xs">
              <label className="text-sm text-stone-600 shrink-0">Preço (MT)</label>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                min="0"
                placeholder="0"
                className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-400 bg-white"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              onClick={() => mut.mutate()}
              disabled={mut.isPending || (targetType === 'simple' && !basePrice)}
              className="flex items-center gap-1.5 text-sm bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              {mut.isPending && <Loader2 size={13} className="animate-spin" />}
              Confirmar conversão
            </button>
            <button
              onClick={() => { setOpen(false); setBasePrice(''); setError('') }}
              className="text-sm text-stone-500 hover:text-stone-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ImagesSection({
  productId,
  images,
  onChanged,
}: {
  productId: number
  images: { id: number; url: string; alt: string; is_primary: boolean }[]
  onChanged: () => void
}) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Sort by sort_order: primary first, then rest in order
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return 0
  })

  const deleteMut = useMutation({
    mutationFn: (imageId: number) => deleteProductImage(productId, imageId),
    onSuccess: onChanged,
  })

  const reorderMut = useMutation({
    mutationFn: (order: number[]) => reorderProductImages(productId, order),
    onSuccess: onChanged,
  })

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const arr = Array.from(files)
    const invalid = arr.filter((f) => !f.type.startsWith('image/'))
    if (invalid.length > 0) { setUploadError('Apenas imagens são permitidas.'); return }
    setUploading(true)
    setUploadError('')
    try {
      await uploadProductImages(productId, arr)
      onChanged()
    } catch (err: any) {
      setUploadError(err?.response?.data?.message ?? 'Erro ao fazer upload. Tente novamente.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function promoteToFirst(imageId: number) {
    const order = [imageId, ...sorted.map((i) => i.id).filter((id) => id !== imageId)]
    reorderMut.mutate(order)
  }

  const BADGE: Record<number, { label: string; cls: string }> = {
    0: { label: 'Principal', cls: 'bg-primary-500 text-white' },
    1: { label: 'Hover', cls: 'bg-amber-400 text-white' },
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-stone-900 text-base">Imagens</h2>
        <p className="text-xs text-stone-400">A 1ª imagem é a principal · A 2ª aparece no hover</p>
      </div>

      {/* Existing images grid */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {sorted.map((img, idx) => (
            <div key={img.id} className="relative group aspect-square">
              <img
                src={img.url}
                alt={img.alt}
                className="w-full h-full object-cover rounded-xl border border-stone-200"
              />
              {/* Badge */}
              {BADGE[idx] && (
                <span className={`absolute top-1.5 left-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${BADGE[idx].cls}`}>
                  {BADGE[idx].label}
                </span>
              )}
              {/* Actions overlay */}
              <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {idx !== 0 && (
                  <button
                    type="button"
                    title="Tornar principal"
                    onClick={() => promoteToFirst(img.id)}
                    disabled={reorderMut.isPending}
                    className="bg-white/90 hover:bg-white text-stone-700 text-[10px] font-medium px-2 py-1 rounded-lg transition-colors"
                  >
                    Principal
                  </button>
                )}
                <button
                  type="button"
                  title="Eliminar"
                  onClick={() => { if (confirm('Eliminar esta imagem?')) deleteMut.mutate(img.id) }}
                  disabled={deleteMut.isPending}
                  className="bg-red-500/90 hover:bg-red-500 text-white p-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {/* Upload tile */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-stone-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors flex flex-col items-center justify-center gap-1 text-stone-400 hover:text-primary-500"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
            <span className="text-[10px]">{uploading ? 'A carregar...' : 'Adicionar'}</span>
          </button>
        </div>
      )}

      {/* Empty state / upload zone */}
      {sorted.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors',
            dragOver ? 'border-primary-400 bg-primary-50' : 'border-stone-200 hover:border-primary-300 hover:bg-stone-50',
          )}
        >
          {uploading
            ? <Loader2 size={24} className="text-primary-400 animate-spin" />
            : <Upload size={24} className="text-stone-300" />
          }
          <div className="text-center">
            <p className="text-sm font-medium text-stone-600">{uploading ? 'A carregar...' : 'Clique ou arraste imagens'}</p>
            <p className="text-xs text-stone-400 mt-0.5">PNG, JPG, WEBP · máx. 5 MB por imagem</p>
          </div>
        </div>
      )}

      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {sorted.length > 0 && (
        <p className="text-xs text-stone-400">
          Clique numa imagem para ver as opções · Arraste para reordenar ou use "Principal" para promover
        </p>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5 space-y-4">
      <h2 className="font-medium text-stone-900 text-base">{title}</h2>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">{children}</label>
}

function SaveButton({ loading, saved, onClick }: { loading: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center gap-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
      {loading ? <><Loader2 size={14} className="animate-spin" /> A guardar...</>
        : saved ? <><Check size={14} /> Guardado</>
        : 'Guardar alterações'}
    </button>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors',
        value ? 'border-primary-200 bg-primary-50 text-primary-800' : 'border-stone-200 text-stone-500')}>
      {value ? <ToggleRight size={16} className="text-primary-500" /> : <ToggleLeft size={16} className="text-stone-300" />}
      {label}
    </button>
  )
}

// ── Attribute row ──

function AttributeRow({ attr, productId, onChanged }: { attr: Attr; productId: number; onChanged: () => void }) {
  const [adding, setAdding] = useState(false)
  const [newVal, setNewVal] = useState('')

  const addMut = useMutation({
    mutationFn: () => storeAttributeValue(productId, attr.id, newVal.trim()),
    onSuccess: () => { setNewVal(''); setAdding(false); onChanged() },
  })

  const delMut = useMutation({
    mutationFn: (valueId: number) => deleteAttributeValue(productId, attr.id, valueId),
    onSuccess: onChanged,
  })

  return (
    <div className="border border-stone-100 rounded-xl p-4">
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-3">{attr.name}</p>
      <div className="flex flex-wrap gap-2">
        {attr.values.map((val) => (
          <span key={val.id}
            className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-stone-100 text-stone-700 text-sm">
            {val.value}
            <button
              onClick={() => { if (confirm(`Eliminar "${val.value}"? As variantes com este valor serão também eliminadas.`)) delMut.mutate(val.id) }}
              disabled={delMut.isPending}
              className="text-stone-400 hover:text-red-500 transition-colors">
              <X size={12} />
            </button>
          </span>
        ))}

        {adding ? (
          <form onSubmit={(e) => { e.preventDefault(); if (newVal.trim()) addMut.mutate() }}
            className="flex items-center gap-1.5">
            <input autoFocus value={newVal} onChange={(e) => setNewVal(e.target.value)}
              placeholder="Novo valor..."
              className="border border-stone-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-primary-400 w-32" />
            <button type="submit" disabled={addMut.isPending || !newVal.trim()}
              className="text-xs bg-primary-500 text-white px-2.5 py-1 rounded-lg disabled:opacity-50">
              {addMut.isPending ? '...' : 'Adicionar'}
            </button>
            <button type="button" onClick={() => { setAdding(false); setNewVal('') }}
              className="text-stone-400 hover:text-stone-600"><X size={14} /></button>
          </form>
        ) : (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1 pl-2.5 pr-3 py-1 rounded-full border border-dashed border-stone-300 text-stone-400 hover:border-primary-400 hover:text-primary-600 text-sm transition-colors">
            <Plus size={12} /> valor
          </button>
        )}
      </div>
    </div>
  )
}

// ── Add attribute ──

function AddAttributeRow({ productId, onAdded, suggestions }: { productId: number; onAdded: () => void; suggestions: string[] }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'new' | 'library'>('new')
  const [attrName, setAttrName] = useState('')
  const [values, setValues] = useState([''])

  const { data: library = [] } = useQuery({
    queryKey: ['admin-global-attributes'],
    queryFn: getGlobalAttributes,
    enabled: open && tab === 'library',
  })

  const addMut = useMutation({
    mutationFn: () => storeAttribute(productId, { name: attrName.trim(), values: values.filter((v) => v.trim()) }),
    onSuccess: () => { setOpen(false); setAttrName(''); setValues(['']); onAdded() },
  })

  function applyFromLibrary(name: string, libValues: string[]) {
    setTab('new')
    setAttrName(name)
    setValues(libValues.length > 0 ? libValues : [''])
  }

  function reset() { setOpen(false); setAttrName(''); setValues(['']); setTab('new') }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 transition-colors">
      <Plus size={14} /> Adicionar atributo
    </button>
  )

  return (
    <div className="border border-primary-100 bg-primary-50/50 rounded-xl p-4 space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setTab('new')}
          className={cn('text-xs px-3 py-1 rounded-md transition-colors', tab === 'new' ? 'bg-white text-stone-800 shadow-sm font-medium' : 'text-stone-500 hover:text-stone-700')}
        >
          Novo
        </button>
        <button
          onClick={() => setTab('library')}
          className={cn('text-xs px-3 py-1 rounded-md transition-colors', tab === 'library' ? 'bg-white text-stone-800 shadow-sm font-medium' : 'text-stone-500 hover:text-stone-700')}
        >
          Da biblioteca
        </button>
      </div>

      {tab === 'library' ? (
        library.length === 0 ? (
          <p className="text-sm text-stone-400 py-2">Sem atributos na biblioteca. Crie alguns em <span className="text-primary-600">Atributos</span>.</p>
        ) : (
          <div className="space-y-2">
            {library.map((a) => (
              <button
                key={a.id}
                onClick={() => applyFromLibrary(a.name, a.values.map((v) => v.value))}
                className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg hover:bg-white border border-transparent hover:border-primary-100 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700 group-hover:text-stone-900">{a.name}</p>
                  <p className="text-xs text-stone-400 truncate">{a.values.map((v) => v.value).join(', ') || 'Sem valores'}</p>
                </div>
                <span className="text-xs text-primary-500 group-hover:text-primary-700 shrink-0">Usar →</span>
              </button>
            ))}
          </div>
        )
      ) : (
        <>
          <datalist id="attr-suggestions">
            {suggestions.map((s) => <option key={s} value={s} />)}
          </datalist>
          <input value={attrName} onChange={(e) => setAttrName(e.target.value)}
            list="attr-suggestions" placeholder="Nome do atributo (ex: Tamanho)"
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-400" />
          <div className="space-y-1.5">
            {values.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={v} onChange={(e) => { const next = [...values]; next[i] = e.target.value; setValues(next) }}
                  placeholder={`Valor ${i + 1}`}
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary-400" />
                {values.length > 1 && (
                  <button onClick={() => setValues(values.filter((_, j) => j !== i))} className="text-stone-400 hover:text-red-500"><X size={14} /></button>
                )}
              </div>
            ))}
            <button onClick={() => setValues([...values, ''])} className="text-xs text-stone-400 hover:text-primary-600 flex items-center gap-1">
              <Plus size={12} /> mais valor
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => addMut.mutate()} disabled={addMut.isPending || !attrName.trim() || !values.some((v) => v.trim())}
              className="text-sm bg-primary-500 hover:bg-primary-400 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
              {addMut.isPending ? 'A adicionar...' : 'Adicionar'}
            </button>
            <button onClick={reset} className="text-sm text-stone-500 hover:text-stone-700">Cancelar</button>
          </div>
        </>
      )}

      {tab === 'library' && (
        <button onClick={reset} className="text-sm text-stone-500 hover:text-stone-700">Cancelar</button>
      )}
    </div>
  )
}

// ── Variants section (with bulk save) ──

function VariantsSection({ variants, attrs, productId, variantLabel, invalidate }: {
  variants: Variant[]; attrs: Attr[]; productId: number
  variantLabel: (ids: number[]) => string; invalidate: () => void
}) {
  const [edits, setEdits] = useState<Record<number, { price: number; is_available: boolean }>>({})

  // Reset edits when variants change (after save/invalidate)
  useEffect(() => { setEdits({}) }, [variants])

  function setEdit(id: number, data: { price: number; is_available: boolean }) {
    setEdits((prev) => ({ ...prev, [id]: data }))
  }

  // Compute which variants are dirty
  const dirtyEntries = variants.filter((v) => {
    const e = edits[v.id]
    if (!e) return false
    return e.price !== v.price || e.is_available !== v.is_available
  }).map((v) => ({ id: v.id, ...edits[v.id]! }))

  const bulkMut = useMutation({
    mutationFn: () => bulkUpdateVariants(productId, dirtyEntries),
    onSuccess: invalidate,
  })

  return (
    <Section title="Variantes & preços">
      <div className="space-y-0 divide-y divide-stone-100 -mx-6">
        {variants.map((v) => (
          <VariantRow
            key={v.id}
            variant={v}
            label={variantLabel(v.attribute_value_ids)}
            productId={productId}
            onChanged={invalidate}
            editState={edits[v.id]}
            onEdit={(data) => setEdit(v.id, data)}
          />
        ))}
      </div>
      {variants.length === 0 && attrs.some((a) => a.values.length > 0) && (
        <GenerateVariantsButton productId={productId} attrs={attrs} onGenerated={invalidate} />
      )}
      {variants.length === 0 && !attrs.some((a) => a.values.length > 0) && (
        <p className="text-sm text-stone-400 py-2">Nenhuma variante. Defina atributos primeiro ou adicione manualmente.</p>
      )}
      <div className="pt-4 flex items-center gap-3">
        <AddVariantRow attrs={attrs} productId={productId} onAdded={invalidate} />
        {dirtyEntries.length > 0 && (
          <button onClick={() => bulkMut.mutate()} disabled={bulkMut.isPending}
            className="ml-auto flex items-center gap-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
            {bulkMut.isPending ? <><Loader2 size={14} className="animate-spin" /> A guardar...</>
              : <><Check size={14} /> Guardar todos ({dirtyEntries.length})</>}
          </button>
        )}
      </div>
    </Section>
  )
}

// ── Generate variants ──

function GenerateVariantsButton({ productId, attrs, onGenerated }: { productId: number; attrs: Attr[]; onGenerated: () => void }) {
  const [defaultPrice, setDefaultPrice] = useState('')

  const totalCombos = attrs.reduce((acc, a) => a.values.length > 0 ? acc * a.values.length : acc, 1)

  const genMut = useMutation({
    mutationFn: () => generateVariants(productId, Number(defaultPrice) || 0),
    onSuccess: onGenerated,
  })

  return (
    <div className="border border-dashed border-primary-300 bg-primary-50/30 rounded-xl p-4 space-y-3">
      <p className="text-sm text-stone-700">
        Sem variantes. Gerar <strong>{totalCombos}</strong> combinações a partir dos atributos?
      </p>
      <p className="text-xs text-stone-400">
        {attrs.filter((a) => a.values.length > 0).map((a) => `${a.name} (${a.values.length})`).join(' × ')}
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-500">Preço base (MT)</span>
          <input type="number" value={defaultPrice} onChange={(e) => setDefaultPrice(e.target.value)} placeholder="0"
            className="w-24 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary-400" />
        </div>
        <button onClick={() => genMut.mutate()} disabled={genMut.isPending}
          className="text-sm bg-primary-500 hover:bg-primary-400 text-white px-4 py-2 rounded-xl disabled:opacity-50 transition-colors flex items-center gap-1.5">
          {genMut.isPending ? <><Loader2 size={14} className="animate-spin" /> A gerar...</> : <><Plus size={14} /> Gerar variantes</>}
        </button>
      </div>
    </div>
  )
}

// ── Variant row ──

function VariantRow({ variant, label, productId, onChanged, editState, onEdit }: {
  variant: Variant; label: string; productId: number; onChanged: () => void
  editState?: { price: number; is_available: boolean }
  onEdit: (data: { price: number; is_available: boolean }) => void
}) {
  const price = editState?.price ?? variant.price
  const available = editState?.is_available ?? variant.is_available
  const dirty = price !== variant.price || available !== variant.is_available

  function setPrice(val: string) {
    onEdit({ price: Number(val) || 0, is_available: available })
  }
  function toggleAvailable() {
    onEdit({ price, is_available: !available })
  }

  const updateMut = useMutation({
    mutationFn: () => updateVariant(productId, variant.id, { price, is_available: available }),
    onSuccess: onChanged,
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteVariant(productId, variant.id),
    onSuccess: onChanged,
  })

  return (
    <div className="flex items-center gap-4 px-6 py-3 hover:bg-stone-50 transition-colors">
      <p className="text-sm text-stone-700 flex-1">{label}</p>
      <div className="flex items-center gap-1">
        <span className="text-xs text-stone-400">MT</span>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
          className="w-24 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm text-right focus:outline-none focus:border-primary-400" />
      </div>
      <button onClick={toggleAvailable} title={available ? 'Disponível' : 'Indisponível'}>
        {available ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} className="text-stone-300" />}
      </button>
      {dirty && (
        <button onClick={() => updateMut.mutate()} disabled={updateMut.isPending}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium w-14">
          {updateMut.isPending ? '...' : 'Guardar'}
        </button>
      )}
      {!dirty && <div className="w-14" />}
      <button onClick={() => { if (confirm(`Eliminar variante "${label}"?`)) deleteMut.mutate() }}
        disabled={deleteMut.isPending}
        className="text-stone-300 hover:text-red-500 transition-colors">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ── Add variant row ──

function AddVariantRow({ attrs, productId, onAdded }: { attrs: Attr[]; productId: number; onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [selectedValues, setSelectedValues] = useState<Record<number, number>>({})
  const [price, setPrice] = useState('')

  const addMut = useMutation({
    mutationFn: () => storeVariant(productId, {
      price: Number(price),
      is_available: true,
      attribute_value_ids: Object.values(selectedValues),
    }),
    onSuccess: () => { setOpen(false); setSelectedValues({}); setPrice(''); onAdded() },
  })

  // Only show attrs that have values defined
  const variantAttrs = attrs.filter((a) => a.values.length > 0)
  const allSelected = variantAttrs.length > 0 && variantAttrs.every((a) => selectedValues[a.id])

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
      <Plus size={14} /> Adicionar variante
    </button>
  )

  return (
    <div className="border border-primary-100 bg-primary-50/50 rounded-xl p-4 space-y-3">
      <p className="text-sm font-medium text-stone-700">Nova variante</p>
      <div className="flex flex-wrap gap-3">
        {variantAttrs.map((attr) => (
          <div key={attr.id}>
            <p className="text-xs text-stone-500 mb-1">{attr.name}</p>
            <select value={selectedValues[attr.id] ?? ''}
              onChange={(e) => setSelectedValues((prev) => ({ ...prev, [attr.id]: Number(e.target.value) }))}
              className="border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary-400">
              <option value="">Selecionar...</option>
              {attr.values.map((v) => <option key={v.id} value={v.id}>{v.value}</option>)}
            </select>
          </div>
        ))}
        <div>
          <p className="text-xs text-stone-500 mb-1">Preço (MT)</p>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0"
            className="w-24 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary-400" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => addMut.mutate()} disabled={addMut.isPending || !allSelected || !price}
          className="text-sm bg-primary-500 hover:bg-primary-400 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
          {addMut.isPending ? 'A adicionar...' : 'Adicionar variante'}
        </button>
        <button onClick={() => { setOpen(false); setSelectedValues({}); setPrice('') }}
          className="text-sm text-stone-500 hover:text-stone-700">Cancelar</button>
      </div>
    </div>
  )
}

// ── Addon row ──

function AddonRow({ addon, productId, onChanged }: {
  addon: Addon; productId: number; onChanged: () => void
}) {
  const [name, setName] = useState(addon.name)
  const [price, setPrice] = useState(String(addon.price))
  const [type, setType] = useState(addon.type)
  const [isRequired, setIsRequired] = useState(addon.is_required)

  const dirty = name !== addon.name || Number(price) !== addon.price || type !== addon.type || isRequired !== addon.is_required

  const updateMut = useMutation({
    mutationFn: () => updateAddon(productId, addon.id, { name, price: Number(price), type, is_required: isRequired }),
    onSuccess: onChanged,
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteAddon(productId, addon.id),
    onSuccess: onChanged,
  })

  return (
    <div className="flex items-center gap-3 px-6 py-3 hover:bg-stone-50 transition-colors">
      <input value={name} onChange={(e) => setName(e.target.value)}
        className="flex-1 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary-400" />
      <div className="flex items-center gap-1">
        <span className="text-xs text-stone-400">MT</span>
        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
          className="w-24 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm text-right focus:outline-none focus:border-primary-400" />
      </div>
      <select value={type} onChange={(e) => setType(e.target.value)}
        className="border border-stone-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400">
        <option value="checkbox">Checkbox</option>
        <option value="text">Texto</option>
        <option value="select">Seleção</option>
      </select>
      <button onClick={() => { const next = !isRequired; setIsRequired(next) }} title={isRequired ? 'Obrigatório' : 'Opcional'}>
        {isRequired ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} className="text-stone-300" />}
      </button>
      {dirty && (
        <button onClick={() => updateMut.mutate()} disabled={updateMut.isPending}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium w-14">
          {updateMut.isPending ? '...' : 'Guardar'}
        </button>
      )}
      {!dirty && <div className="w-14" />}
      <button onClick={() => { if (confirm(`Eliminar extra "${addon.name}"?`)) deleteMut.mutate() }}
        disabled={deleteMut.isPending}
        className="text-stone-300 hover:text-red-500 transition-colors">
        <Trash2 size={15} />
      </button>
    </div>
  )
}

// ── Add addon row ──

function AddAddonRow({ productId, onAdded }: { productId: number; onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [type, setType] = useState('checkbox')
  const [placeholder, setPlaceholder] = useState('')
  const [isRequired, setIsRequired] = useState(false)

  const addMut = useMutation({
    mutationFn: () => storeAddon(productId, {
      name: name.trim(),
      price: Number(price),
      type,
      placeholder: type === 'text' ? placeholder.trim() || undefined : undefined,
      is_required: isRequired,
    }),
    onSuccess: () => { reset(); onAdded() },
  })

  function reset() { setOpen(false); setName(''); setPrice(''); setType('checkbox'); setPlaceholder(''); setIsRequired(false) }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
      <Plus size={14} /> Adicionar extra
    </button>
  )

  return (
    <div className="border border-primary-100 bg-primary-50/50 rounded-xl p-4 space-y-3">
      <p className="text-sm font-medium text-stone-700">Novo extra</p>
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[160px]">
          <p className="text-xs text-stone-500 mb-1">Nome</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Adicionar cartão"
            className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary-400" />
        </div>
        <div>
          <p className="text-xs text-stone-500 mb-1">Preço (MT)</p>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0"
            className="w-24 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary-400" />
        </div>
        <div>
          <p className="text-xs text-stone-500 mb-1">Tipo</p>
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="border border-stone-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary-400">
            <option value="checkbox">Checkbox</option>
            <option value="text">Texto</option>
            <option value="select">Seleção</option>
          </select>
        </div>
        <div className="flex items-end pb-0.5">
          <Toggle label="Obrigatório" value={isRequired} onChange={setIsRequired} />
        </div>
      </div>
      {type === 'text' && (
        <div>
          <p className="text-xs text-stone-500 mb-1">Placeholder</p>
          <input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} placeholder="Ex: Mensagem no cartão..."
            className="w-full border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary-400" />
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => addMut.mutate()} disabled={addMut.isPending || !name.trim() || !price}
          className="text-sm bg-primary-500 hover:bg-primary-400 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
          {addMut.isPending ? 'A adicionar...' : 'Adicionar extra'}
        </button>
        <button onClick={reset} className="text-sm text-stone-500 hover:text-stone-700">Cancelar</button>
      </div>
    </div>
  )
}
