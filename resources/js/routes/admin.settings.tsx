import { useState, useEffect, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, X, Loader2, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2, Heading3, Quote, Save, Check } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { getSettings, updateSettings, uploadSettingImage, getAdminPages, updateAdminPage, type AppSettings, type AdminPage } from '~/lib/adminApi'
import { generateColorScale } from '~/lib/colorScale'

export const Route = createFileRoute('/admin/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: getSettings,
  })
  const { data: pages = [], isLoading: isPagesLoading } = useQuery({
    queryKey: ['admin', 'pages'],
    queryFn: getAdminPages,
  })

  const [form, setForm] = useState<Partial<AppSettings>>({})
  const [saved, setSaved] = useState(false)

  // Populate form when settings load
  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'settings'], data)
      // Also invalidate the public settings so Helmet picks up changes
      queryClient.invalidateQueries({ queryKey: ['public-settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="h-6 bg-stone-100 rounded animate-pulse w-1/3 mb-8" />
        <div className="h-10 bg-stone-100 rounded animate-pulse" />
      </div>
    )
  }

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== null && v !== undefined)
    ) as Partial<AppSettings>
    mutation.mutate(payload)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-stone-800 mb-1">Configurações</h1>
      <p className="text-stone-500 text-sm mb-8">Definições gerais da loja e SEO</p>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Delivery hours */}
        <section className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          <div className="px-6 py-4">
            <h2 className="font-medium text-stone-800">Horários de entrega</h2>
            <p className="text-xs text-stone-400 mt-0.5">Intervalo de horas em que os clientes podem agendar entregas.</p>
          </div>
          <div className="p-6 flex gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-stone-700 mb-1">Hora de início</label>
              <select
                value={form.delivery_start_hour ?? '10'}
                onChange={(e) => set('delivery_start_hour', e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 outline-none focus:border-primary-400"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-stone-700 mb-1">Hora de fim</label>
              <select
                value={form.delivery_end_hour ?? '19'}
                onChange={(e) => set('delivery_end_hour', e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 outline-none focus:border-primary-400"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          <div className="px-6 py-4">
            <h2 className="font-medium text-stone-800">Contacto</h2>
          </div>
          <div className="p-6">
            <label className="block text-sm font-medium text-stone-700 mb-1">Número WhatsApp</label>
            <p className="text-xs text-stone-400 mb-3">Inclua o código do país (ex: 258840000000).</p>
            <input
              type="tel"
              value={form.whatsapp_number ?? ''}
              onChange={(e) => set('whatsapp_number', e.target.value.replace(/\D/g, ''))}
              placeholder="258840000000"
              className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-300 outline-none focus:border-primary-400"
            />
          </div>
        </section>

        {/* Payment methods */}
        <section className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          <div className="px-6 py-4">
            <h2 className="font-medium text-stone-800">Pagamentos</h2>
            <p className="text-xs text-stone-400 mt-0.5">Ative ou desative métodos de pagamento no checkout.</p>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between gap-4 border border-stone-200 rounded-xl px-4 py-3 bg-stone-50">
              <div>
                <p className="text-sm font-medium text-stone-800">Pagar na entrega</p>
                <p className="text-xs text-stone-400 mt-0.5">Mostra a opção no checkout para cobrar offline na entrega.</p>
              </div>
              <button
                type="button"
                onClick={() => set('pay_on_delivery_enabled', !(form.pay_on_delivery_enabled ?? false))}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.pay_on_delivery_enabled ? 'bg-primary-500' : 'bg-stone-300'}`}
                aria-label="Ativar pagamento na entrega"
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    form.pay_on_delivery_enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Branding */}
        <section className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          <div className="px-6 py-4">
            <h2 className="font-medium text-stone-800">Branding</h2>
            <p className="text-xs text-stone-400 mt-0.5">Logótipos e textos da secção principal (hero) da página inicial.</p>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Logótipo</label>
              <p className="text-xs text-stone-400 mb-2">Se vazio, mostra o nome do site em texto.</p>
              <ImageUploadField
                value={form.brand_logo_url ?? null}
                settingKey="brand_logo_url"
                onUploaded={(url) => {
                  set('brand_logo_url', url)
                  queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
                  queryClient.invalidateQueries({ queryKey: ['public-settings'] })
                }}
                onRemove={() => {
                  set('brand_logo_url', '')
                  mutation.mutate({ brand_logo_url: '' })
                }}
                aspectHint="Recomendado: PNG transparente, altura ≥ 80px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Logótipo do Footer</label>
              <p className="text-xs text-stone-400 mb-2">Opcional. Se não for definido, o footer usa o logótipo principal do menu/navbar.</p>
              <ImageUploadField
                value={form.footer_logo_url ?? null}
                settingKey="footer_logo_url"
                onUploaded={(url) => {
                  set('footer_logo_url', url)
                  queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
                  queryClient.invalidateQueries({ queryKey: ['public-settings'] })
                }}
                onRemove={() => {
                  set('footer_logo_url', '')
                  mutation.mutate({ footer_logo_url: '' })
                }}
                aspectHint="Recomendado: PNG transparente, altura ≥ 120px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Favicon</label>
              <p className="text-xs text-stone-400 mb-2">Ícone do separador do browser. Recomendado: 32×32 ou 48×48 (PNG/ICO).</p>
              <ImageUploadField
                value={form.favicon_url ?? null}
                settingKey="favicon_url"
                onUploaded={(url) => {
                  set('favicon_url', url)
                  queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
                  queryClient.invalidateQueries({ queryKey: ['public-settings'] })
                }}
                onRemove={() => {
                  set('favicon_url', '')
                  mutation.mutate({ favicon_url: '' })
                }}
                aspectHint="32 × 32px ou 48 × 48px recomendado"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Imagem Hero</label>
              <p className="text-xs text-stone-400 mb-2">Imagem principal da página inicial. Se vazia, usa a OG Image como fallback. Recomendado: 800×600px ou superior.</p>
              <ImageUploadField
                value={form.hero_image_url ?? null}
                settingKey="hero_image_url"
                onUploaded={(url) => {
                  set('hero_image_url', url)
                  queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
                  queryClient.invalidateQueries({ queryKey: ['public-settings'] })
                }}
                onRemove={() => {
                  set('hero_image_url', '')
                  mutation.mutate({ hero_image_url: '' })
                }}
                aspectHint="800 × 600px ou superior recomendado"
              />
            </div>
            <SeoField
              label="Tagline (Hero)"
              hint="Texto pequeno acima do título principal. Ex: Homemade · Maputo"
              value={form.hero_tagline ?? ''}
              onChange={(v) => set('hero_tagline', v)}
              maxLength={200}
            />
            <SeoField
              label="Título principal (Hero)"
              hint="Título grande da página inicial. Use uma nova linha (Enter) para quebrar em duas linhas."
              value={form.hero_heading ?? ''}
              onChange={(v) => set('hero_heading', v)}
              maxLength={200}
              multiline
            />
            <SeoField
              label="Subtítulo (Hero)"
              hint="Texto descritivo abaixo do título principal."
              value={form.hero_subheading ?? ''}
              onChange={(v) => set('hero_subheading', v)}
              maxLength={500}
              multiline
            />
            <SeoField
              label="Texto do botão CTA"
              hint="Texto do botão principal da hero. Ex: Ver o Menu"
              value={form.hero_cta_text ?? ''}
              onChange={(v) => set('hero_cta_text', v)}
              maxLength={80}
            />
          </div>
        </section>

        {/* Brand Color */}
        <section className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          <div className="px-6 py-4">
            <h2 className="font-medium text-stone-800">Cor da Marca</h2>
            <p className="text-xs text-stone-400 mt-0.5">Cor primária usada em botões, destaques e elementos interativos em todo o site.</p>
          </div>
          <div className="p-6">
            <BrandColorPicker
              value={form.theme_primary_color ?? '#685D94'}
              onChange={(hex) => set('theme_primary_color', hex)}
            />
          </div>
        </section>

        {/* SEO */}
        <section className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          <div className="px-6 py-4">
            <h2 className="font-medium text-stone-800">SEO</h2>
            <p className="text-xs text-stone-400 mt-0.5">Títulos e descrições mostrados nos resultados do Google e partilhas em redes sociais.</p>
          </div>

          <div className="p-6 space-y-5">
            <SeoField
              label="Nome do site"
              hint="Aparece no final dos títulos de página."
              value={form.seo_site_name ?? ''}
              onChange={(v) => set('seo_site_name', v)}
              maxLength={100}
            />
            <SeoField
              label="Título — Página inicial"
              hint="Recomendado: 50–60 caracteres."
              value={form.seo_home_title ?? ''}
              onChange={(v) => set('seo_home_title', v)}
              maxLength={120}
            />
            <SeoField
              label="Descrição — Página inicial"
              hint="Recomendado: 150–160 caracteres."
              value={form.seo_home_description ?? ''}
              onChange={(v) => set('seo_home_description', v)}
              maxLength={300}
              multiline
            />
            <SeoField
              label="Título — Menu"
              hint="Recomendado: 50–60 caracteres."
              value={form.seo_menu_title ?? ''}
              onChange={(v) => set('seo_menu_title', v)}
              maxLength={120}
            />
            <SeoField
              label="Descrição — Menu"
              hint="Recomendado: 150–160 caracteres."
              value={form.seo_menu_description ?? ''}
              onChange={(v) => set('seo_menu_description', v)}
              maxLength={300}
              multiline
            />
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Imagem padrão (OG Image)</label>
              <p className="text-xs text-stone-400 mb-2">Imagem usada em partilhas quando não há imagem de produto. Tamanho ideal: 1200×630px.</p>
              <ImageUploadField
                value={form.seo_og_image ?? null}
                settingKey="seo_og_image"
                onUploaded={(url) => {
                  set('seo_og_image', url)
                  queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
                  queryClient.invalidateQueries({ queryKey: ['public-settings'] })
                }}
                onRemove={() => {
                  set('seo_og_image', '')
                  mutation.mutate({ seo_og_image: '' })
                }}
                aspectHint="1200 × 630px recomendado"
              />
            </div>
          </div>
        </section>

        {/* Páginas legais */}
        <section className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
          <div className="px-6 py-4">
            <h2 className="font-medium text-stone-800">Páginas legais</h2>
            <p className="text-xs text-stone-400 mt-0.5">Geridas pelo novo modelo de páginas com editor WYSIWYG.</p>
          </div>
          <div className="p-6">
            <LegalPagesEditor pages={pages} isLoading={isPagesLoading} />
          </div>
        </section>

        {/* Save bar */}
        <div className="flex items-center justify-between py-2">
          {saved && <span className="text-sm text-green-600 font-medium">Guardado com sucesso</span>}
          {!saved && <span />}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            {mutation.isPending ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600">Erro ao guardar. Tente novamente.</p>
        )}
      </form>
    </div>
  )
}

function ImageUploadField({
  value,
  settingKey,
  onUploaded,
  onRemove,
  aspectHint,
}: {
  value: string | null
  settingKey: 'brand_logo_url' | 'footer_logo_url' | 'seo_og_image' | 'hero_image_url' | 'favicon_url'
  onUploaded: (url: string) => void
  onRemove: () => void
  aspectHint?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Apenas imagens são permitidas.'); return }
    setUploading(true)
    setError('')
    try {
      const url = await uploadSettingImage(settingKey, file)
      onUploaded(url)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao fazer upload. Tente novamente.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative inline-block group">
          <img
            src={value}
            alt=""
            className="h-16 w-auto max-w-xs object-contain rounded-xl border border-stone-200 bg-stone-50 p-1.5"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remover imagem"
          >
            <X size={11} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-2 flex items-center gap-1.5 text-xs text-stone-500 hover:text-primary-600 transition-colors"
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploading ? 'A carregar...' : 'Substituir imagem'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-3 border-2 border-dashed border-stone-200 hover:border-primary-300 hover:bg-primary-50/50 rounded-xl px-4 py-3 transition-colors text-stone-400 hover:text-primary-500"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          <div className="text-left">
            <p className="text-sm font-medium">{uploading ? 'A carregar...' : 'Carregar imagem'}</p>
            {aspectHint && <p className="text-xs text-stone-400 mt-0.5">{aspectHint}</p>}
          </div>
        </button>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.ico"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

const COLOR_SWATCHES = [
  { label: 'Violeta', value: '#685D94' },
  { label: 'Anil', value: '#3B5BDB' },
  { label: 'Esmeralda', value: '#0CA678' },
  { label: 'Rubi', value: '#C2255C' },
  { label: 'Âmbar', value: '#F08C00' },
  { label: 'Ardósia', value: '#495057' },
]

function BrandColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const base = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#685D94'
  const scale = generateColorScale(base)

  return (
    <div className="space-y-5">
      {/* Predefined swatches */}
      <div>
        <p className="text-xs text-stone-500 mb-2">Cores predefinidas</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_SWATCHES.map((s) => (
            <button
              key={s.value}
              type="button"
              title={s.label}
              onClick={() => onChange(s.value)}
              className={`w-9 h-9 rounded-full border-2 transition-all ${
                base === s.value
                  ? 'border-stone-800 scale-110 shadow-md'
                  : 'border-transparent hover:border-stone-400'
              }`}
              style={{ backgroundColor: s.value }}
            />
          ))}
        </div>
      </div>

      {/* Custom color wheel */}
      <div className="flex items-center gap-3">
        <p className="text-xs text-stone-500">Cor personalizada</p>
        <label className="cursor-pointer">
          <input
            type="color"
            value={base}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-stone-200 cursor-pointer p-0.5"
          />
        </label>
        <span className="text-xs font-mono text-stone-500">{base}</span>
      </div>

      {/* Scale preview */}
      <div>
        <p className="text-xs text-stone-500 mb-2">Pré-visualização da escala</p>
        <div className="flex rounded-xl overflow-hidden">
          {Object.entries(scale).map(([shade, hex]) => (
            <div
              key={shade}
              title={`primary-${shade}: ${hex}`}
              className="flex-1 h-8"
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        <div className="flex mt-1">
          {Object.keys(scale).map((shade) => (
            <span key={shade} className="flex-1 text-center text-[10px] text-stone-400">{shade}</span>
          ))}
        </div>
      </div>

      {/* Button preview */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: scale['500'] }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = scale['600'])}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = scale['500'])}
        >
          Guardar alterações
        </button>
        <span className="text-xs text-stone-400">Pré-visualização do botão</span>
      </div>
    </div>
  )
}

function SeoField({
  label, hint, value, onChange, maxLength, multiline, placeholder,
}: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  maxLength: number
  multiline?: boolean
  placeholder?: string
}) {
  const len = value.length
  const warn = multiline ? len > 160 : len > 60
  const over = multiline ? len > 300 : len > 120

  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      <p className="text-xs text-stone-400 mb-2">{hint}</p>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          rows={3}
          placeholder={placeholder}
          className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-300 outline-none focus:border-primary-400 resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-300 outline-none focus:border-primary-400"
        />
      )}
      {len > 0 && (
        <p className={`text-xs mt-1 ${over ? 'text-red-500' : warn ? 'text-amber-500' : 'text-stone-400'}`}>
          {len} caracteres{warn && !over ? ' — um pouco longo' : over ? ' — demasiado longo' : ''}
        </p>
      )}
    </div>
  )
}

const LEGAL_PAGE_META = [
  {
    slug: 'politica-de-privacidade',
    fallbackTitle: 'Política de Privacidade',
    path: '/politica-de-privacidade',
    hint: 'Conteúdo visível na página pública de privacidade.',
  },
  {
    slug: 'termos-e-condicoes',
    fallbackTitle: 'Termos e Condições',
    path: '/termos-e-condicoes',
    hint: 'Conteúdo visível na página pública de termos e condições.',
  },
  {
    slug: 'politica-de-reembolso',
    fallbackTitle: 'Política de Reembolso',
    path: '/politica-de-reembolso',
    hint: 'Conteúdo visível na página pública de devolução e reembolso.',
  },
] as const

function LegalPagesEditor({ pages, isLoading }: { pages: AdminPage[]; isLoading: boolean }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ title: string; content: string | null; is_published: boolean }> }) =>
      updateAdminPage(id, data),
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] })
      queryClient.invalidateQueries({ queryKey: ['public-page', page.slug] })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border border-stone-200 rounded-2xl p-5 space-y-3">
            <div className="h-4 w-44 rounded bg-stone-100 animate-pulse" />
            <div className="h-10 rounded bg-stone-100 animate-pulse" />
            <div className="h-48 rounded bg-stone-100 animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {LEGAL_PAGE_META.map((meta) => (
        <LegalPageCard
          key={meta.slug}
          page={pages.find((p) => p.slug === meta.slug) ?? null}
          fallbackTitle={meta.fallbackTitle}
          path={meta.path}
          hint={meta.hint}
          isSaving={mutation.isPending && mutation.variables?.id === pages.find((p) => p.slug === meta.slug)?.id}
          onSave={(id, data, onSaved) => mutation.mutate({ id, data }, { onSuccess: onSaved })}
        />
      ))}
      {mutation.isError && (
        <p className="text-sm text-red-600">Erro ao guardar a página legal. Tente novamente.</p>
      )}
    </div>
  )
}

function LegalPageCard({
  page,
  fallbackTitle,
  path,
  hint,
  isSaving,
  onSave,
}: {
  page: AdminPage | null
  fallbackTitle: string
  path: string
  hint: string
  isSaving: boolean
  onSave: (id: number, data: { title: string; content: string | null; is_published: boolean }, onSaved: () => void) => void
}) {
  const [title, setTitle] = useState(page?.title ?? fallbackTitle)
  const [content, setContent] = useState(page?.content ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setTitle(page?.title ?? fallbackTitle)
    setContent(page?.content ?? '')
  }, [page?.id, page?.updated_at, page?.title, page?.content, fallbackTitle])

  function handleSave() {
    if (!page) return
    setSaved(false)
    onSave(
      page.id,
      {
        title: title.trim() || fallbackTitle,
        content: content.trim() || null,
        is_published: true,
      },
      () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2200)
      },
    )
  }

  if (!page) {
    return (
      <div className="border border-amber-200 bg-amber-50 rounded-2xl p-5">
        <p className="text-sm font-medium text-amber-800">{fallbackTitle}</p>
        <p className="text-xs text-amber-700 mt-1">Página não encontrada no banco. Rode as migrações para criar o novo modelo de páginas.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-white to-stone-50/50 p-5 md:p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">{fallbackTitle}</label>
        <p className="text-xs text-stone-400">{hint} URL: <span className="font-mono">{path}</span></p>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={255}
        className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 placeholder-stone-300 outline-none focus:border-primary-400"
        placeholder={fallbackTitle}
      />

      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder={`Escreva o conteúdo da página \"${fallbackTitle}\"...`}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-400">{content.replace(/<[^>]*>/g, '').trim().length} caracteres (texto)</p>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {isSaving ? 'A guardar...' : saved ? 'Guardado' : 'Guardar página'}
        </button>
      </div>
    </div>
  )
}

function RichTextEditor({
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
          'min-h-[240px] px-3 py-2.5 text-sm text-stone-700 leading-relaxed focus:outline-none ' +
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
