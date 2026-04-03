import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Check, X, Layers } from 'lucide-react'
import {
  getGlobalAttributes,
  createGlobalAttribute,
  updateGlobalAttribute,
  deleteGlobalAttribute,
  createGlobalAttributeValue,
  deleteGlobalAttributeValue,
  type GlobalAttribute,
} from '~/lib/adminApi'

export const Route = createFileRoute('/admin/attributes')({
  component: AttributesPage,
})

function AttributesPage() {
  const qc = useQueryClient()
  const { data: attrs = [], isLoading } = useQuery({
    queryKey: ['admin-global-attributes'],
    queryFn: getGlobalAttributes,
  })

  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newValues, setNewValues] = useState([''])

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-global-attributes'] })

  const createMut = useMutation({
    mutationFn: () =>
      createGlobalAttribute({ name: newName.trim(), values: newValues.filter((v) => v.trim()) }),
    onSuccess: () => { invalidate(); setAdding(false); setNewName(''); setNewValues(['']) },
  })

  function cancelAdd() { setAdding(false); setNewName(''); setNewValues(['']) }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-stone-800">Biblioteca de atributos</h1>
          <p className="text-sm text-stone-500 mt-1">
            Crie atributos reutilizáveis (ex: Tamanho, Sabor) que podem ser aplicados rapidamente a qualquer produto.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            <Plus size={15} />
            Novo atributo
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-white border border-primary-100 rounded-2xl p-5 mb-4 space-y-4">
          <p className="text-sm font-medium text-stone-700">Novo atributo</p>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && cancelAdd()}
            placeholder="Nome do atributo (ex: Tamanho)"
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-500">Valores iniciais (opcional)</p>
            {newValues.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={v}
                  onChange={(e) => {
                    const next = [...newValues]
                    next[i] = e.target.value
                    setNewValues(next)
                  }}
                  placeholder={`Valor ${i + 1}`}
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary-400"
                />
                {newValues.length > 1 && (
                  <button
                    onClick={() => setNewValues(newValues.filter((_, j) => j !== i))}
                    className="text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setNewValues([...newValues, ''])}
              className="text-xs text-stone-400 hover:text-primary-600 flex items-center gap-1 transition-colors"
            >
              <Plus size={12} /> mais valor
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !newName.trim()}
              className="text-sm bg-primary-500 hover:bg-primary-600 text-white px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
            >
              {createMut.isPending ? 'A criar...' : 'Criar'}
            </button>
            <button onClick={cancelAdd} className="text-sm text-stone-500 hover:text-stone-700 transition-colors">
              Cancelar
            </button>
          </div>
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
      {!isLoading && attrs.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center py-14 px-8 text-center bg-white rounded-2xl border border-stone-200">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
            <Layers size={22} className="text-stone-400" />
          </div>
          <p className="text-sm font-medium text-stone-700 mb-1">Biblioteca vazia</p>
          <p className="text-xs text-stone-400 mb-5">
            Crie atributos que pode reutilizar em vários produtos.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} />
            Criar primeiro atributo
          </button>
        </div>
      )}

      {/* Attribute cards */}
      <div className="space-y-3">
        {attrs.map((attr) => (
          <AttributeCard key={attr.id} attr={attr} onChanged={invalidate} />
        ))}
      </div>
    </div>
  )
}

function AttributeCard({ attr, onChanged }: { attr: GlobalAttribute; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(attr.name)
  const [addingVal, setAddingVal] = useState(false)
  const [newVal, setNewVal] = useState('')

  const renameMut = useMutation({
    mutationFn: () => updateGlobalAttribute(attr.id, editName.trim()),
    onSuccess: () => { setEditing(false); onChanged() },
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteGlobalAttribute(attr.id),
    onSuccess: onChanged,
  })

  const addValMut = useMutation({
    mutationFn: () => createGlobalAttributeValue(attr.id, newVal.trim()),
    onSuccess: () => { setNewVal(''); setAddingVal(false); onChanged() },
  })

  const delValMut = useMutation({
    mutationFn: (valueId: number) => deleteGlobalAttributeValue(attr.id, valueId),
    onSuccess: onChanged,
  })

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      {/* Name row */}
      <div className="flex items-center gap-2 mb-4">
        {editing ? (
          <>
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') renameMut.mutate()
                if (e.key === 'Escape') { setEditing(false); setEditName(attr.name) }
              }}
              className="flex-1 border border-primary-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <button
              onClick={() => renameMut.mutate()}
              disabled={renameMut.isPending || !editName.trim()}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-40 transition-colors"
              title="Guardar"
            >
              <Check size={15} />
            </button>
            <button
              onClick={() => { setEditing(false); setEditName(attr.name) }}
              className="p-1.5 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
              title="Cancelar"
            >
              <X size={15} />
            </button>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-stone-800 flex-1">{attr.name}</p>
            <button
              onClick={() => { setEditing(true); setEditName(attr.name) }}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              title="Renomear"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => { if (confirm(`Eliminar o atributo "${attr.name}"?`)) deleteMut.mutate() }}
              disabled={deleteMut.isPending}
              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Eliminar"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>

      {/* Values */}
      <div className="flex flex-wrap gap-2">
        {attr.values.map((v) => (
          <span
            key={v.id}
            className="flex items-center gap-1.5 bg-stone-100 text-stone-700 text-xs font-medium px-2.5 py-1 rounded-full"
          >
            {v.value}
            <button
              onClick={() => delValMut.mutate(v.id)}
              disabled={delValMut.isPending}
              className="text-stone-400 hover:text-red-500 transition-colors"
            >
              <X size={11} />
            </button>
          </span>
        ))}

        {addingVal ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addValMut.mutate()
                if (e.key === 'Escape') { setAddingVal(false); setNewVal('') }
              }}
              placeholder="Novo valor"
              className="border border-primary-300 rounded-full px-2.5 py-0.5 text-xs w-28 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <button
              onClick={() => addValMut.mutate()}
              disabled={addValMut.isPending || !newVal.trim()}
              className="text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors"
            >
              <Check size={13} />
            </button>
            <button
              onClick={() => { setAddingVal(false); setNewVal('') }}
              className="text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingVal(true)}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-primary-600 bg-stone-50 border border-dashed border-stone-200 hover:border-primary-300 px-2.5 py-1 rounded-full transition-colors"
          >
            <Plus size={11} /> valor
          </button>
        )}
      </div>
    </div>
  )
}
