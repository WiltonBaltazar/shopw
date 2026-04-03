import { Link } from '@tanstack/react-router'
import { useSeoSettings } from '~/lib/hooks'

export function Footer() {

     const seo = useSeoSettings()
    const whatsapp = seo.whatsapp_number
  return (
    <footer className="bg-stone-900 text-stone-400 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="font-serif font-semibold text-white text-lg mb-2">Cheesemania</p>
          <p className="text-sm leading-relaxed">
            Cheesecakes artesanais feitos com amor em Maputo, Moçambique.
          </p>
        </div>

        <div>
          <p className="text-white text-sm font-medium mb-3">Navegação</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-white transition-colors">Início</Link></li>
            <li><Link to="/menu" className="hover:text-white transition-colors">Menu</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-white text-sm font-medium mb-3">Contacto</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                 href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/cheesemaniaa"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-stone-800 px-4 py-4 text-center text-xs text-stone-600">
        &copy; {new Date().getFullYear()} Cheesemania. Todos os direitos reservados.
      </div>
    </footer>
  )
}
