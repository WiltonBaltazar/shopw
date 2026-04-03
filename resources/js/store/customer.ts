import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CustomerStore {
  phone: string | null
  setPhone: (phone: string) => void
  clearPhone: () => void
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set) => ({
      phone: null,
      setPhone: (phone) => set({ phone }),
      clearPhone: () => set({ phone: null }),
    }),
    { name: 'cheesemania-customer' },
  ),
)
