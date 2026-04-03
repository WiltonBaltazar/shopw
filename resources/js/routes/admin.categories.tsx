import { useState, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Check, X, GripVertical, Loader2 } from 'lucide-react'
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  type AdminCategory,
} from '~/lib/adminApi'

export const Route = createFileRoute('/admin/categories')({
  component: CategoriesPage,
})

function CategoriesPage() {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [localOrder, setLocalOrder] = useState<AdminCategory[] | null>(null)
  const dragIdx = useRef<number | null>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: getAdminCategories,
    select: (data) => localOrder ?? data,
  })

  const { data: rawCategories = [] } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: getAdminCategories,
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      setNewName('')
      setLocalOrder(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => updateCategory(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      setEditingId(null)
      setLocalOrder(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      setLocalOrder(null)
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (items: { id: number; sort_order: number }[]) => reorderCategories(items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  })

  function startEdit(cat: AdminCategory) {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  function handleDragStart(i: number) {
    dragIdx.current = i
  }

  function handleDrop(i: number) {
    if (dragIdx.current === null || dragIdx.current === i) return
    const base = rawCategories.length ? rawCategories : categories
    const next = [...base]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(i, 0, moved)
    const reordered = next.map((c, idx) => ({ ...c, sort_order: idx + 1 }))
    setLocalOrder(reordered)
    dragIdx.current = null
    reorderMutation.mutate(reordered.map((c) => ({ id: c.id, sort_order: c.sort_order })))
  }

  const list = localOrder ?? categories

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-stone-900">Categorias</h1>
        <p className="text-stone-500 text-sm mt-1">Gerir categorias de produtos</p>
      </div>

      {/* Add form */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createMutation.mutate(newName.trim()) }}
        className="flex gap-2 mb-6"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da nova categoria…"
          className="flex-1 text-sm border border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary-400 text-stone-700"
        />
        <button
          type="submit"
          disabled={!newName.trim() || createMutation.isPending}
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Adicionar
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-stone-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-3">
                <div className="h-4 w-48 bg-stone-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-10">Nenhuma categoria criada ainda.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {list.map((cat, i) => (
              <div
                key={cat.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 transition-colors group"
              >
                <GripVertical size={15} className="text-stone-300 cursor-grab shrink-0" />

                {editingId === cat.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: cat.id, name: editName }) }}
                    className="flex-1 flex items-center gap-2"
                  >
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 text-sm border border-stone-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-400"
                    />
                    <button type="submit" disabled={!editName.trim() || updateMutation.isPending} className="p-1.5 text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
                      {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="p-1.5 text-stone-400 hover:text-stone-600">
                      <X size={14} />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-stone-800">{cat.name}</span>
                      <span className="text-xs text-stone-400 ml-2">{cat.products_count} produto{cat.products_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(cat)} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (cat.products_count > 0) {
                            alert('Não é possível eliminar uma categoria com produtos associados.')
                            return
                          }
                          if (confirm(`Eliminar a categoria "${cat.name}"?`)) deleteMutation.mutate(cat.id)
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
