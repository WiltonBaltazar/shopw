import { api } from './api'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DashboardStats {
  orders_today: number
  revenue_today: number
  orders_pending: number
  orders_total: number
  revenue_total: number
  products_active: number
  recent_orders: {
    reference: string
    customer_name: string
    total: number
    status: string
    payment_status: string
    created_at: string
  }[]
}

export interface OrderListItem {
  id: number
  reference: string
  customer_name: string
  customer_phone: string
  status: string
  payment_status: string
  total: number
  items_count: number
  created_at: string
}

export interface OrderDetail {
  id: number
  reference: string
  order_type: 'standard' | 'event'
  customer_name: string
  customer_phone: string
  customer_address: string
  status: string
  payment_status: string
  payment_method: string
  total: number
  amount_paid: number
  payment_due: number | null
  mpesa_status: string | null
  notes: string | null
  admin_notes: string | null
  delivery_date: string | null
  delivery_type: 'delivery' | 'pickup'
  delivery_region: { id: number; name: string } | null
  delivery_fee: number
  created_at: string
  items: {
    id: number
    product_name: string
    variant_id: number
    quantity: number
    unit_price: number
    subtotal: number
    custom_notes: string | null
    addons: { name: string; value: string; price: number }[]
  }[]
}

export interface AdminProduct {
  id: number
  name: string
  slug: string
  is_active?: boolean
  price_range: { min: number; max: number }
  images: { id: number; url: string; alt: string; is_primary: boolean }[]
  variants: { id: number; price: number; is_available: boolean }[]
  category: { id: number; name: string; slug: string }
}

export interface AdminProductFull extends AdminProduct {
  attributes: {
    id: number
    name: string
    sort_order: number
    values: { id: number; value: string; sort_order: number }[]
  }[]
  addons: {
    id: number
    name: string
    price: number
    type: string
    placeholder: string | null
    options: string[] | null
    is_required: boolean
    sort_order: number
  }[]
  variants: { id: number; price: number; is_available: boolean; attribute_value_ids: number[] }[]
}

