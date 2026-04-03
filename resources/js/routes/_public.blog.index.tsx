import { createFileRoute, Link } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'
import { ChevronRight, Calendar } from 'lucide-react'
import { useBlogPosts } from '~/lib/hooks'

export const Route = createFileRoute('/_public/blog/')({
  component: BlogListPage,
})

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pt-MZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

function BlogListPage() {
  const { data: posts = [], isLoading } = useBlogPosts()

  return (
    <>
      <Helmet>
        <title>Blog — Cheesemania Maputo</title>
        <meta
          name="description"
          content="Dicas, receitas e inspiração sobre cheesecakes Homemade em Maputo. Descubra tudo sobre os nossos produtos e celebrações especiais."
        />
        <meta property="og:title" content="Blog — Cheesemania Maputo" />
        <meta
          property="og:description"
          content="Dicas, receitas e inspiração sobre cheesecakes Homemade em Maputo."
        />
      </Helmet>

      <section className="max-w-6xl mx-auto px-5 md:px-4 py-14 md:py-20">
        <div className="mb-10">
          <h1 className="font-sans font-black text-stone-900 text-3xl md:text-4xl leading-tight">
            Blog
          </h1>
          <p className="text-stone-500 text-sm mt-2">
            Dicas, receitas e inspiração sobre cheesecakes Homemade em Maputo.
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-stone-100">
                <div className="aspect-[16/9] bg-stone-100 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-24 bg-stone-100 rounded animate-pulse" />
                  <div className="h-5 w-full bg-stone-100 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-stone-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-stone-400 text-sm">Ainda não há artigos publicados. Volte em breve!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {posts.map((post) => (
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-primary-50 flex items-center justify-center">
                    <span className="text-4xl">🍰</span>
                  </div>
                )}
                <div className="p-5">
                  {post.published_at && (
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-3">
                      <Calendar size={11} />
                      {formatDate(post.published_at)}
                    </div>
                  )}
                  <h2 className="font-semibold text-stone-900 text-[15px] leading-snug mb-2 group-hover:text-primary-600 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-stone-500 leading-relaxed line-clamp-2 mb-4">
                    {post.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary-500 group-hover:text-primary-600 transition-colors">
                    Ler artigo <ChevronRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
