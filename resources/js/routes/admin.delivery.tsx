import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Check, X, MapPin, Power } from 'lucide-react'
import {
  getAdminDeliveryRegions,
  createDeliveryRegion,
  updateDeliveryRegion,
  deleteDeliveryRegion,
  type DeliveryRegion,
} from '~/lib/adminApi'
import { formatPrice } from '~/lib/utils'

export const Route = createFileRoute('/admin/delivery')({
  component: DeliveryPage,
})

function DeliveryPage() {
  const qc = useQueryClient()
  const { data: regions = [], isLoading } = useQuery({
    queryKey: ['admin-delivery-regions'],
    queryFn: getAdminDeliveryRegions,
  })

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-delivery-regions'] })

  const createMutation = useMutation({
    mutationFn: () => createDeliveryRegion({
      name: newName.trim(),
      price: parseFloat(newPrice),
    }),
    onSuccess: () => {
      invalidate()
      setAdding(false)
      setNewName('')
      setNewPrice('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateDeliveryRegion>[1] }) =>
      updateDeliveryRegion(id, data),
    onSuccess: () => { invalidate(); setEditingId(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDeliveryRegion,
    onSuccess: invalidate,
  })

  function startEdit(region: DeliveryRegion) {
    setEditingId(region.id)
    setEditName(region.name)
    setEditPrice(String(region.price))
  }

  function saveEdit(id: number) {
    if (!editName.trim() || !editPrice) return
    updateMutation.mutate({ id, data: { name: editName.trim(), price: parseFloat(editPrice) } })
  }

  function cancelAdd() {
    setAdding(false)
    setNewName('')
    setNewPrice('')
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Regiões de entrega</h1>
          <p className="text-sm text-stone-500 mt-1">
            Defina as áreas de entrega e o preço cobrado em cada uma.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            <Plus size={15} />
            Nova região
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">

        {/* Column headers */}
        {(regions.length > 0 || adding) && (
          <div className="grid grid-cols-[1fr_120px_auto] gap-4 px-5 py-2.5 bg-stone-50 border-b border-stone-100">
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Região</span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Preço</span>
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wide w-24 text-right">Ações</span>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-stone-400 text-sm gap-2">
            <div className="w-4 h-4 border-2 border-stone-200 border-t-stone-400 rounded-full animate-spin" />
            A carregar...
          </div>
        )}

        {/* Empty state */}
        {!isLoading && regions.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
              <MapPin size={22} className="text-stone-400" />
            </div>
            <p className="text-sm font-medium text-stone-700 mb-1">Sem regiões configuradas</p>
            <p className="text-xs text-stone-400 mb-5">
              Adicione as áreas onde entrega e o preço de cada uma.
            </p>
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={15} />
              Adicionar primeira região
            </button>
          </div>
        )}

        {/* Rows */}
        {regions.map((region) => (
          <div
            key={region.id}
            className="grid grid-cols-[1fr_120px_auto] gap-4 items-center px-5 py-3.5 border-b border-stone-100 last:border-0"
          >
            {editingId === region.id ? (
              /* ── Edit mode ── */
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(region.id)}
                  className="border border-primary-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
                  placeholder="Nome da região"
                />
                <div className="relative">
                  <input
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit(region.id)}
                    type="number"
                    min="0"
                    step="1"
                    className="w-full border border-primary-300 rounded-lg pl-3 pr-12 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 pointer-events-none">MZN</span>
                </div>
                <div className="flex items-center gap-1 justify-end w-24">
                  <button
                    onClick={() => saveEdit(region.id)}
                    disabled={updateMutation.isPending || !editName.trim() || !editPrice}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-40 transition-colors"
                    title="Guardar"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Cancelar"
                  >
                    <X size={16} />
                  </button>
                </div>
              </>
            ) : (
              /* ── View mode ── */
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${region.is_active ? 'bg-green-400' : 'bg-stone-300'}`} />
                  <span className={`text-sm font-medium truncate ${region.is_active ? 'text-stone-800' : 'text-stone-400'}`}>
                    {region.name}
                  </span>
                  {!region.is_active && (
                    <span className="text-xs bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full shrink-0">Inativa</span>
                  )}
                </div>
                <span className={`text-sm font-semibold tabular-nums ${region.is_active ? 'text-stone-700' : 'text-stone-400'}`}>
                  {formatPrice(region.price)}
                </span>
                <div className="flex items-center gap-1 justify-end w-24">
                  <button
                    onClick={() => updateMutation.mutate({ id: region.id, data: { is_active: !region.is_active } })}
                    disabled={updateMutation.isPending}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                      region.is_active
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-stone-400 hover:bg-stone-100'
                    }`}
                    title={region.is_active ? 'Desativar' : 'Ativar'}
                  >
                    <Power size={14} />
                  </button>
                  <button
                    onClick={() => startEdit(region)}
                    className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Eliminar a região "${region.name}"?`)) deleteMutation.mutate(region.id)
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add row */}
        {adding && (
          <div className="grid grid-cols-[1fr_120px_auto] gap-4 items-center px-5 py-3.5 bg-primary-50/40 border-t border-primary-100">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createMutation.mutate()}
              className="border border-stone-200 bg-white rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              placeholder="Ex: Maputo, Matola..."
            />
            <div className="relative">
              <input
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createMutation.mutate()}
                type="number"
                min="0"
                step="1"
                className="w-full border border-stone-200 bg-white rounded-lg pl-3 pr-12 py-1.5 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 pointer-events-none">MZN</span>
            </div>
            <div className="flex items-center gap-1 justify-end w-24">
              <button
                onClick={() => createMutation.mutate()}
                disabled={!newName.trim() || !newPrice || createMutation.isPending}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-40 transition-colors"
                title="Adicionar"
              >
                <Check size={16} />
              </button>
              <button
                onClick={cancelAdd}
                className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
                title="Cancelar"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="text-xs text-stone-400 mt-4 leading-relaxed">
        O indicador verde mostra regiões ativas — visíveis para o cliente no checkout.
        O levantamento é sempre gratuito e não requer configuração aqui.
      </p>
    </div>
  )
}
