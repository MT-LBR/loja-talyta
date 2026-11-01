export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  sku: string | null;
  brand: string | null;
  category_id: string | null;
  collection_id: string | null;
  price: number;
  sale_price: number | null;
  weight_g: number;
  height_cm: number;
  width_cm: number;
  length_cm: number;
  fabric_composition: string | null;
  care_instructions: string | null;
  fit: string | null;
  measurements: string | null;
  published: boolean;
  is_new: boolean;
  is_launch: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_on_sale: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  collection?: Collection | null;
  product_variants?: ProductVariant[];
  product_images?: ProductImage[];
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  stock: number;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  color: string | null;
  display_order: number;
  created_at: string;
};

export type ProductWithRelations = Product & {
  product_variants: ProductVariant[];
  product_images: ProductImage[];
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  cta_link: string | null;
  image_url: string;
  position: string;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type StoreSettings = {
  id: string;
  store_name: string;
  tagline: string | null;
  announcement_text: string | null;
  announcement_active: boolean;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_district: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  cnpj: string | null;
  business_hours: string | null;
  origin_zip: string | null;
  free_shipping_threshold: number | null;
  default_shipping_price: number | null;
  meta_pixel_id: string | null;
  google_analytics_id: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cta: string | null;
  hero_image: string | null;
  about_text: string | null;
  created_at: string;
  updated_at: string;
};

export type Address = {
  id: string;
  user_id: string;
  label: string | null;
  recipient_name: string;
  zip: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  reference: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type Cart = {
  id: string;
  user_id: string | null;
  cart_token: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price: number;
  created_at: string;
  product?: Product;
};

export type Order = {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping_price: number;
  total: number;
  coupon_code: string | null;
  recipient_name: string;
  zip: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  reference: string | null;
  payment_method: string | null;
  payment_status: string;
  tracking_code: string | null;
  shipping_method: string | null;
  estimated_days: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'preparing'
  | 'awaiting_pickup'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  variant_id: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price: number;
  created_at: string;
};

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number | null;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  max_uses_per_customer: number;
  used_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
};

export type Newsletter = {
  id: string;
  email: string;
  consent: boolean;
  created_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};

export type Payment = {
  id: string;
  order_id: string;
  gateway: string | null;
  gateway_payment_id: string | null;
  method: string | null;
  status: string;
  amount: number;
  raw_payload: unknown;
  created_at: string;
  updated_at: string;
};

export type Shipment = {
  id: string;
  order_id: string;
  carrier: string | null;
  tracking_code: string | null;
  method: string | null;
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

export type OrderStatusHistory = {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type FitFeedback = 'runs_small' | 'true_to_size' | 'runs_large';

export type ProductReview = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  fit_feedback: FitFeedback | null;
  comment: string | null;
  created_at: string;
};

export type FitSummary = {
  runs_small: number;
  true_to_size: number;
  runs_large: number;
  total_reviews: number;
  avg_rating: number | null;
};
