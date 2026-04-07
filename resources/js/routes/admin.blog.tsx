import { useState, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Check, ImagePlus, Trash, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2, Heading3, Quote, Pin } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import {
  getAdminBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  type AdminBlogPost,
} from '~/lib/adminApi'
import { cn } from '~/lib/utils'
import { ToggleSwitch } from '~/components/admin/Toggle'

// ---------------------------------------------------------------------------
// Rich text editor
// ---------------------------------------------------------------------------
function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: 'Escreva o conteúdo do artigo aqui…' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'min-h-[220px] px-3 py-2.5 text-sm text-stone-700 leading-relaxed focus:outline-none ' +
          '[&_h2]:font-bold [&_h2]:text-base [&_h2]:mt-3 [&_h2]:mb-1 ' +
          '[&_h3]:font-semibold [&_h3]:text-sm [&_h3]:mt-2 [&_h3]:mb-1 ' +
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 ' +
          '[&_li]:my-0.5 [&_blockquote]:border-l-4 [&_blockquote]:border-stone-200 ' +
          '[&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-stone-500 ' +
          '[&_strong]:font-semibold [&_em]:italic [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] ' +
          '[&_.is-editor-empty:first-child]:before:text-stone-300 [&_.is-editor-empty:first-child]:before:pointer-events-none ' +
          '[&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0',
      },
    },
  })

  if (!editor) return null

  const btn = (active: boolean, action: () => void, title: string, icon: React.ReactNode) => (
    <button
      type="button"
      title={title}
      onClick={action}
      className={cn(
        'w-7 h-7 rounded flex items-center justify-center transition-colors',
        active ? 'bg-primary-100 text-primary-600' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700',
      )}
    >
      {icon}
    </button>
  )

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-stone-100 bg-stone-50 flex-wrap">
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Negrito', <Bold size={13} />)}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Itálico', <Italic size={13} />)}
        {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'Sublinhado', <UnderlineIcon size={13} />)}
        <div className="w-px h-4 bg-stone-200 mx-1" />
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Título 2', <Heading2 size={14} />)}
        {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Título 3', <Heading3 size={14} />)}
        <div className="w-px h-4 bg-stone-200 mx-1" />
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Lista', <List size={13} />)}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Lista numerada', <ListOrdered size={13} />)}
        {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), 'Citação', <Quote size={13} />)}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export const Route = createFileRoute('/admin/blog')({
  component: BlogPage,
})

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  is_published: false,
  is_sticky: false,
  sort_order: 0,
}

type FormState = typeof EMPTY_FORM

function BlogPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdminBlogPost | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [slugManual, setSlugManual] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Cover image state
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [removeCover, setRemoveCover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin', 'blog-posts'],
    queryFn: getAdminBlogPosts,
  })

  const createMutation = useMutation({
    mutationFn: createBlogPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      closeForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => updateBlogPost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      closeForm()
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_published }: { id: number; is_published: boolean }) => {
      const fd = new FormData()
      fd.append('is_published', is_published ? '1' : '0')
      return updateBlogPost(id, fd)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBlogPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      setDeleteId(null)
    },
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSlugManual(false)
    setCoverFile(null)
    setCoverPreview(null)
    setRemoveCover(false)
    setShowForm(true)
  }

  function openEdit(p: AdminBlogPost) {
    setEditing(p)
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      is_published: p.is_published,
      is_sticky: p.is_sticky,
      sort_order: p.sort_order,
    })
    setSlugManual(true)
    setCoverFile(null)
    setCoverPreview(p.cover_image_url)
    setRemoveCover(false)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setSlugManual(false)
    setCoverFile(null)
    setCoverPreview(null)
    setRemoveCover(false)
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: slugManual ? f.slug : slugify(title),
    }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setRemoveCover(false)
    const reader = new FileReader()
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleRemoveCover() {
    setCoverFile(null)
    setCoverPreview(null)
    setRemoveCover(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function buildFormData() {
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('slug', form.slug)
    fd.append('excerpt', form.excerpt)
    fd.append('content', form.content)
    fd.append('is_published', form.is_published ? '1' : '0')
    fd.append('is_sticky', form.is_sticky ? '1' : '0')
    fd.append('sort_order', String(form.sort_order))
    if (coverFile) {
      fd.append('cover_image', coverFile)
    } else if (removeCover) {
      fd.append('remove_cover_image', '1')
    }
    return fd
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = buildFormData()
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: fd })
    } else {
      createMutation.mutate(fd)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const published = posts.filter((p) => p.is_published).length

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-stone-900">Blog</h1>
          <p className="text-stone-500 text-sm mt-1">
            {posts.length > 0
              ? `${posts.length} artigo${posts.length !== 1 ? 's' : ''} · ${published} publicado${published !== 1 ? 's' : ''}`
              : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} />
          Novo artigo
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
              <h2 className="font-semibold text-stone-900">
                {editing ? 'Editar artigo' : 'Novo artigo'}
              </h2>
              <button onClick={closeForm} className="text-stone-400 hover:text-stone-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
              {/* Cover image upload */}
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Imagem de capa</label>
                {coverPreview ? (
                  <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-stone-100">
                    <img src={coverPreview} alt="Capa" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-stone-200 hover:border-primary-300 bg-stone-50 hover:bg-primary-50/40 flex flex-col items-center justify-center gap-2 transition-colors"
                  >
                    <ImagePlus size={22} className="text-stone-400" />
                    <span className="text-xs text-stone-400">Clique para carregar imagem</span>
                    <span className="text-[10px] text-stone-300">JPG, PNG, WEBP · máx. 5 MB</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Como fazer cheesecake em Maputo"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Slug (URL)</label>
                <input
                  readOnly
                  value={form.slug}
                  placeholder="gerado-automaticamente-do-titulo"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm font-mono bg-stone-50 text-stone-500 cursor-default focus:outline-none"
                />
                <p className="text-[11px] text-stone-400 mt-1">Gerado automaticamente a partir do título</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                  Resumo <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  placeholder="Uma breve descrição do artigo (aparece na listagem e para SEO)"
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                  Conteúdo <span className="text-red-400">*</span>
                </label>
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                />
              </div>

              <div className="flex flex-wrap items-end gap-6">
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
                <div className="flex items-center gap-2 pb-0.5">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, is_published: !f.is_published }))}
                    className={cn(
                      'w-9 min-w-9 h-5 shrink-0 rounded-full transition-colors relative',
                      form.is_published ? 'bg-primary-500' : 'bg-stone-200',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                        form.is_published ? 'translate-x-4' : 'translate-x-0.5',
                      )}
                    />
                  </button>
                  <span className="text-xs text-stone-600">Publicado</span>
                </div>
                <div className="flex items-center gap-2 pb-0.5">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, is_sticky: !f.is_sticky }))}
                    className={cn(
                      'w-9 min-w-9 h-5 shrink-0 rounded-full transition-colors relative',
                      form.is_sticky ? 'bg-amber-500' : 'bg-stone-200',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                        form.is_sticky ? 'translate-x-4' : 'translate-x-0.5',
                      )}
                    />
                  </button>
                  <span className="text-xs text-stone-600">Fixar no topo</span>
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
            <p className="font-semibold text-stone-900 mb-2">Eliminar artigo?</p>
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
                <div className="h-3 w-48 bg-stone-100 rounded animate-pulse" />
                <div className="h-4 w-full bg-stone-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-stone-400 text-sm">Nenhum artigo ainda.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-primary-500 hover:text-primary-600 text-sm font-medium transition-colors"
            >
              Criar o primeiro
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {posts.map((p) => (
              <div key={p.id} className="px-6 py-4 flex gap-4 items-start">
                {p.cover_image_url && (
                  <div className="w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-stone-100">
                    <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-stone-800">{p.title}</span>
                    <span className="text-[11px] font-mono text-stone-400">/{p.slug}</span>
                    {p.is_sticky && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                        <Pin size={10} />
                        Fixo
                      </span>
                    )}
                    {p.published_at && (
                      <span className="text-[10px] text-stone-300">
                        {new Date(p.published_at).toLocaleDateString('pt-MZ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 line-clamp-1">{p.excerpt}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ToggleSwitch
                    checked={p.is_published}
                    onChange={() => toggleMutation.mutate({ id: p.id, is_published: !p.is_published })}
                    disabled={toggleMutation.isPending}
                  />
                  <button
                    onClick={() => openEdit(p)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
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
