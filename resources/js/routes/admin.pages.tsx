import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, Loader2, Eye, EyeOff, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2, Heading3, Quote, Save } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { createAdminPage, deleteAdminPage, getAdminPages, updateAdminPage, type AdminPage } from '~/lib/adminApi'

export const Route = createFileRoute('/admin/pages')({
  component: AdminPagesPage,
})

const LEGAL_SLUGS = new Set([
  'politica-de-privacidade',
  'termos-e-condicoes',
  'politica-de-reembolso',
])

type FormState = {
  title: string
  slug: string
  content: string
  is_published: boolean
}

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  content: '',
  is_published: true,
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function AdminPagesPage() {
  const queryClient = useQueryClient()
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['admin', 'pages'],
    queryFn: getAdminPages,
  })

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdminPage | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [slugManual, setSlugManual] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminPage | null>(null)

  const createMutation = useMutation({
    mutationFn: createAdminPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] })
      closeForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FormState> }) => updateAdminPage(id, data),
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] })
      queryClient.invalidateQueries({ queryKey: ['public-page', page.slug] })
      closeForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] })
      setDeleteTarget(null)
    },
  })

  const sortedPages = useMemo(
    () => [...pages].sort((a, b) => Number(LEGAL_SLUGS.has(b.slug)) - Number(LEGAL_SLUGS.has(a.slug)) || a.title.localeCompare(b.title)),
    [pages],
  )

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setSlugManual(false)
    setShowForm(true)
  }

  function openEdit(page: AdminPage) {
    setEditing(page)
    setForm({
      title: page.title,
      slug: page.slug,
      content: page.content ?? '',
      is_published: page.is_published,
    })
    setSlugManual(true)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setSlugManual(false)
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugManual ? prev.slug : slugify(title),
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      content: form.content.trim() || null,
      is_published: form.is_published,
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload })
      return
    }

    createMutation.mutate(payload)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-stone-900">Páginas</h1>
          <p className="text-stone-500 text-sm mt-1">Crie páginas estáticas como políticas, termos, FAQ e conteúdo institucional.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} />
          Nova página
        </button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl border border-stone-200 bg-white animate-pulse" />
          ))}
        </div>
      ) : sortedPages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="text-stone-700 font-medium">Nenhuma página criada.</p>
          <p className="text-stone-500 text-sm mt-1">Clique em "Nova página" para começar.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sortedPages.map((page) => (
            <article key={page.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-stone-900 font-semibold leading-tight">{page.title}</h2>
                    {LEGAL_SLUGS.has(page.slug) && (
                      <span className="text-[10px] uppercase tracking-wider bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-semibold">Legal</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-1 font-mono">/{page.slug}</p>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${page.is_published ? 'text-green-700' : 'text-stone-500'}`}>
                  {page.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                  {page.is_published ? 'Publicado' : 'Rascunho'}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(page)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <Pencil size={13} />
                  Editar
                </button>
                {!LEGAL_SLUGS.has(page.slug) && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(page)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                    Apagar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/45 p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 flex flex-col">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-stone-900">{editing ? 'Editar página' : 'Nova página'}</h3>
                <p className="text-xs text-stone-500 mt-0.5">Conteúdo em HTML rico via editor visual.</p>
              </div>
              <button onClick={closeForm} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500">
                <X size={16} />
              </button>
            </div>

            <form id="admin-pages-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Título</label>
                  <input
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                    maxLength={255}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 outline-none focus:border-primary-400"
                    placeholder="Ex: Política de Reembolso"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Slug (URL)</label>
                  <input
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManual(true)
                      setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                    }}
                    required
                    maxLength={255}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 outline-none focus:border-primary-400 font-mono"
                    placeholder="politica-de-reembolso"
                  />
                </div>
              </div>

              <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/60">
                <label className="inline-flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_published: e.target.checked }))}
                    className="rounded border-stone-300"
                  />
                  Publicar página
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Conteúdo</label>
                <PageRichTextEditor
                  value={form.content}
                  onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
                  placeholder="Escreva o conteúdo da página..."
                />
              </div>

              {(createMutation.isError || updateMutation.isError) && (
                <p className="text-sm text-red-600">Erro ao guardar página. Verifique se o slug já existe.</p>
              )}
            </form>

            <div className="px-6 py-4 border-t border-stone-100 bg-white flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 rounded-lg border border-stone-200 text-sm text-stone-700 hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="admin-pages-form"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {isSaving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/45 p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-stone-900">Apagar página</h3>
            <p className="text-sm text-stone-600 mt-2">
              Tem certeza que deseja apagar <span className="font-semibold">{deleteTarget.title}</span>?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-stone-200 text-sm text-stone-700 hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white"
              >
                {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PageRichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (html: string) => void
  placeholder: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'min-h-[300px] px-3 py-2.5 text-sm text-stone-700 leading-relaxed focus:outline-none ' +
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

  useEffect(() => {
    if (!editor) return
    const incoming = value || ''
    if (editor.getHTML() !== incoming) {
      editor.commands.setContent(incoming, { emitUpdate: false })
    }
  }, [editor, value])

  if (!editor) return null

  const toolbarButton = (
    active: boolean,
    title: string,
    onClick: () => void,
    icon: React.ReactNode,
  ) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
        active ? 'bg-primary-100 text-primary-600' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
      }`}
    >
      {icon}
    </button>
  )

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-transparent bg-white">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-stone-100 bg-stone-50 flex-wrap">
        {toolbarButton(editor.isActive('bold'), 'Negrito', () => editor.chain().focus().toggleBold().run(), <Bold size={13} />)}
        {toolbarButton(editor.isActive('italic'), 'Itálico', () => editor.chain().focus().toggleItalic().run(), <Italic size={13} />)}
        {toolbarButton(editor.isActive('underline'), 'Sublinhado', () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon size={13} />)}
        <div className="w-px h-4 bg-stone-200 mx-1" />
        {toolbarButton(editor.isActive('heading', { level: 2 }), 'Título 2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={14} />)}
        {toolbarButton(editor.isActive('heading', { level: 3 }), 'Título 3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 size={14} />)}
        <div className="w-px h-4 bg-stone-200 mx-1" />
        {toolbarButton(editor.isActive('bulletList'), 'Lista', () => editor.chain().focus().toggleBulletList().run(), <List size={13} />)}
        {toolbarButton(editor.isActive('orderedList'), 'Lista numerada', () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered size={13} />)}
        {toolbarButton(editor.isActive('blockquote'), 'Citação', () => editor.chain().focus().toggleBlockquote().run(), <Quote size={13} />)}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
