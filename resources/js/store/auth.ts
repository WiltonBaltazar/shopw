import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
  id: number
  name: string
  email: string
}

interface AuthStore {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    { name: 'cheesemania-admin-auth' },
  ),
)
