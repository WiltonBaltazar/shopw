export interface Category {
  id: number
  name: string
  slug: string
  sort_order: number
}

export interface ProductImage {
  id: number
  url: string
  alt: string
  is_primary: boolean
}

export interface AttributeValue {
  id: number
  value: string
  sort_order: number
}

export interface ProductAttribute {
  id: number
  name: string
  sort_order: number
  values: AttributeValue[]
}

export interface ProductVariant {
  id: number
  price: number
  is_available: boolean
  attribute_value_ids: number[]
}

export interface ProductAddon {
  id: number
  name: string
  price: number
  type: 'checkbox' | 'text' | 'select'
  placeholder: string | null
  options: string[] | null
  is_required: boolean
  sort_order: number
}

export interface OptionRule {
  id: number
  condition_value_id: number
  target_value_id: number
  rule_type: 'disable' | 'hide'
}

export interface ProductReview {
  id: number
  customer_name: string
  rating: number
  body: string | null
  photo_url: string | null
  verified_purchase: boolean
  created_at: string
}

export interface ProductListItem {
  id: number
  name: string
  slug: string
  product_type: 'simple' | 'variable'
  delivery_weekday: number | null
  price_range: { min: number; max: number }
  default_variant_id: number | null
  is_non_lactose: boolean
  is_fitness: boolean
  is_event: boolean
  primary_image: { url: string; alt: string } | null
  secondary_image: { url: string; alt: string } | null
  category: Category
}

export interface Product {
  id: number
  name: string
  slug: string
  product_type: 'simple' | 'variable'
  delivery_weekday: number | null
  description: string
  seo_title: string | null
  seo_description: string | null
  requires_advance_order: boolean
  is_active: boolean
  is_non_lactose: boolean
  is_fitness: boolean
  is_event: boolean
  sort_order: number
  price_range: { min: number; max: number }
  primary_image?: { url: string; alt: string } | null
  category: Category
  images: ProductImage[]
  attributes: ProductAttribute[]
  variants: ProductVariant[]
  addons: ProductAddon[]
  option_rules: OptionRule[]
  reviews_count: number
  average_rating: number | null
  reviews?: ProductReview[]
}

export interface OrderAddon {
  addon_id: number
  addon_name: string
  value: string
  price: number
}

export interface OrderItem {
  product_name: string
  variant_id: number
  variant_label?: string
  quantity: number
  unit_price: number
  subtotal: number
  custom_notes: string
  addons: OrderAddon[]
}

export interface CustomerFavorite {
  id: number
  product_id: number
  product_slug: string
  product_name: string
  product_image: string | null
  variant_id: number
  variant_label: string | null
  price: number
  selected_values: Record<number, number>
  flavour_selections: number[]
  addon_values: Record<number, string>
  created_at: string
}

export interface OrderSummary {
  reference: string
  customer_name: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
  total: number
  delivery_date: string | null
  delivery_type: 'delivery' | 'pickup' | null
  created_at: string
}

export interface Order {
  reference: string
  order_type: 'standard' | 'event'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method: string
  coupon_code?: string | null
  discount_amount?: number
  total: number
  amount_paid: number
  payment_due: number | null
  created_at: string
  customer_name?: string
  customer_phone?: string
  customer_address?: string
  delivery_date?: string
  delivery_type?: 'delivery' | 'pickup'
  delivery_region?: { id: number; name: string } | null
  delivery_fee?: number
  items?: OrderItem[]
}

export interface PaymentInfo {
  reference: string
  customer_name: string
  order_type: 'standard' | 'event'
  total: number
  amount_paid: number
  payment_due: number | null
  payment_status: string
}
