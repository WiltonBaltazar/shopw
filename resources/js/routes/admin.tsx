import { createFileRoute, Outlet, Link, useNavigate, redirect, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, ClipboardList, Package, LogOut, CakeSlice, Settings, Tag, Star, MapPin, Layers, CalendarX2, Ticket, MessageSquareQuote, BarChart2, BookOpen, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '~/store/auth'
import { adminLogout, getSettings } from '~/lib/adminApi'
import { cn } from '~/lib/utils'
import { OrderNotifier } from '~/components/admin/OrderNotifier'

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/admin/login') return
    const user = useAuthStore.getState().user
    if (!user) throw redirect({ to: '/admin/login' })
  },
  component: AdminShell,
})

function AdminShell() {
  const { location } = useRouterState()
  if (location.pathname === '/admin/login') return <Outlet />
  return <AdminLayout />
}

function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()
  const { data: settings } = useQuery({ queryKey: ['admin', 'settings'], queryFn: getSettings })
  const { location } = useRouterState()

  async function handleLogout() {
    await adminLogout().catch(() => {})
    setUser(null)
    navigate({ to: '/admin/login' })
  }

  const navGroups = [
    {
      label: 'Visão geral',
      items: [
        { to: '/admin/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { to: '/admin/reports', label: 'Relatórios', icon: BarChart2 },
        { to: '/admin/orders', label: 'Encomendas', icon: ClipboardList },
        { to: '/admin/reviews', label: 'Avaliações', icon: Star },
        { to: '/admin/testimonials', label: 'Testemunhos', icon: MessageSquareQuote },
        { to: '/admin/blog', label: 'Blog', icon: BookOpen },
      ],
    },
    {
      label: 'Catálogo',
      items: [
        { to: '/admin/products', label: 'Produtos', icon: Package },
        { to: '/admin/categories', label: 'Categorias', icon: Tag },
        { to: '/admin/attributes', label: 'Atributos', icon: Layers },
      ],
    },
    {
      label: 'Promoções',
      items: [
        { to: '/admin/coupons', label: 'Cupões', icon: Ticket },
      ],
    },
    {
      label: 'Configuração',
      items: [
        { to: '/admin/pages', label: 'Páginas', icon: FileText },
        { to: '/admin/delivery', label: 'Entrega', icon: MapPin },
        { to: '/admin/blocked-dates', label: 'Datas Bloqueadas', icon: CalendarX2 },
        { to: '/admin/settings', label: 'Definições', icon: Settings },
      ],
    },
  ]

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col shrink-0 bg-[#0c0a09] select-none">
        {/* Brand */}
        <div className="px-4 pt-6 pb-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/30">
            <CakeSlice size={15} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-white text-sm font-bold tracking-tight leading-none">{settings?.seo_site_name || 'Admin'}</p>
            <p className="text-stone-500 text-[10px] mt-0.5 font-medium uppercase tracking-widest">Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-widest px-3 mb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, exact }) => {
                  const active = exact
                    ? location.pathname === '/admin' || location.pathname === '/admin/'
                    : location.pathname.startsWith(to)
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all',
                        active
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-stone-500 hover:text-stone-200 hover:bg-white/5',
                      )}
                    >
                      <Icon size={15} strokeWidth={active ? 2.5 : 1.75} />
                      {label}
                      {active && <span className="ml-auto w-1 h-1 rounded-full bg-primary-400" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 pb-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-stone-700 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-stone-300">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-stone-300 text-xs font-medium truncate">{user?.name}</p>
              <p className="text-stone-600 text-[10px] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-stone-600 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut size={14} />
            Terminar sessão
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <OrderNotifier />
    </div>
  )
}
