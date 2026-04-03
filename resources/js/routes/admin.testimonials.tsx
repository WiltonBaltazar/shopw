import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Star, X, Check } from 'lucide-react'
import {
  getAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  type AdminTestimonial,
} from '~/lib/adminApi'
import { cn } from '~/lib/utils'

export const Route = createFileRoute('/admin/testimonials')({
  component: TestimonialsPage,
})

const EMPTY_FORM = {
  author_name: '',
  author_detail: '',
  quote: '',
  rating: 5,
  is_active: true,
  sort_order: 0,
}

type FormState = typeof EMPTY_FORM

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="p-0.5"
        >
          <Star
            size={18}
            className={cn(i <= value ? 'fill-amber-400 text-amber-400' : 'text-stone-300 fill-stone-100')}
          />
        </button>
      ))}
    </div>
  )
}

function TestimonialsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdminTestimonial | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['admin', 'testimonials'],
    queryFn: getAdminTestimonials,
  })

  const createMutation = useMutation({
    mutationFn: createTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] })
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      closeForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateTestimonial>[1] }) =>
      updateTestimonial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] })
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      closeForm()
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      updateTestimonial(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] })
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] })
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      setDeleteId(null)
    },
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(t: AdminTestimonial) {
    setEditing(t)
    setForm({
      author_name: t.author_name,
      author_detail: t.author_detail ?? '',
      quote: t.quote,
      rating: t.rating,
      is_active: t.is_active,
      sort_order: t.sort_order,
    })
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      author_detail: form.author_detail || null,
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-stone-900">Testemunhos</h1>
          <p className="text-stone-500 text-sm mt-1">
            {testimonials.length > 0
              ? `${testimonials.length} testemunho${testimonials.length !== 1 ? 's' : ''} · ${testimonials.filter((t) => t.is_active).length} ativo${testimonials.filter((t) => t.is_active).length !== 1 ? 's' : ''}`
              : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} />
          Novo testemunho
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
              <h2 className="font-semibold text-stone-900">
                {editing ? 'Editar testemunho' : 'Novo testemunho'}
              </h2>
              <button onClick={closeForm} className="text-stone-400 hover:text-stone-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    Nome <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={form.author_name}
                    onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                    placeholder="Ana M."
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    Detalhe
                  </label>
                  <input
                    value={form.author_detail}
                    onChange={(e) => setForm((f) => ({ ...f, author_detail: e.target.value }))}
                    placeholder="Maputo · Cliente desde 2023"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                  Testemunho <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.quote}
                  onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
                  placeholder="Melhor cheesecake que já comi em Maputo!"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center gap-8">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">Avaliação</label>
                  <StarPicker value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">Ordem</label>
                  <input
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                    className="w-20 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                    className={cn(
                      'w-9 h-5 rounded-full transition-colors relative',
                      form.is_active ? 'bg-primary-500' : 'bg-stone-200',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                        form.is_active ? 'translate-x-4' : 'translate-x-0.5',
                      )}
                    />
                  </button>
                  <span className="text-xs text-stone-600">Ativo</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                >
                  {isSaving ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  {editing ? 'Guardar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <p className="font-semibold text-stone-900 mb-2">Eliminar testemunho?</p>
            <p className="text-sm text-stone-500 mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-stone-600 hover:text-stone-800 border border-stone-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 rounded-xl transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-stone-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-6 py-4 space-y-2">
                <div className="h-3 w-32 bg-stone-100 rounded animate-pulse" />
                <div className="h-4 w-full bg-stone-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : testimonials.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-stone-400 text-sm">Nenhum testemunho ainda.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-primary-500 hover:text-primary-600 text-sm font-medium transition-colors"
            >
              Criar o primeiro
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {testimonials.map((t) => (
              <div key={t.id} className="px-6 py-4 flex gap-4 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          className={cn(i < t.rating ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200')}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-stone-800">{t.author_name}</span>
                    {t.author_detail && (
                      <span className="text-xs text-stone-400">{t.author_detail}</span>
                    )}
                    <span className="text-[10px] text-stone-300">#{t.sort_order}</span>
                  </div>
                  <p className="text-sm text-stone-600 line-clamp-2">"{t.quote}"</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleMutation.mutate({ id: t.id, is_active: !t.is_active })}
                    className={cn(
                      'text-xs font-medium px-2.5 py-1 rounded-full transition-colors',
                      t.is_active
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-stone-100 text-stone-400 hover:bg-stone-200',
                    )}
                  >
                    {t.is_active ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteId(t.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
