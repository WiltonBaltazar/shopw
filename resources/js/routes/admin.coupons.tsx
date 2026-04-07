import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Tag, Pencil, Trash2, X, Loader2, Search } from 'lucide-react'
import { ToggleSwitch, Toggle } from '~/components/admin/Toggle'
import { api } from '~/lib/api'
import { cn } from '~/lib/utils'

interface AdminProduct {
  id: number
  name: string
}

function useAdminProducts() {
  return useQuery({
    queryKey: ['admin-products-slim'],
    queryFn: () =>
      api.get<AdminProduct[]>('/admin/products').then((r) =>
        r.data.map((p: AdminProduct) => ({ id: p.id, name: p.name })),
      ),
    staleTime: 5 * 60 * 1000,
  })
}

export const Route = createFileRoute('/admin/coupons')({
  component: AdminCouponsPage,
})

interface Coupon {
  id: number
  code: string
  description: string | null
  type: 'fixed' | 'percentage'
  value: number
  min_order_amount: number | null
  max_discount_amount: number | null
  applies_to_all: boolean
  is_first_buy: boolean
  is_active: boolean
  expires_at: string | null
  product_ids: number[]
}

interface CouponFormData {
  code: string
  description: string
  type: 'fixed' | 'percentage'
  value: string
  min_order_amount: string
  max_discount_amount: string
  applies_to_all: boolean
  is_first_buy: boolean
  is_active: boolean
  expires_at: string
  product_ids: number[]
}

const EMPTY_FORM: CouponFormData = {
  code: '',
  description: '',
  type: 'percentage',
  value: '',
  min_order_amount: '',
  max_discount_amount: '',
  applies_to_all: true,
  is_first_buy: false,
  is_active: true,
  expires_at: '',
  product_ids: [],
}

function useCoupons() {
  return useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => api.get<{ data: Coupon[] }>('/admin/coupons').then((r) => r.data.data),
  })
}

