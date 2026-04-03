import { Link } from '@tanstack/react-router'
import { Instagram } from 'lucide-react'
import { useSeoSettings } from '~/lib/hooks'

export function Footer() {
  const seo = useSeoSettings()
  const siteName = seo.seo_site_name || 'Cheesemania'
  const footerLogo = seo.footer_logo_url || seo.brand_logo_url

  return (
    <footer className="mt-20">
      <div className="bg-primary-500 text-white">
        <div className="max-w-6xl mx-auto px-5 md:px-6 py-12 md:py-20 grid grid-cols-1 md:grid-cols-[1.15fr_1fr_1fr] gap-10 md:gap-12">
          <div>
            <Link to="/" className="inline-flex items-center">
              {footerLogo ? (
                <img
                  src={footerLogo}
                  alt={siteName}
                  className="h-24 w-auto object-contain brightness-0 invert"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <span className="font-serif text-5xl leading-[0.86] font-bold tracking-tight">
                  Cheese.
                  <span className="block">mania</span>
                </span>
              )}
            </Link>
            <p className="mt-2 text-sm text-white/75">More cheese, more joy.</p>

            <div className="mt-8 flex items-center gap-4">
              <a
                href="https://instagram.com/cheesemaniaa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/35 hover:border-white hover:bg-white/10 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.tiktok.com/@cheesemaniaa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/35 hover:border-white hover:bg-white/10 transition-colors"
                aria-label="TikTok"
              >
                <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] fill-current" aria-hidden>
                  <path d="M14.74 3h2.41a4.78 4.78 0 0 0 3.36 3.37V8.8a7.15 7.15 0 0 1-3.34-.83v6.7a5.68 5.68 0 1 1-5.67-5.67c.35 0 .69.03 1.02.09v2.5a3.33 3.33 0 1 0 2.22 3.08V3Z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-2xl/none font-medium">Links úteis</h3>
            <div className="mt-3 h-px bg-white/35" />
            <nav className="mt-6 flex flex-col gap-3 text-[15px] font-medium uppercase tracking-wide">
              <Link to="/" className="hover:text-white/80 transition-colors">Página inicial</Link>
              <Link to="/blog" className="hover:text-white/80 transition-colors">Blog</Link>
              <Link to="/menu" className="hover:text-white/80 transition-colors">Loja</Link>
              <Link to="/minhas-encomendas" className="hover:text-white/80 transition-colors">Minha conta</Link>
              <Link to="/minhas-encomendas" className="hover:text-white/80 transition-colors">Monitorar pedido</Link>
            </nav>
          </div>

          <div>
            <h3 className="text-2xl/none font-medium">Políticas</h3>
            <div className="mt-3 h-px bg-white/35" />
            <nav className="mt-6 flex flex-col gap-3 text-[15px] font-medium uppercase tracking-wide">
              <Link to="/politica-de-privacidade" className="hover:text-white/80 transition-colors">
                Políticas de Privacidade
              </Link>
              <Link to="/termos-e-condicoes" className="hover:text-white/80 transition-colors">
                Termos e Condições
              </Link>
              <Link to="/politica-de-reembolso" className="hover:text-white/80 transition-colors">
                Política de Reembolso
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="bg-black px-4 py-4 text-center text-sm text-white/90">
        Copyright © {new Date().getFullYear()} {siteName}. Todos direitos reservados.
      </div>
    </footer>
  )
}
