import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'
import { useProducts, useSeoSettings, useTestimonials, useBlogPosts } from '~/lib/hooks'
import { ProductCard } from '~/components/ui/ProductCard'
import { ArrowRight, Star, MapPin, ChevronRight, ChevronDown, ChevronLeft, Calendar } from 'lucide-react'

export const Route = createFileRoute('/_public/')({
  component: HomePage,
})

const FAQS = [
  {
    q: 'Fazem entrega de cheesecake em Maputo?',
    a: 'Sim, entregamos cheesecakes Homemade em toda a cidade de Maputo e Matola. As encomendas devem ser feitas com pelo menos 24 horas de antecedência.',
  },
  {
    q: 'Como encomendar cheesecake em Maputo?',
    a: 'Basta navegar ao nosso menu, escolher o seu cheesecake favorito, personalizar ao seu gosto e finalizar a encomenda online. Aceitamos pagamento via M-Pesa.',
  },
  {
    q: 'Têm cheesecakes sem lactose em Maputo?',
    a: 'Sim! Temos cheesecakes sem lactose e opções fitness disponíveis. Todos os nossos produtos são feitos à mão em Maputo com ingredientes frescos.',
  },
  {
    q: 'Aceitam pagamento via M-Pesa?',
    a: 'Sim, aceitamos pagamento via M-Pesa e dinheiro na entrega. O pagamento é confirmado antes da preparação da encomenda.',
  },
]

