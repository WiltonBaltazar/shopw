import { create } from 'zustand'

export interface PreloadConfig {
  selectedValues: Record<number, number>
  flavourSelections: number[]
  addonValues: Record<number, string>
}

interface ProductPreloadStore {
  config: PreloadConfig | null
  set: (config: PreloadConfig) => void
  consume: () => PreloadConfig | null
}

export const useProductPreloadStore = create<ProductPreloadStore>((set, get) => ({
  config: null,
  set: (config) => set({ config }),
  consume: () => {
    const config = get().config
    set({ config: null })
    return config
  },
}))
