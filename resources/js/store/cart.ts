import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: number
  productName: string
  productSlug: string
  productImage: string
  deliveryWeekday?: number | null
  variantId: number
  variantLabel: string
  attributes: Record<string, string>
  addons: Array<{ id: number; name: string; value: string; price: number }>
  customNotes: string
  price: number
  quantity: number
}

interface CartStore {
  items: CartItem[]
  lastAdded: CartItem | null
  addItem: (item: CartItem) => void
  removeItem: (variantId: number) => void
  updateQuantity: (variantId: number, quantity: number) => void
  clearCart: () => void
  clearLastAdded: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      lastAdded: null,

      addItem: (item) => {
        const existing = get().items.find((i) => i.variantId === item.variantId)
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.variantId === item.variantId
                ? {
                    ...i,
                    quantity: i.quantity + item.quantity,
                    deliveryWeekday: i.deliveryWeekday ?? item.deliveryWeekday ?? null,
                  }
                : i,
            ),
            lastAdded: item,
          }))
        } else {
          set((state) => ({ items: [...state.items, item], lastAdded: item }))
        }
      },

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          ),
        })),

      clearCart: () => set({ items: [] }),
      clearLastAdded: () => set({ lastAdded: null }),

      total: () =>
        get().items.reduce(
          (sum, item) =>
            sum +
            (item.price +
              item.addons.reduce((a, addon) => a + addon.price, 0)) *
              item.quantity,
          0,
        ),

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'cheesemania-cart',
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
