import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CustomerStore {
  phone: string | null
  token: string | null
  setSession: (payload: { phone: string; token: string }) => void
  setPhone: (phone: string) => void
  clearToken: () => void
  clearPhone: () => void
  clearSession: () => void
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set) => ({
      phone: null,
      token: null,
      setSession: ({ phone, token }) => set({ phone, token }),
      setPhone: (phone) => set({ phone }),
      clearToken: () => set({ token: null }),
      clearPhone: () => set({ phone: null }),
      clearSession: () => set({ phone: null, token: null }),
    }),
    { name: 'cheesemania-customer' },
  ),
)