function AdminCouponsPage() {
  const qc = useQueryClient()
  const { data: coupons = [], isLoading } = useCoupons()
  const { data: allProducts = [] } = useAdminProducts()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState<CouponFormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [productSearch, setProductSearch] = useState('')

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editing
        ? api.put(`/admin/coupons/${editing.id}`, payload)
        : api.post('/admin/coupons', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] })
      closeModal()
    },
    onError: (err: { response?: { data?: { errors?: Record<string, string[]> } } }) => {
      if (err.response?.data?.errors) {
        const errs: Record<string, string> = {}
        for (const [k, v] of Object.entries(err.response.data.errors)) {
          errs[k] = v[0]
        }
        setFormErrors(errs)
      }
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/coupons/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/coupons/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] })
      setDeleteConfirm(null)
    },
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setProductSearch('')
    setFormErrors({})
    setModalOpen(true)
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      description: coupon.description ?? '',
      type: coupon.type,
      value: String(coupon.value),
      min_order_amount: coupon.min_order_amount != null ? String(coupon.min_order_amount) : '',
      max_discount_amount: coupon.max_discount_amount != null ? String(coupon.max_discount_amount) : '',
      applies_to_all: coupon.applies_to_all,
      is_first_buy: coupon.is_first_buy,
      is_active: coupon.is_active,
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
      product_ids: coupon.product_ids ?? [],
    })
    setProductSearch('')
    setFormErrors({})
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
  }

  function handleSave() {
    saveMutation.mutate({
      code: form.code,
      description: form.description || undefined,
      type: form.type,
      value: parseFloat(form.value),
      min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
      max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
      applies_to_all: form.applies_to_all,
      is_first_buy: form.is_first_buy,
      is_active: form.is_active,
      expires_at: form.expires_at || null,
      product_ids: form.applies_to_all ? [] : form.product_ids,
    })
  }

  const now = new Date()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Coupons</h1>
          <p className="text-sm text-stone-400 mt-0.5">Manage discount codes</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          New Coupon
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-stone-400" size={24} />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <Tag size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No coupons yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-stone-500">Código</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">Disconto</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 hidden md:table-cell">Escopo</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500 hidden md:table-cell">Expires</th>
                <th className="text-left px-4 py-3 font-medium text-stone-500">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {coupons.map((c) => {
                const isExpired = c.expires_at ? new Date(c.expires_at) < now : false
                return (
                  <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-stone-800">{c.code}</span>
                        {c.is_first_buy && (
                          <span className="text-[10px] bg-violet-100 text-violet-700 font-medium px-1.5 py-0.5 rounded">1st buy</span>
                        )}
                      </div>
                      {c.description && <p className="text-xs text-stone-400 mt-0.5">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-700">
                      {c.type === 'fixed' ? `${c.value} MT off` : `${c.value}%`}
                    </td>
                    <td className="px-4 py-3 text-stone-500 hidden md:table-cell">
                      {c.applies_to_all ? 'Whole cart' : 'Specific products'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {c.expires_at ? (
                        <span className={isExpired ? 'text-red-500' : 'text-stone-500'}>
                          {new Date(c.expires_at).toLocaleDateString()}
                          {isExpired && ' (expired)'}
                        </span>
                      ) : (
                        <span className="text-stone-300">No expiry</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ToggleSwitch
                        checked={c.is_active}
                        onChange={() => toggleMutation.mutate(c.id)}
                        disabled={toggleMutation.isPending}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        {deleteConfirm === c.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteMutation.mutate(c.id)}
                              className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-1 text-stone-400 hover:text-stone-700"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(c.id)}
                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="font-semibold text-stone-800">{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={closeModal} className="text-stone-400 hover:text-stone-700 p-1 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <ModalField label="Code *" error={formErrors.code}>
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER20"
                  className="font-mono tracking-widest"
                />
              </ModalField>

              <ModalField label="Description" error={formErrors.description}>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Summer sale discount"
                />
              </ModalField>

              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Type *" error={formErrors.type}>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'fixed' | 'percentage' }))}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </ModalField>

                <ModalField label={form.type === 'percentage' ? 'Percentage *' : 'Amount *'} error={formErrors.value}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder={form.type === 'percentage' ? '20' : '5.00'}
                  />
                </ModalField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ModalField label="Min order amount" error={formErrors.min_order_amount}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_order_amount}
                    onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </ModalField>

                {form.type === 'percentage' && (
                  <ModalField label="Max discount cap" error={formErrors.max_discount_amount}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.max_discount_amount}
                      onChange={(e) => setForm((f) => ({ ...f, max_discount_amount: e.target.value }))}
                      placeholder="50.00"
                    />
                  </ModalField>
                )}
              </div>

              <ModalField label="Expires at" error={formErrors.expires_at}>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                />
              </ModalField>

              <div className="space-y-3 pt-1">
                <Toggle
                  label="Applies to whole cart"
                  description="Off = only discounts specific linked products"
                  checked={form.applies_to_all}
                  onChange={(v) => setForm((f) => ({ ...f, applies_to_all: v, product_ids: [] }))}
                />

                {!form.applies_to_all && (
                  <ProductPicker
                    allProducts={allProducts}
                    selected={form.product_ids}
                    search={productSearch}
                    onSearchChange={setProductSearch}
                    onChange={(ids) => setForm((f) => ({ ...f, product_ids: ids }))}
                    error={formErrors['product_ids']}
                  />
                )}
                <Toggle
                  label="First-time customers only"
                  description="Only valid for customers with no prior orders"
                  checked={form.is_first_buy}
                  onChange={(v) => setForm((f) => ({ ...f, is_first_buy: v }))}
                />
                <Toggle
                  label="Active"
                  checked={form.is_active}
                  onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
              </div>
            </div>

            <div className="px-6 pb-5 flex gap-2 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-5 py-2 text-sm font-medium text-white bg-stone-800 hover:bg-stone-900 disabled:bg-stone-400 rounded-lg transition-colors flex items-center gap-2"
              >
                {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {editing ? 'Save Changes' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductPicker({
  allProducts,
  selected,
  search,
  onSearchChange,
  onChange,
  error,
}: {
  allProducts: AdminProduct[]
  selected: number[]
  search: string
  onSearchChange: (v: string) => void
  onChange: (ids: number[]) => void
  error?: string
}) {
  const filtered = search.trim()
    ? allProducts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : allProducts

  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  const selectedProducts = allProducts.filter((p) => selected.includes(p.id))

  return (
    <div className="pt-1">
      <p className="text-xs font-medium text-stone-600 mb-2">
        Linked products{' '}
        {selected.length > 0 && (
          <span className="text-primary-600 font-semibold">({selected.length} selected)</span>
        )}
      </p>

      {/* Selected chips */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedProducts.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-full px-2.5 py-1"
            >
              {p.name}
              <button type="button" onClick={() => toggle(p.id)} className="hover:text-primary-900">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search + list */}
      <div className={cn('border rounded-lg overflow-hidden', error ? 'border-red-300' : 'border-stone-200')}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-100 bg-stone-50">
          <Search size={13} className="text-stone-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="flex-1 text-xs bg-transparent outline-none text-stone-700 placeholder-stone-300"
          />
        </div>
        <div className="max-h-40 overflow-y-auto divide-y divide-stone-50">
          {filtered.length === 0 ? (
            <p className="text-xs text-stone-400 px-3 py-3 text-center">No products found</p>
          ) : (
            filtered.map((p) => {
              const checked = selected.includes(p.id)
              return (
                <label
                  key={p.id}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 cursor-pointer text-xs transition-colors',
                    checked ? 'bg-primary-50' : 'hover:bg-stone-50',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p.id)}
                    className="accent-primary-500 w-3.5 h-3.5 flex-shrink-0"
                  />
                  <span className={cn('flex-1', checked ? 'text-primary-700 font-medium' : 'text-stone-700')}>
                    {p.name}
                  </span>
                </label>
              )
            })
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {selected.length === 0 && !error && (
        <p className="text-xs text-amber-600 mt-1">Select at least one product for a restricted coupon.</p>
      )}
    </div>
  )
}

function ModalField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-600 mb-1">{label}</label>
      <div
        className={cn(
          '[&_input,&_select,&_textarea]:w-full [&_input,&_select,&_textarea]:border [&_input,&_select,&_textarea]:rounded-lg [&_input,&_select,&_textarea]:px-3 [&_input,&_select,&_textarea]:py-2 [&_input,&_select,&_textarea]:text-sm [&_input,&_select,&_textarea]:text-stone-800 [&_input,&_select,&_textarea]:placeholder-stone-300 [&_input,&_select,&_textarea]:outline-none [&_input,&_select,&_textarea]:focus:border-stone-400 [&_select]:bg-white',
          error
            ? '[&_input,&_select,&_textarea]:border-red-300'
            : '[&_input,&_select,&_textarea]:border-stone-200',
        )}
      >
        {children}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

