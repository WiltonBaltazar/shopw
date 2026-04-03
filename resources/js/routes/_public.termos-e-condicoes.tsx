import { createFileRoute, Link } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft } from 'lucide-react'
import { usePublicPage, useSeoSettings } from '~/lib/hooks'

export const Route = createFileRoute('/_public/termos-e-condicoes')({
  component: TermsAndConditionsPage,
})

function TermsAndConditionsPage() {
  const seo = useSeoSettings()
  const siteName = seo.seo_site_name ?? 'Cheesemania'
  const { data: page, isLoading, isError } = usePublicPage('termos-e-condicoes')

  return (
    <>
      <Helmet>
        <title>{page?.title ?? 'Termos e Condições'} — {siteName}</title>
        <meta name="description" content="Consulte os termos e condições de utilização e compra no site da Cheesemania." />
      </Helmet>

      <section className="relative overflow-hidden px-5 md:px-6 py-12 md:py-16">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50/50 via-white to-white" />

        <div className="max-w-4xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Voltar ao início
          </Link>

          <header className="mb-7 md:mb-10">
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary-600 font-bold mb-3">Documento legal</p>
            <h1 className="font-sans font-black text-stone-900 text-3xl md:text-4xl leading-tight">
              {page?.title ?? 'Termos e Condições'}
            </h1>
          </header>

          <article className="bg-white/95 backdrop-blur rounded-3xl border border-primary-100 shadow-[0_22px_60px_-40px_rgba(17,24,39,0.45)] px-6 py-7 md:px-9 md:py-10">
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-4 rounded bg-stone-100 animate-pulse" style={{ width: `${85 - i * 6}%` }} />
                ))}
              </div>
            )}

            {(isError || !page) && !isLoading && (
              <p className="text-stone-500">Os termos e condições ainda não estão disponíveis.</p>
            )}

            {!!page?.content && !isLoading && (
              <div
                className="
                  text-stone-700 text-[15px] leading-relaxed space-y-4
                  [&_h2]:font-bold [&_h2]:text-stone-900 [&_h2]:text-xl [&_h2]:mt-6 [&_h2]:mb-2
                  [&_h3]:font-semibold [&_h3]:text-stone-800 [&_h3]:text-base [&_h3]:mt-4 [&_h3]:mb-1
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                  [&_strong]:font-semibold [&_em]:italic
                  [&_blockquote]:border-l-4 [&_blockquote]:border-primary-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-stone-500
                  [&_a]:text-primary-600 [&_a]:underline [&_a]:underline-offset-2
                "
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            )}
          </article>
        </div>
      </section>
    </>
  )
}