function TestimonialsSection() {
  const { data: testimonials = [], isLoading } = useTestimonials()
  const [current, setCurrent] = useState(0)
  const isCarousel = testimonials.length > 3

  const prev = useCallback(() => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length), [testimonials.length])
  const next = useCallback(() => setCurrent((c) => (c + 1) % testimonials.length), [testimonials.length])

  useEffect(() => {
    if (!isCarousel) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [isCarousel, next])

  if (isLoading) {
    return (
      <div className="flex gap-4 px-4 md:grid md:grid-cols-3 md:gap-5 md:px-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-stone-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!testimonials.length) return null

  if (!isCarousel) {
    return (
      <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-5 md:px-6 md:overflow-x-visible">
        {testimonials.map((t) => (
          <TestimonialCard key={t.id} testimonial={t} />
        ))}
      </div>
    )
  }

  // Carousel: show 3 cards on desktop, 1 on mobile
  const visible = [
    testimonials[current % testimonials.length],
    testimonials[(current + 1) % testimonials.length],
    testimonials[(current + 2) % testimonials.length],
  ]

  return (
    <div className="px-4 md:px-6">
      {/* Desktop: 3-up with prev/next */}
      <div className="hidden md:flex items-center gap-4">
        <button
          onClick={prev}
          className="shrink-0 w-11 h-11 rounded-full border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors shadow-sm"
          aria-label="Anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 grid grid-cols-3 gap-5 overflow-hidden">
          {visible.map((t, i) => (
            <div
              key={`${t.id}-${i}`}
              className="transition-opacity duration-300"
            >
              <TestimonialCard testimonial={t} />
            </div>
          ))}
        </div>
        <button
          onClick={next}
          className="shrink-0 w-11 h-11 rounded-full border border-stone-200 bg-white hover:bg-stone-50 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors shadow-sm"
          aria-label="Seguinte"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Mobile: single card with swipe dots */}
      <div className="md:hidden">
        <div className="overflow-hidden">
          <TestimonialCard testimonial={testimonials[current]} />
        </div>
        <div className="flex justify-center gap-1.5 mt-4">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all p-2.5 -m-2.5 box-content ${i === current ? 'w-5 h-1.5 bg-primary-500' : 'w-1.5 h-1.5 bg-stone-300'}`}
              aria-label={`Testemunho ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop dots */}
      <div className="hidden md:flex justify-center gap-1.5 mt-5">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all p-2.5 -m-2.5 box-content ${i === current ? 'w-5 h-1.5 bg-primary-500' : 'w-1.5 h-1.5 bg-stone-300'}`}
            aria-label={`Testemunho ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

function TestimonialCard({ testimonial }: { testimonial: { author_name: string; author_detail: string | null; quote: string; rating: number } }) {
  return (
    <div className="flex-shrink-0 w-full max-w-none snap-start md:w-auto md:max-w-none bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={12}
            className={i < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200'}
          />
        ))}
      </div>
      <p className="text-stone-600 text-sm leading-relaxed mb-5">"{testimonial.quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-bold flex-shrink-0">
          {testimonial.author_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-stone-800 leading-tight">{testimonial.author_name}</p>
          {testimonial.author_detail && (
            <p className="text-xs text-stone-400 mt-0.5">{testimonial.author_detail}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function BlogPreviewSection() {
  const { data: posts = [], isLoading } = useBlogPosts()
  const preview = posts.slice(0, 3)

  if (!isLoading && preview.length === 0) return null

  return (
    <section className="py-14 md:py-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between px-4 md:px-6 mb-7">
          <h2 className="font-sans font-bold text-stone-900 text-xl md:text-2xl lg:text-3xl">
            Dicas &amp; Inspiração
          </h2>
          <Link
            to="/blog"
            className="text-[12px] font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-0.5 transition-colors"
          >
            Ver mais <ChevronRight size={13} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-5 px-4 md:px-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-stone-100">
                <div className="aspect-[16/9] bg-stone-100 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-20 bg-stone-100 rounded animate-pulse" />
                  <div className="h-4 w-full bg-stone-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5 px-4 md:px-6">
            {preview.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {post.cover_image_url ? (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-primary-50 flex items-center justify-center">
                    <span className="text-3xl">🍰</span>
                  </div>
                )}
                <div className="p-4">
                  {post.published_at && (
                    <div className="flex items-center gap-1 text-[10px] text-stone-400 mb-2">
                      <Calendar size={10} />
                      {new Date(post.published_at).toLocaleDateString('pt-MZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                  <h3 className="font-semibold text-stone-900 text-[14px] leading-snug mb-1.5 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function HomePage() {
  const { data: products, isLoading } = useProducts()
  const seo = useSeoSettings()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      <Helmet>
        <title>{seo.seo_home_title}</title>
        <meta name="description" content={seo.seo_home_description} />
        <meta property="og:title" content={seo.seo_home_title} />
        <meta property="og:description" content={seo.seo_home_description} />
        <meta property="og:type" content="website" />
        {seo.seo_og_image && <meta property="og:image" content={seo.seo_og_image} />}
      </Helmet>

      <style>{`
        @keyframes _fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes _fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .h-fade-up  { animation: _fadeUp  0.72s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .h-fade-in  { animation: _fadeIn  0.6s ease both; }
        .h-d1 { animation-delay: 0.05s; }
        .h-d2 { animation-delay: 0.18s; }
        .h-d3 { animation-delay: 0.30s; }
        .h-d4 { animation-delay: 0.44s; }
        .h-d5 { animation-delay: 0.58s; }
        @keyframes _swipeNudge {
          0%, 100% { transform: translateX(0); opacity: 0.55; }
          50%      { transform: translateX(4px); opacity: 1; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-stone-50">
        {/* Ambient glow blobs */}
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, #685D9422 0%, transparent 68%)' }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 -left-16 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, #685D9414 0%, transparent 70%)' }}
        />

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:gap-10 md:px-6 md:py-24">

          {/* ── Text block ── */}
          <div className="order-2 md:order-1 flex-1 px-5 pt-8 pb-10 md:px-0 md:py-0">
            <p className="h-fade-up h-d1 text-primary-500 text-[11px] font-bold tracking-[0.22em] uppercase mb-4">
              {seo.hero_tagline ?? 'Homemade · Maputo'}
            </p>

            <h1
              className="h-fade-up h-d2 font-sans font-black text-stone-900 leading-[1.03] tracking-tight"
              style={{ fontSize: 'clamp(2.6rem, 9vw, 5rem)' }}
            >
              {(seo.hero_heading ?? 'More Cheese,\nMore Joy')
                .split('\n')
                .map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
            </h1>

            <p className="h-fade-up h-d3 mt-5 text-stone-500 text-[15px] leading-relaxed max-w-sm">
              {seo.hero_subheading ??
                'Cheesecakes Homemade feitos com amor, prontos para a sua celebração especial.'}
            </p>

            <div className="h-fade-up h-d4 mt-7">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 active:scale-[0.97] text-white font-semibold px-7 py-3.5 rounded-full transition-all text-sm shadow-lg"
                style={{ boxShadow: '0 8px 24px #685D9440' }}
              >
                {seo.hero_cta_text ?? 'Escolher o meu cheesecake'}
                <ArrowRight size={15} />
              </Link>
              <p className="mt-3 text-[11px] text-stone-400">
                Encomendas com 24h de antecedência · Entrega em Maputo e Matola
              </p>
            </div>

            {/* Trust signals */}
            <div className="h-fade-up h-d5 mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-stone-400">
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={10} className="fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-1.5 font-semibold text-stone-600">5.0</span>
              </span>
              <span className="text-stone-200">·</span>
              <span>+200 clientes satisfeitos</span>
              <span className="text-stone-200">·</span>
              <span className="flex items-center gap-1">
                <MapPin size={10} />
                Maputo &amp; Matola
              </span>
            </div>
          </div>

          {/* ── Image block ── */}
          <div className="order-1 md:order-2 flex-shrink-0 md:w-[44%] relative">
            {(seo.hero_image_url || seo.seo_og_image) ? (
              <div className="relative aspect-[4/3] md:aspect-[3/4] md:rounded-3xl overflow-hidden">
                <img
                  src={seo.hero_image_url ?? seo.seo_og_image ?? ''}
                  alt="Cheesecake Cheesemania"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/20 to-transparent" />
              </div>
            ) : (
              // Decorative placeholder
              <div className="relative aspect-[4/3] md:aspect-[3/4] md:rounded-3xl overflow-hidden bg-primary-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-3">🍰</div>
                  <p className="text-primary-400 font-semibold">Cheesemania</p>
                </div>
                <div className="absolute top-6 right-8 w-20 h-20 rounded-full border-2 border-primary-200/60" />
                <div className="absolute bottom-10 left-6 w-10 h-10 rounded-full border-2 border-primary-200/60" />
                <div className="absolute bottom-6 right-12 w-5 h-5 rounded-full bg-primary-200/40" />
              </div>
            )}

            {/* Floating delivery badge (desktop only) */}
            <div className="hidden md:flex absolute -bottom-5 -left-5 bg-white rounded-2xl px-4 py-3 shadow-xl items-center gap-2.5 border border-stone-100">
              <span className="text-2xl">🏡</span>
              <div>
                <p className="text-[11px] font-bold text-stone-800 leading-tight">Entrega em casa</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Maputo &amp; Matola</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE STRIP ──────────────────────────────────────── */}
      <div className="bg-primary-500 py-2.5 overflow-hidden">
        <style>{`
          @keyframes home-marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @media (prefers-reduced-motion: reduce) {
            .home-marquee-track { animation: none !important; }
          }
        `}</style>
        <div
          className="home-marquee-track flex w-max whitespace-nowrap"
          style={{ animation: 'home-marquee-scroll 28s linear infinite' }}
        >
          {[
            '✦ Feito à mão',
            '✦ Sem conservantes',
            '✦ Pagamento via M-Pesa',
            '✦ Opção sem lactose',
            '✦ Opção fitness',
            '✦ Entrega ao domicílio',
            '✦ 100% Homemade',
            '✦ Feito com amor',
            '✦ Feito à mão',
            '✦ Sem conservantes',
            '✦ Pagamento via M-Pesa',
            '✦ Opção sem lactose',
            '✦ Opção fitness',
            '✦ Entrega ao domicílio',
            '✦ 100% Homemade',
            '✦ Feito com amor',
          ].map((badge, i) => (
            <span
              key={`${badge}-${i}`}
              className="mr-7 flex-shrink-0 text-white/90 text-[10px] font-bold tracking-[0.18em] uppercase"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURED PRODUCTS ──────────────────────────────────── */}
      <section className="py-14 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between px-4 md:px-6 mb-7">
            <h2 className="font-sans font-bold text-stone-900 text-xl md:text-2xl lg:text-3xl">
              Os nossos clássicos
            </h2>
            <Link
              to="/menu"
              className="text-[12px] font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-0.5 transition-colors"
            >
              Ver todos <ChevronRight size={13} />
            </Link>
          </div>

          {!isLoading && (products?.length ?? 0) > 1 && (
            <div className="md:hidden px-4 mb-3 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                Deslize para ver mais
              </p>
              <span className="inline-flex items-center gap-0.5 text-primary-500">
                <ChevronRight size={13} style={{ animation: '_swipeNudge 1.2s ease-in-out infinite' }} />
                <ChevronRight size={13} style={{ animation: '_swipeNudge 1.2s ease-in-out infinite 0.16s' }} />
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide md:grid md:grid-cols-4 md:px-6 md:overflow-visible">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[68vw] max-w-[260px] md:w-auto md:max-w-none aspect-square rounded-2xl bg-stone-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-4 md:gap-5 md:px-6 md:overflow-x-visible">
              {products?.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="flex-shrink-0 w-[68vw] max-w-[260px] snap-start md:w-auto md:max-w-none"
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────── */}
      <section className="py-14 md:py-20 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-sans font-bold text-stone-900 text-xl md:text-2xl lg:text-3xl px-4 md:px-6 mb-8">
            O que dizem os nossos clientes
          </h2>
          <TestimonialsSection />
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section className="bg-stone-50 py-14 md:py-20">
        <div className="max-w-lg mx-auto md:max-w-6xl px-4 md:px-6">
          <h2 className="font-sans font-bold text-stone-900 text-xl md:text-2xl lg:text-3xl text-center mb-10">
            Como funciona
          </h2>

          <div className="grid grid-cols-3 gap-3 md:gap-8">
            {[
              { step: '01', emoji: '🛒', title: 'Escolha', desc: 'Selecione o seu cheesecake e personalize ao seu gosto.' },
              { step: '02', emoji: '📅', title: 'Encomende', desc: 'Faça a sua encomenda com pelo menos 24h de antecedência.' },
              { step: '03', emoji: '🚀', title: 'Receba', desc: 'Entregamos na sua porta ou levante na nossa loja.' },
            ].map(({ step, emoji, title, desc }, idx) => (
              <div key={step} className="flex flex-col items-center text-center gap-2">
                {/* Connected step indicator */}
                <div className="relative flex items-center justify-center w-full mb-2">
                  {idx > 0 && (
                    <div className="absolute right-[calc(50%+1.375rem)] top-1/2 -translate-y-1/2 left-0 h-px bg-primary-200" />
                  )}
                  <div
                    className="relative z-10 w-11 h-11 rounded-full bg-primary-500 flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
                    style={{ boxShadow: '0 4px 14px #685D9438' }}
                  >
                    {step}
                  </div>
                </div>
                <span className="text-2xl md:text-3xl">{emoji}</span>
                <h3 className="font-semibold text-stone-800 text-[13px] md:text-base leading-tight">{title}</h3>
                <p className="text-xs text-stone-400 leading-relaxed hidden md:block">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOG PREVIEW ───────────────────────────────────────── */}
      <BlogPreviewSection />

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section className="py-14 md:py-20">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <h2 className="font-sans font-bold text-stone-900 text-xl md:text-2xl lg:text-3xl mb-8 text-center">
            Perguntas frequentes
          </h2>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => {
              const open = openFaq === i
              return (
                <div
                  key={i}
                  className={`rounded-2xl border transition-colors overflow-hidden ${open ? 'border-primary-200 bg-primary-50/60' : 'border-stone-100 bg-white'}`}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={open}
                  >
                    <span className={`font-semibold text-[14px] leading-snug transition-colors ${open ? 'text-primary-700' : 'text-stone-800'}`}>
                      {q}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180 text-primary-500' : 'text-stone-400'}`}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: open ? '200px' : '0px' }}
                  >
                    <p className="px-5 pb-5 text-sm text-stone-500 leading-relaxed">
                      {a}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────────── */}
      <section className="py-16 px-5 text-center">
        <div className="max-w-sm mx-auto">
          <p className="text-4xl mb-4">🎂</p>
          <h2 className="font-sans font-black text-stone-900 text-2xl md:text-3xl leading-tight mb-3">
            Pronto(a) a encantar na sua próxima celebração?
          </h2>
          <p className="text-stone-400 text-sm mb-2 leading-relaxed">
            Explore o menu e faça a sua encomenda.
          </p>
          <p className="text-stone-400 text-xs mb-7">
            Entrega em Maputo · Pagamento via M-Pesa · 24h de antecedência
          </p>
          <Link
            to="/encomenda-evento"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 active:scale-[0.97] text-white font-semibold px-8 py-4 rounded-full transition-all text-sm shadow-lg"
            style={{ boxShadow: '0 8px 24px #685D9438' }}
          >
            Fazer a minha encomenda
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </>
  )
}