export interface CalendarOrder {
  id: number
  reference: string
  customer_name: string
  customer_phone: string
  status: string
  payment_status: string
  total: number
  delivery_date: string | null
  created_at: string
  date: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const adminLogin = (email: string, password: string) =>
  api.post<{ user: { id: number; name: string; email: string } }>('/admin/login', { email, password })

export const adminLogout = () => api.post('/admin/logout')

export const adminMe = () =>
  api.get<{ user: { id: number; name: string; email: string } }>('/admin/me')

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboard = () =>
  api.get<DashboardStats>('/admin/dashboard').then((r) => r.data)

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface OrdersParams {
  page?: number
  per_page?: number
  status?: string
  payment_status?: string
  search?: string
}

export const getOrders = (params: OrdersParams = {}) =>
  api
    .get<{
      data: OrderListItem[]
      meta: { current_page: number; last_page: number; total: number }
    }>('/admin/orders', { params })
    .then((r) => r.data)

export const getOrder = (id: string) =>
  api.get<OrderDetail>(`/admin/orders/${id}`).then((r) => r.data)

export const updateOrderStatus = (id: number, status: string) =>
  api.patch(`/admin/orders/${id}/status`, { status }).then((r) => r.data)

export const updateOrderNotes = (id: number, admin_notes: string | null) =>
  api.patch(`/admin/orders/${id}/notes`, { admin_notes }).then((r) => r.data)

export const setPaymentDue = (id: number, payment_due: number) =>
  api.patch(`/admin/orders/${id}/payment-due`, { payment_due }).then((r) => r.data)

export const resetPayment = (id: number) =>
  api.post(`/admin/orders/${id}/reset-payment`).then((r) => r.data)

export const markOrderPaidManual = (id: number) =>
  api.post(`/admin/orders/${id}/mark-paid-manual`).then((r) => r.data)

export const getLatestOrderId = () =>
  api.get<{ id: number }>('/admin/orders/latest-id').then((r) => r.data.id)

export const bulkUpdateOrderStatus = (ids: number[], status: string) =>
  api.patch('/admin/orders/bulk-status', { ids, status }).then((r) => r.data)

export const exportOrdersCsv = async (from: string, to: string) => {
  const response = await api.get('/admin/orders/export', {
    params: { from, to },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data)
  const a = document.createElement('a')
  a.href = url
  a.download = `encomendas-${from}-${to}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export const getCalendarOrders = (year: number, month: number) =>
  api.get<{ data: CalendarOrder[] }>('/admin/orders/calendar', { params: { year, month } }).then((r) => r.data.data)

// ─── Products ────────────────────────────────────────────────────────────────

export const getAdminProducts = () =>
  api.get<AdminProduct[]>('/admin/products').then((r) => r.data)

export const getAdminProduct = (id: string) =>
  api.get<AdminProductFull>(`/admin/products/${id}`).then((r) => r.data)

export const createProduct = (data: object) =>
  api.post<AdminProduct>('/admin/products', data).then((r) => r.data)

export const updateProduct = (id: number, data: Partial<{
  name: string; slug: string; description: string
  seo_title: string | null; seo_description: string | null
  category_id: number; requires_advance_order: boolean
  is_active: boolean; is_non_lactose: boolean; is_fitness: boolean; is_event: boolean; sort_order: number
}>) => api.put(`/admin/products/${id}`, data).then((r) => r.data)

export const deleteProduct = (id: number) =>
  api.delete(`/admin/products/${id}`).then((r) => r.data)

export const convertProductType = (id: number, data: { product_type: 'simple' | 'variable'; base_price?: number }) =>
  api.post(`/admin/products/${id}/convert-type`, data).then((r) => r.data)

// Variants
export const generateVariants = (productId: number, defaultPrice: number = 0) =>
  api.post(`/admin/products/${productId}/variants/generate`, { default_price: defaultPrice }).then((r) => r.data)

export const bulkUpdateVariants = (productId: number, variants: { id: number; price?: number; is_available?: boolean }[]) =>
  api.patch(`/admin/products/${productId}/variants/bulk`, { variants }).then((r) => r.data)

export const storeVariant = (productId: number, data: { price: number; is_available: boolean; attribute_value_ids: number[] }) =>
  api.post(`/admin/products/${productId}/variants`, data).then((r) => r.data)

export const updateVariant = (productId: number, variantId: number, data: { price?: number; is_available?: boolean }) =>
  api.patch(`/admin/products/${productId}/variants/${variantId}`, data).then((r) => r.data)

export const deleteVariant = (productId: number, variantId: number) =>
  api.delete(`/admin/products/${productId}/variants/${variantId}`).then((r) => r.data)

// Attributes
export const storeAttribute = (productId: number, data: { name: string; values: string[] }) =>
  api.post(`/admin/products/${productId}/attributes`, data).then((r) => r.data)

export const storeAttributeValue = (productId: number, attrId: number, value: string) =>
  api.post(`/admin/products/${productId}/attributes/${attrId}/values`, { value }).then((r) => r.data)

export const deleteAttributeValue = (productId: number, attrId: number, valueId: number) =>
  api.delete(`/admin/products/${productId}/attributes/${attrId}/values/${valueId}`).then((r) => r.data)

// Addons
export const storeAddon = (productId: number, data: {
  name: string; price: number; type?: string;
  placeholder?: string; options?: string[]; is_required?: boolean
}) => api.post(`/admin/products/${productId}/addons`, data).then((r) => r.data)

export const updateAddon = (productId: number, addonId: number, data: Partial<{
  name: string; price: number; type: string;
  placeholder: string; options: string[]; is_required: boolean
}>) => api.patch(`/admin/products/${productId}/addons/${addonId}`, data).then((r) => r.data)

export const deleteAddon = (productId: number, addonId: number) =>
  api.delete(`/admin/products/${productId}/addons/${addonId}`).then((r) => r.data)

export const getCategories = () =>
  api.get<{ data: { id: number; name: string; slug: string }[] }>('/categories').then((r) => r.data.data)

export const getAttributeSuggestions = () =>
  api.get<AdminProduct[]>('/admin/products').then((r) => {
    const names = new Set<string>()
    r.data.forEach((p: any) => (p.attributes ?? []).forEach((a: any) => names.add(a.name)))
    return Array.from(names).sort()
  })


export interface AppSettings {
  whatsapp_number: string
  pay_on_delivery_enabled: boolean
  seo_site_name: string
  seo_home_title: string
  seo_home_description: string
  seo_menu_title: string
  seo_menu_description: string
  seo_og_image: string | null
  favicon_url: string | null
  brand_logo_url: string | null
  footer_logo_url: string | null
  hero_tagline: string | null
  hero_heading: string | null
  hero_subheading: string | null
  hero_cta_text: string | null
  hero_image_url: string | null
  theme_primary_color: string | null
  blocked_weekdays: string | null
  delivery_start_hour: string | null
  delivery_end_hour: string | null
}

export interface BlockedDate {
  id: number
  date: string
  reason: string | null
}

export const getBlockedDates = () =>
  api.get<{ data: BlockedDate[] }>('/admin/blocked-dates').then((r) => r.data.data)

export const createBlockedDates = (dates: string[], reason?: string) =>
  api.post<{ data: BlockedDate[] }>('/admin/blocked-dates', { dates, reason }).then((r) => r.data.data)

export const deleteBlockedDate = (id: number) =>
  api.delete(`/admin/blocked-dates/${id}`)

// ─── Dashboard chart ──────────────────────────────────────────────────────────

export interface ChartDay {
  day: string
  revenue: number
  orders: number
}

export const getRevenueChart = () =>
  api.get<{ data: ChartDay[] }>('/admin/dashboard/revenue-chart').then((r) => r.data.data)

// ─── Categories ───────────────────────────────────────────────────────────────

export interface AdminCategory {
  id: number
  name: string
  slug: string
  sort_order: number
  products_count: number
}

export const getAdminCategories = () =>
  api.get<{ data: AdminCategory[] }>('/admin/categories').then((r) => r.data.data)

export const createCategory = (name: string) =>
  api.post<{ id: number; name: string; slug: string }>('/admin/categories', { name }).then((r) => r.data)

export const updateCategory = (id: number, name: string) =>
  api.patch(`/admin/categories/${id}`, { name }).then((r) => r.data)

export const deleteCategory = (id: number) =>
  api.delete(`/admin/categories/${id}`).then((r) => r.data)

export const reorderCategories = (items: { id: number; sort_order: number }[]) =>
  api.patch('/admin/categories/reorder', { items }).then((r) => r.data)

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface AdminReview {
  id: number
  product_id: number
  customer_name: string
  customer_email: string | null
  rating: number
  body: string | null
  is_approved: boolean
  created_at: string
  product: { id: number; name: string; slug: string } | null
}

export const getReviews = (params: { is_approved?: string; page?: number } = {}) =>
  api
    .get<{ data: AdminReview[]; meta: { current_page: number; last_page: number; total: number } }>('/admin/reviews', { params })
    .then((r) => r.data)

export const updateReview = (id: number, is_approved: boolean) =>
  api.patch(`/admin/reviews/${id}`, { is_approved }).then((r) => r.data)

// ─── Manual order creation ────────────────────────────────────────────────────

export interface CreateAdminOrderPayload {
  customer_name: string
  customer_phone: string
  customer_address?: string
  notes?: string
  delivery_date?: string
  payment_status?: 'paid' | 'unpaid'
  items: {
    product_id: number
    variant_id: number
    quantity: number
    custom_notes?: string
    addons?: { addon_id: number; value?: string }[]
  }[]
}

export const createAdminOrder = (data: CreateAdminOrderPayload) =>
  api.post<OrderDetail>('/admin/orders', data).then((r) => r.data)

export const getSettings = () =>
  api.get<{ data: AppSettings }>('/admin/settings').then((r) => r.data.data)

export const updateSettings = (data: Partial<AppSettings>) =>
  api.patch<{ data: AppSettings }>('/admin/settings', data).then((r) => r.data.data)

const multipartHeaders = { 'Content-Type': null as unknown as string }

export const uploadSettingImage = (key: 'brand_logo_url' | 'footer_logo_url' | 'seo_og_image' | 'hero_image_url' | 'favicon_url', file: File) => {
  const form = new FormData()
  form.append('image', file)
  form.append('key', key)
  return api.post<{ url: string }>('/admin/settings/upload-image', form, { headers: multipartHeaders }).then((r) => r.data.url)
}

export const uploadProductImages = (productId: number, files: File[]) => {
  const form = new FormData()
  files.forEach((f) => form.append('images[]', f))
  return api.post<{ images: { id: number; url: string }[] }>(`/admin/products/${productId}/images`, form, { headers: multipartHeaders })
    .then((r) => r.data.images)
}

export const deleteProductImage = (productId: number, imageId: number) =>
  api.delete(`/admin/products/${productId}/images/${imageId}`)

export const reorderProductImages = (productId: number, order: number[]) =>
  api.patch(`/admin/products/${productId}/images/reorder`, { order })

// ─── Delivery Regions ─────────────────────────────────────────────────────────

export interface DeliveryRegion {
  id: number
  name: string
  price: number
  is_active: boolean
  sort_order: number
}

export const getAdminDeliveryRegions = () =>
  api.get<{ data: DeliveryRegion[] }>('/admin/delivery-regions').then((r) => r.data.data)

export const createDeliveryRegion = (data: { name: string; price: number; is_active?: boolean }) =>
  api.post<{ data: DeliveryRegion }>('/admin/delivery-regions', data).then((r) => r.data.data)

export const updateDeliveryRegion = (id: number, data: Partial<{ name: string; price: number; is_active: boolean; sort_order: number }>) =>
  api.patch<{ data: DeliveryRegion }>(`/admin/delivery-regions/${id}`, data).then((r) => r.data.data)

export const deleteDeliveryRegion = (id: number) =>
  api.delete(`/admin/delivery-regions/${id}`).then((r) => r.data)

// ─── Global Attribute Library ─────────────────────────────────────────────────

export interface GlobalAttributeValue {
  id: number
  value: string
  sort_order: number
}

export interface GlobalAttribute {
  id: number
  name: string
  sort_order: number
  values: GlobalAttributeValue[]
}

export const getGlobalAttributes = () =>
  api.get<{ data: GlobalAttribute[] }>('/admin/attributes').then((r) => r.data.data)

export const createGlobalAttribute = (data: { name: string; values?: string[] }) =>
  api.post<{ data: GlobalAttribute }>('/admin/attributes', data).then((r) => r.data.data)

export const updateGlobalAttribute = (id: number, name: string) =>
  api.patch(`/admin/attributes/${id}`, { name }).then((r) => r.data)

export const deleteGlobalAttribute = (id: number) =>
  api.delete(`/admin/attributes/${id}`).then((r) => r.data)

export const createGlobalAttributeValue = (attrId: number, value: string) =>
  api.post<{ data: GlobalAttributeValue }>(`/admin/attributes/${attrId}/values`, { value }).then((r) => r.data.data)

export const deleteGlobalAttributeValue = (attrId: number, valueId: number) =>
  api.delete(`/admin/attributes/${attrId}/values/${valueId}`).then((r) => r.data)

// ─── Testimonials ─────────────────────────────────────────────────────────────

export interface AdminTestimonial {
  id: number
  author_name: string
  author_detail: string | null
  quote: string
  rating: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export const getAdminTestimonials = () =>
  api.get<{ data: AdminTestimonial[] }>('/admin/testimonials').then((r) => r.data.data)

export const createTestimonial = (data: {
  author_name: string
  author_detail?: string | null
  quote: string
  rating?: number
  is_active?: boolean
  sort_order?: number
}) => api.post<{ data: AdminTestimonial }>('/admin/testimonials', data).then((r) => r.data.data)

export const updateTestimonial = (id: number, data: Partial<{
  author_name: string
  author_detail: string | null
  quote: string
  rating: number
  is_active: boolean
  sort_order: number
}>) => api.patch<{ data: AdminTestimonial }>(`/admin/testimonials/${id}`, data).then((r) => r.data.data)

export const deleteTestimonial = (id: number) =>
  api.delete(`/admin/testimonials/${id}`).then((r) => r.data)

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface ReportKpis {
  revenue: number
  orders: number
  avg_order_value: number
  completed_pct: number
  pending_pct: number
  delivery_count: number
  pickup_count: number
}

export interface ReportComparison {
  revenue_change_pct: number
  orders_change_pct: number
  avg_order_change_pct: number
  prev_revenue: number
  prev_orders: number
}

export interface ReportData {
  period: { start: string; end: string }
  kpis: ReportKpis
  comparison: ReportComparison
  revenue_over_time: { day: string; revenue: number; orders: number }[]
  orders_by_status: { status: string; count: number }[]
  top_products: { product_name: string; quantity: number; revenue: number }[]
  delivery_split: { type: string; count: number }[]
}

export const getReport = (start: string, end: string) =>
  api.get<ReportData>('/admin/reports', { params: { start_date: start, end_date: end } }).then((r) => r.data)

export const exportReportXlsx = async (start: string, end: string) => {
  const response = await api.get('/admin/reports/export', {
    params: { start_date: start, end_date: end },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-${start}-${end}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Pages ───────────────────────────────────────────────────────────────────

export interface AdminPage {
  id: number
  title: string
  slug: string
  content: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export const getAdminPages = () =>
  api.get<{ data: AdminPage[] }>('/admin/pages').then((r) => r.data.data)

export const updateAdminPage = (id: number, data: Partial<{
  title: string
  slug: string
  content: string | null
  is_published: boolean
}>) => api.patch<{ data: AdminPage }>(`/admin/pages/${id}`, data).then((r) => r.data.data)

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export interface AdminBlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_url: string | null
  is_published: boolean
  is_sticky: boolean
  published_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export const getAdminBlogPosts = () =>
  api.get<{ data: AdminBlogPost[] }>('/admin/blog-posts').then((r) => r.data.data)

export const createBlogPost = (formData: FormData) =>
  api.post<{ data: AdminBlogPost }>('/admin/blog-posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data.data)

export const updateBlogPost = (id: number, formData: FormData) =>
  api.post<{ data: AdminBlogPost }>(`/admin/blog-posts/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data.data)

export const deleteBlogPost = (id: number) =>
  api.delete(`/admin/blog-posts/${id}`)
