import { createFileRoute, Link } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, Calendar } from 'lucide-react'
import { useBlogPost } from '~/lib/hooks'

export const Route = createFileRoute('/_public/blog/$slug')({
  component: BlogPostPage,
})

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pt-MZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

function BlogPostPage() {
  const { slug } = Route.useParams()
  const { data: post, isLoading, isError } = useBlogPost(slug)

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-5 md:px-4 py-14 md:py-20 space-y-4">
        <div className="h-4 w-32 bg-stone-100 rounded animate-pulse" />
        <div className="h-8 w-3/4 bg-stone-100 rounded animate-pulse" />
        <div className="aspect-[16/9] bg-stone-100 rounded-2xl animate-pulse" />
        <div className="space-y-3 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-stone-100 rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !post) {
    return (
      <div className="max-w-2xl mx-auto px-5 md:px-4 py-20 text-center">
        <p className="text-stone-400 text-sm mb-4">Artigo não encontrado.</p>
        <Link to="/blog" className="text-primary-500 hover:text-primary-600 text-sm font-semibold transition-colors">
          ← Voltar ao blog
        </Link>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{post.title} — Cheesemania</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={`${post.title} — Cheesemania`} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        {post.cover_image_url && <meta property="og:image" content={post.cover_image_url} />}
        {post.published_at && <meta property="article:published_time" content={post.published_at} />}
      </Helmet>

      <article className="max-w-2xl mx-auto px-5 md:px-4 py-14 md:py-20">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Voltar ao blog
        </Link>

        {post.published_at && (
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-4">
            <Calendar size={11} />
            {formatDate(post.published_at)}
          </div>
        )}

        <h1 className="font-sans font-black text-stone-900 text-2xl md:text-3xl leading-tight mb-6">
          {post.title}
        </h1>

        {post.cover_image_url && (
          <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <p className="text-stone-500 text-base leading-relaxed mb-8 border-l-4 border-primary-200 pl-4 italic">
          {post.excerpt}
        </p>

        <div
          className="
            text-stone-700 text-[15px] leading-relaxed space-y-4
            [&_h2]:font-bold [&_h2]:text-stone-900 [&_h2]:text-xl [&_h2]:mt-6 [&_h2]:mb-2
            [&_h3]:font-semibold [&_h3]:text-stone-800 [&_h3]:text-base [&_h3]:mt-4 [&_h3]:mb-1
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
            [&_strong]:font-semibold [&_em]:italic
            [&_blockquote]:border-l-4 [&_blockquote]:border-primary-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-stone-500
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-12 pt-8 border-t border-stone-100 text-center">
          <p className="text-stone-500 text-sm mb-4">Gostou? Explore os nossos cheesecakes artesanais.</p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 active:scale-[0.97] text-white font-semibold px-6 py-3 rounded-full transition-all text-sm shadow-lg"
            style={{ boxShadow: '0 8px 24px #685D9440' }}
          >
            Ver o menu
          </Link>
        </div>
      </article>
    </>
  )
}
