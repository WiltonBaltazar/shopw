import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CakeSlice, Loader2 } from 'lucide-react'
import { useAuthStore } from '~/store/auth'
import { adminLogin } from '~/lib/adminApi'

export const Route = createFileRoute('/admin/login')({
  component: LoginPage,
})

function LoginPage() {
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await adminLogin(email, password)
      setUser(res.data.user)
      navigate({ to: '/admin' })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Erro ao entrar. Tente novamente.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center px-4">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/25">
            <CakeSlice size={22} className="text-white" />
          </div>
          <h1 className="font-serif text-2xl text-white tracking-tight">Cheesemania</h1>
          <p className="text-stone-500 text-sm mt-1">Painel de administração</p>
        </div>

        {/* Card */}
        <div className="bg-stone-900 rounded-2xl border border-white/8 p-7 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-stone-400 font-medium mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="admin@cheesemania.com"
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-400 font-medium mb-1.5 uppercase tracking-wider">
                Palavra-passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 text-white font-medium text-sm py-2.5 rounded-xl transition-colors mt-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
