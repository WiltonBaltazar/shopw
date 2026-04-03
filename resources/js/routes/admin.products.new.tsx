import { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Plus, X, Loader2, RefreshCw, Layers } from 'lucide-react'
import { createProduct, getCategories, getAttributeSuggestions, getGlobalAttributes } from '~/lib/adminApi'
import { cn } from '~/lib/utils'
import { CategorySelect } from '~/components/admin/CategorySelect'

export const Route = createFileRoute('/admin/products/new')({
  component: NewProductPage,
})

interface AttrInput { name: string; values: string[] }
interface VariantInput { valueKeys: string[]; price: string; is_available: boolean }

// Cartesian product of arrays
function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>((acc, arr) => acc.flatMap((prev) => arr.map((val) => [...prev, val])), [[]])
}

function NewProductPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const { data: attrSuggestions } = useQuery({ queryKey: ['admin', 'attr-suggestions'], queryFn: getAttributeSuggestions })
  const { data: library = [] } = useQuery({ queryKey: ['admin-global-attributes'], queryFn: getGlobalAttributes })

  // Basic info
  const [productType, setProductType] = useState<'variable' | 'simple'>('variable')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [requiresAdvance, setRequiresAdvance] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [isNonLactose, setIsNonLactose] = useState(false)
  const [isFitness, setIsFitness] = useState(false)
  const [basePrice, setBasePrice] = useState('')

  // Attributes
  const [attrs, setAttrs] = useState<AttrInput[]>([{ name: '', values: [''] }])
  const [showLibraryPicker, setShowLibraryPicker] = useState(false)

  // Variants
  const [variants, setVariants] = useState<VariantInput[]>([])
  const [addingManual, setAddingManual] = useState(false)
  const [manualSelections, setManualSelections] = useState<Record<number, number>>({})
  const [manualPrice, setManualPrice] = useState('')

  const [error, setError] = useState('')

  const createMut = useMutation({
    mutationFn: () => {
      const isSimple = productType === 'simple'
      const cleanAttrs = attrs.filter((a) => a.name.trim() && a.values.some((v) => v.trim()))
      const payload: Record<string, unknown> = {
        name: name.trim(),
        product_type: productType,
        description: description.trim() || undefined,
        category_id: categoryId || undefined,
        requires_advance_order: requiresAdvance,
        is_active: isActive,
        is_non_lactose: isNonLactose,
        is_fitness: isFitness,
        sort_order: 0,
        addons: [],
      }
      if (isSimple) {
        payload.base_price = Number(basePrice)
      } else {
        payload.attributes = cleanAttrs.map((a) => ({
          name: a.name.trim(),
          values: a.values.filter((v) => v.trim()).map((v) => v.trim()),
        }))
        payload.variants = variants.map((v) => ({
          price: Number(v.price),
          is_available: v.is_available,
          attribute_value_keys: v.valueKeys,
        }))
      }
      return createProduct(payload)
    },
    onSuccess: (product: any) => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      navigate({ to: '/admin/products/$id', params: { id: String(product.id) } })
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Erro ao criar produto.'),
  })

  // Generate all variant combinations from current attributes
  function generateVariants() {
    // Preserve original indices so getValueLabel/getAttrLabel resolve correctly
    const cleanAttrs = attrs
      .map((attr, ai) => ({ attr, ai }))
      .filter(({ attr }) => attr.name.trim() && attr.values.some((v) => v.trim()))
    if (!cleanAttrs.length) return
    const valueArrays = cleanAttrs.map(({ attr, ai }) =>
      attr.values
        .map((_, vi) => `${ai}.${vi}`)
        .filter((key) => attr.values[Number(key.split('.')[1])]?.trim()),
    )
    const combos = cartesian(valueArrays)
    setVariants(combos.map((keys) => ({ valueKeys: keys, price: '', is_available: true })))
  }

  function getValueLabel(key: string): string {
    const [ai, vi] = key.split('.').map(Number)
    return attrs[ai]?.values[vi] ?? key
  }

  function getAttrLabel(key: string): string {
    const ai = Number(key.split('.')[0])
    return attrs[ai]?.name ?? ''
  }

  const canSubmit = productType === 'simple'
    ? name.trim() && basePrice
    : name.trim() && variants.length > 0 && variants.every((v) => v.price)

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/products" className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
          <ChevronLeft size={15} /> Produtos
        </Link>
      </div>

      <div>
        <h1 className="font-serif text-3xl text-stone-900">Novo produto</h1>
        <p className="text-stone-500 text-sm mt-1">Preencha as informações e defina as variantes</p>
      </div>

      {/* Product type */}
      <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5">
        <h2 className="font-medium text-stone-900 mb-3">Tipo de produto</h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setProductType('variable')}
            className={cn(
              'flex-1 rounded-xl border px-4 py-3 text-left transition-colors',
              productType === 'variable'
                ? 'border-primary-400 bg-primary-50 text-primary-800'
                : 'border-stone-200 text-stone-600 hover:border-stone-300',
            )}
          >
            <p className="font-medium text-sm">Variável</p>
            <p className="text-xs mt-0.5 opacity-70">Tem tamanhos, sabores ou outras opções com preços diferentes</p>
          </button>
          <button
            type="button"
            onClick={() => setProductType('simple')}
            className={cn(
              'flex-1 rounded-xl border px-4 py-3 text-left transition-colors',
              productType === 'simple'
                ? 'border-primary-400 bg-primary-50 text-primary-800'
                : 'border-stone-200 text-stone-600 hover:border-stone-300',
            )}
          >
            <p className="font-medium text-sm">Simples</p>
            <p className="text-xs mt-0.5 opacity-70">Preço fixo, sem variantes — o cliente encomenda como está</p>
          </button>
        </div>
      </div>

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5 space-y-4">
        <h2 className="font-medium text-stone-900">Informação básica</h2>
        <div>
          <Label>Nome *</Label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Cheesecake Clássico"
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20" />
        </div>
        <div>
          <Label>Descrição</Label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Categoria</Label>
            <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} />
          </div>
          <div className="flex flex-wrap gap-2 items-end pb-0.5">
            <Chip active={isActive} onClick={() => setIsActive(!isActive)} label="Ativo" />
            <Chip active={requiresAdvance} onClick={() => setRequiresAdvance(!requiresAdvance)} label="Pré-encomenda 24h" />
            <Chip active={isNonLactose} onClick={() => setIsNonLactose(!isNonLactose)} label="Sem Lactose" />
            <Chip active={isFitness} onClick={() => setIsFitness(!isFitness)} label="Fitness" />
          </div>
        </div>
      </div>

      {/* Simple product: single price input */}
      {productType === 'simple' && (
        <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5">
          <h2 className="font-medium text-stone-900 mb-4">Preço</h2>
          <div className="flex items-center gap-3 max-w-xs">
            <span className="text-sm text-stone-500 font-medium">MT</span>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="0"
              min="0"
              className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20"
            />
          </div>
        </div>
      )}

      {/* Attributes (variable only) */}
      {productType === 'variable' && <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium text-stone-900">Atributos</h2>
            <p className="text-xs text-stone-400 mt-0.5">Ex: Tamanho com valores "Pequeno, Médio, Grande"</p>
          </div>
        </div>

        {attrs.map((attr, ai) => (
          <div key={ai} className="border border-stone-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <datalist id={`attr-sugg-${ai}`}>
                {(attrSuggestions ?? []).map((s) => <option key={s} value={s} />)}
              </datalist>
              <input value={attr.name} onChange={(e) => {
                const next = [...attrs]; next[ai] = { ...attr, name: e.target.value }; setAttrs(next)
              }} list={`attr-sugg-${ai}`} placeholder="Nome do atributo (ex: Tamanho)"
                className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-400" />
              {attrs.length > 1 && (
                <button onClick={() => setAttrs(attrs.filter((_, i) => i !== ai))} className="text-stone-300 hover:text-red-500">
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {attr.values.map((val, vi) => (
                <div key={vi} className="flex items-center gap-2">
                  <input value={val} onChange={(e) => {
                    const next = [...attrs]; next[ai].values[vi] = e.target.value; setAttrs(next)
                  }} placeholder={`Valor ${vi + 1}`}
                    className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary-400" />
                  {attr.values.length > 1 && (
                    <button onClick={() => {
                      const next = [...attrs]; next[ai].values = attr.values.filter((_, j) => j !== vi); setAttrs(next)
                    }} className="text-stone-300 hover:text-red-500"><X size={14} /></button>
                  )}
                </div>
              ))}
              <button onClick={() => {
                const next = [...attrs]; next[ai].values = [...attr.values, '']; setAttrs(next)
              }} className="text-xs text-stone-400 hover:text-primary-600 flex items-center gap-1">
                <Plus size={12} /> adicionar valor
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setAttrs([...attrs, { name: '', values: [''] }])}
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700">
            <Plus size={14} /> Adicionar atributo
          </button>
          {library.length > 0 && (
            <button
              onClick={() => setShowLibraryPicker(!showLibraryPicker)}
              className={cn('flex items-center gap-1.5 text-sm transition-colors',
                showLibraryPicker ? 'text-stone-700' : 'text-stone-400 hover:text-stone-600')}
            >
              <Layers size={14} /> Da biblioteca
            </button>
          )}
        </div>

        {showLibraryPicker && (
          <div className="border border-stone-100 rounded-xl p-3 bg-stone-50 space-y-1">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Selecionar da biblioteca</p>
            {library.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  // Drop trailing blank attrs before appending library entry
                  const base = attrs.filter((a) => a.name.trim() || a.values.some((v) => v.trim()))
                  setAttrs([...base, { name: a.name, values: a.values.map((v) => v.value).concat(['']) }])
                  setShowLibraryPicker(false)
                }}
                className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-primary-100 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700 group-hover:text-stone-900">{a.name}</p>
                  <p className="text-xs text-stone-400 truncate">{a.values.map((v) => v.value).join(', ') || 'Sem valores'}</p>
                </div>
                <span className="text-xs text-primary-500 group-hover:text-primary-700 shrink-0">Usar →</span>
              </button>
            ))}
          </div>
        )}
      </div>}

      {/* Variants (variable only) */}
      {productType === 'variable' && <div className="bg-white rounded-2xl border border-stone-200 px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium text-stone-900">Variantes & preços</h2>
            <p className="text-xs text-stone-400 mt-0.5">Defina o preço para cada combinação de atributos</p>
          </div>
          {variants.length === 0 && attrs.some((a) => a.name.trim() && a.values.some((v) => v.trim())) && (
            <button onClick={generateVariants}
              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 border border-primary-200 rounded-lg px-3 py-1.5 transition-colors">
              <RefreshCw size={13} /> Gerar combinações
            </button>
          )}
        </div>

        {variants.length === 0 ? (
          <p className="text-sm text-stone-400 py-2">Clique em "Gerar combinações" após definir os atributos, ou adicione manualmente.</p>
        ) : (
          <div className="space-y-2">
            {variants.map((v, vi) => (
              <div key={vi} className="flex items-center gap-3 py-2 border-b border-stone-100 last:border-0">
                <p className="text-sm text-stone-700 flex-1">
                  {v.valueKeys.map((key) => (
                    <span key={key}>
                      <span className="text-stone-400 text-xs">{getAttrLabel(key)}: </span>
                      {getValueLabel(key)}{' '}
                    </span>
                  ))}
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-stone-400">MT</span>
                  <input type="number" value={v.price} onChange={(e) => {
                    const next = [...variants]; next[vi].price = e.target.value; setVariants(next)
                  }} placeholder="0"
                    className="w-24 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm text-right focus:outline-none focus:border-primary-400" />
                </div>
                <button onClick={() => {
                  const next = [...variants]; next[vi].is_available = !next[vi].is_available; setVariants(next)
                }} className={cn('text-xs px-2.5 py-1 rounded-full border transition-colors',
                  v.is_available ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-stone-50 border-stone-200 text-stone-400')}>
                  {v.is_available ? 'Disponível' : 'Indisponível'}
                </button>
                <button onClick={() => setVariants(variants.filter((_, i) => i !== vi))}
                  className="text-stone-300 hover:text-red-500"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Manual add */}
        {addingManual ? (() => {
          const pickableAttrs = attrs
            .map((attr, ai) => ({ attr, ai }))
            .filter(({ attr }) => attr.name.trim() && attr.values.some((v) => v.trim()))
          const allSelected = pickableAttrs.every(({ ai }) => manualSelections[ai] !== undefined)
          function confirmManual() {
            const keys = pickableAttrs.map(({ ai }) => `${ai}.${manualSelections[ai]}`)
            setVariants([...variants, { valueKeys: keys, price: manualPrice, is_available: true }])
            setAddingManual(false)
            setManualSelections({})
            setManualPrice('')
          }
          return (
            <div className="border border-stone-100 bg-stone-50 rounded-xl p-4 space-y-3">
              {pickableAttrs.length === 0 ? (
                <p className="text-sm text-stone-400">Defina atributos primeiro.</p>
              ) : (
                pickableAttrs.map(({ attr, ai }) => (
                  <div key={ai} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-stone-500 w-28 shrink-0 truncate">{attr.name}</span>
                    <select
                      value={manualSelections[ai] ?? ''}
                      onChange={(e) => setManualSelections({ ...manualSelections, [ai]: Number(e.target.value) })}
                      className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary-400 bg-white"
                    >
                      <option value="">Selecionar...</option>
                      {attr.values.map((val, vi) => val.trim() && (
                        <option key={vi} value={vi}>{val}</option>
                      ))}
                    </select>
                  </div>
                ))
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400 w-28 shrink-0">Preço (MT)</span>
                <input
                  type="number"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  placeholder="0"
                  className="w-32 border border-stone-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:border-primary-400 bg-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={confirmManual}
                  disabled={!allSelected || !manualPrice}
                  className="text-sm bg-primary-500 hover:bg-primary-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => { setAddingManual(false); setManualSelections({}); setManualPrice('') }}
                  className="text-sm text-stone-500 hover:text-stone-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )
        })() : (
          <button
            onClick={() => setAddingManual(true)}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-primary-600"
          >
            <Plus size={14} /> Adicionar variante manual
          </button>
        )}
      </div>}

      {error && <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      <div className="flex items-center gap-3 pb-8">
        <button onClick={() => createMut.mutate()} disabled={createMut.isPending || !canSubmit}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-white font-medium text-sm px-6 py-2.5 rounded-xl transition-colors">
          {createMut.isPending && <Loader2 size={14} className="animate-spin" />}
          {createMut.isPending ? 'A criar...' : 'Criar produto'}
        </button>
        <Link to="/admin/products" className="text-sm text-stone-500 hover:text-stone-700">Cancelar</Link>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1.5">{children}</label>
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('text-sm px-3 py-2 rounded-xl border transition-colors',
        active ? 'border-primary-200 bg-primary-50 text-primary-800' : 'border-stone-200 text-stone-400')}>
      {label}
    </button>
  )
}
