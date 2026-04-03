import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { Category, Product, ProductListItem, Order, OrderSummary, CustomerFavorite, PaymentInfo } from './types'
import { useCustomerStore } from '~/store/customer'

export interface SeoSettings {
  seo_site_name: string
  seo_home_title: string
  seo_home_description: string
  seo_menu_title: string
  seo_menu_description: string
  seo_og_image: string | null
  favicon_url: string | null
  brand_logo_url: string | null
  hero_tagline: string | null
  hero_heading: string | null
  hero_subheading: string | null
  hero_cta_text: string | null
  hero_image_url: string | null
  whatsapp_number: string | null
  pay_on_delivery_enabled: boolean
  theme_primary_color?: string | null
}

const SEO_DEFAULTS: SeoSettings = {
  seo_site_name: 'Cheesemania',
  seo_home_title: 'Cheesemania — Cheesecakes Artesanais em Maputo',
  seo_home_description: 'Cheesecakes artesanais feitos com amor em Maputo, Moçambique. Encomende online e receba na sua porta. Opções sem lactose e fitness disponíveis.',
  seo_menu_title: 'Menu de Cheesecakes — Cheesemania Maputo',
  seo_menu_description: 'Explore o nosso menu de cheesecakes artesanais em Maputo. Sem lactose, fitness e sabores clássicos. Entrega ao domicílio em Maputo e Matola.',
  seo_og_image: null,
  favicon_url: null,
  brand_logo_url: null,
  hero_tagline: 'Artesanal · Maputo',
  hero_heading: 'More Cheese,\nMore Joy',
  hero_subheading: 'Cheesecakes artesanais feitos com amor, prontos para a sua celebração especial.',
  hero_cta_text: 'Ver o Menu',
  hero_image_url: null,
  whatsapp_number: null,
  pay_on_delivery_enabled: false,
}

export function useThemeColor(): string | null {
  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.get<{ data: SeoSettings }>('/settings').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  return data?.theme_primary_color ?? null
}

export function useSeoSettings(): SeoSettings {
  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.get<{ data: SeoSettings }>('/settings').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  return { ...SEO_DEFAULTS, ...data }
}

export function useBlockedDates(): string[] {
  const { data } = useQuery({
    queryKey: ['blocked-dates'],
    queryFn: () => api.get<{ data: string[] }>('/blocked-dates').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  return data ?? []
}

export function useBlockedWeekdays(): number[] {
  const { data } = useQuery({
    queryKey: ['blocked-weekdays'],
    queryFn: () => api.get<{ data: number[] }>('/blocked-weekdays').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  return data ?? []
}

export function useDeliveryHours(): { start: number; end: number } {
  const { data } = useQuery({
    queryKey: ['delivery-hours'],
    queryFn: () =>
      api.get<{ data: { start: number; end: number } }>('/delivery-hours').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })
  return data ?? { start: 10, end: 19 }
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories')
      return data.data
    },
  })
}

export function useProducts(categorySlug?: string) {
  return useQuery<ProductListItem[]>({
    queryKey: ['products', categorySlug ?? 'all'],
    queryFn: async () => {
      const params = categorySlug ? { category: categorySlug } : {}
      const { data } = await api.get('/products', { params })
      return data.data
    },
  })
}

export function useProduct(slug: string) {
  return useQuery<Product>({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await api.get(`/products/${slug}`)
      return data.data
    },
    enabled: !!slug,
  })
}

export function useOrder(reference: string) {
  return useQuery<Order>({
    queryKey: ['order', reference],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${reference}`)
      return data.data
    },
    enabled: !!reference,
  })
}

export function useMyOrders(phone: string | null) {
  const token = useCustomerStore((s) => s.token)
  return useQuery<OrderSummary[]>({
    queryKey: ['my-orders', phone ?? 'session'],
    queryFn: async () => {
      const payload = phone ? { phone } : {}
      const { data } = await api.post('/my-orders', payload)
      return data.data
    },
    enabled: !!phone || !!token,
    staleTime: 30_000,
  })
}

export function useEventProducts() {
  return useQuery<ProductListItem[]>({
    queryKey: ['event-products'],
    queryFn: async () => {
      const { data } = await api.get('/event-products')
      return data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function usePaymentInfo(reference: string, token?: string) {
  return useQuery<PaymentInfo>({
    queryKey: ['payment-info', reference, token],
    queryFn: async () => {
      const params = token ? { token } : {}
      const { data } = await api.get(`/orders/${reference}/payment-info`, { params })
      return data.data
    },
    enabled: !!reference,
    refetchInterval: (query) => {
      const status = query.state.data?.payment_status
      return status === 'pending' || status === 'unpaid' ? 3000 : false
    },
  })
}

export interface Testimonial {
  id: number
  author_name: string
  author_detail: string | null
  quote: string
  rating: number
}

export function useTestimonials() {
  return useQuery<Testimonial[]>({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data } = await api.get('/testimonials')
      return data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useMyFavorites(phone: string | null) {
  const token = useCustomerStore((s) => s.token)
  return useQuery<CustomerFavorite[]>({
    queryKey: ['my-favorites', phone ?? 'session'],
    queryFn: async () => {
      const payload = phone ? { phone } : {}
      const { data } = await api.post('/my-favorites/list', payload)
      return data.data
    },
    enabled: !!phone || !!token,
    staleTime: 60_000,
  })
}

export interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_url: string | null
  is_sticky: boolean
  published_at: string | null
}

export function useBlogPosts() {
  return useQuery<BlogPost[]>({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data } = await api.get('/blog-posts')
      return data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useBlogPost(slug: string) {
  return useQuery<BlogPost>({
    queryKey: ['blog-posts', slug],
    queryFn: async () => {
      const { data } = await api.get(`/blog-posts/${slug}`)
      return data.data
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}
