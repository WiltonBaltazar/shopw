import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, Check, X } from 'lucide-react'
import { createCategory } from '~/lib/adminApi'

interface Category { id: number; name: string; slug: string }

interface Props {
  categories: Category[] | undefined
  value: number | ''
  onChange: (id: number | '') => void
}

export function CategorySelect({ categories, value, onChange }: Props) {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState('')

  const addMut = useMutation({
    mutationFn: () => createCategory(newName.trim()),
    onSuccess: (cat) => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      onChange(cat.id)
      setAdding(false)
      setNewName('')
      setError('')
    },
    onError: (e: any) => setError(e?.response?.data?.errors?.name?.[0] ?? 'Erro ao criar categoria.'),
  })

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400"
        >
          <option value="">Sem categoria</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            title="Nova categoria"
            className="flex items-center gap-1 px-3 py-2.5 border border-dashed border-stone-300 rounded-xl text-stone-400 hover:border-primary-400 hover:text-primary-600 text-sm transition-colors whitespace-nowrap"
          >
            <Plus size={14} /> Nova
          </button>
        )}
      </div>

      {adding && (
        <div className="flex gap-2 items-center">
          <input
            autoFocus
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newName.trim()) addMut.mutate() } }}
            placeholder="Nome da categoria..."
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
          />
          <button
            type="button"
            onClick={() => addMut.mutate()}
            disabled={addMut.isPending || !newName.trim()}
            className="p-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {addMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName(''); setError('') }}
            className="p-2 text-stone-400 hover:text-stone-600 border border-stone-200 rounded-lg"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
