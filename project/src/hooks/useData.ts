import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Banner, Category, Product, ProductWithRelations, StoreSettings, ProductReview, FitFeedback } from '@/types/database';

export function useStoreSettings() {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data as StoreSettings;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBanners(position = 'hero') {
  return useQuery({
    queryKey: ['banners', position],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('position', position)
        .eq('active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProducts(filters?: {
  categorySlug?: string;
  collectionSlug?: string;
  isNew?: boolean;
  isLaunch?: boolean;
  isOnSale?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase.from('products').select(`
          *,
          category:categories(*),
          collection:collections(*),
          product_variants(*),
          product_images(*)
        `).eq('published', true);

      if (filters?.categorySlug) {
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', filters.categorySlug).maybeSingle();
        if (cat) query = query.eq('category_id', cat.id);
      }
      if (filters?.collectionSlug) {
        const { data: col } = await supabase.from('collections').select('id').eq('slug', filters.collectionSlug).maybeSingle();
        if (col) query = query.eq('collection_id', col.id);
      }
      if (filters?.isNew) query = query.eq('is_new', true);
      if (filters?.isLaunch) query = query.eq('is_launch', true);
      if (filters?.isOnSale) query = query.eq('is_on_sale', true);
      if (filters?.isFeatured) query = query.eq('is_featured', true);
      if (filters?.isBestseller) query = query.eq('is_bestseller', true);
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters?.minPrice !== undefined) query = query.gte('price', filters.minPrice);
      if (filters?.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);

      switch (filters?.sort) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'bestsellers':
          query = query.order('is_bestseller', { ascending: false }).order('created_at', { ascending: false });
          break;
        default:
          query = query.order('sort_order', { ascending: true }).order('created_at', { ascending: false });
      }

      if (filters?.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductWithRelations[];
    },
    staleTime: 60 * 1000,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Slug required');
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*),
          collection:collections(*),
          product_variants(*),
          product_images(*)
        `)
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();
      if (error) throw error;
      return data as ProductWithRelations | null;
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  });
}

export function useRelatedProducts(productId: string | undefined, categorySlug?: string, limit = 4) {
  return useQuery({
    queryKey: ['related-products', productId, categorySlug],
    queryFn: async () => {
      if (!productId) return [];
      let query = supabase
        .from('products')
        .select('*, category:categories(*), product_variants(*), product_images(*)')
        .eq('published', true)
        .neq('id', productId)
        .limit(limit);
      if (categorySlug) {
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).maybeSingle();
        if (cat) query = query.eq('category_id', cat.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as ProductWithRelations[];
    },
    enabled: !!productId,
    staleTime: 60 * 1000,
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id, product_id,
          product:products(*, category:categories(*), product_variants(*), product_images(*))
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Array<{ id: string; product_id: string; product: ProductWithRelations }>;
    },
    staleTime: 30 * 1000,
  });
}

export async function toggleFavorite(productId: string, isFavorited: boolean): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error('Faça login para favoritar.');
  if (isFavorited) {
    await supabase.from('favorites').delete().eq('product_id', productId);
  } else {
    await supabase.from('favorites').insert({ product_id: productId });
  }
}

export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('product_reviews')
        .select('id, product_id, user_id, rating, fit_feedback, comment, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProductReview[];
    },
    enabled: !!productId,
    staleTime: 30 * 1000,
  });
}

export function useFitSummary(productId: string | undefined) {
  return useQuery({
    queryKey: ['fit-summary', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .rpc('get_fit_summary', { p_product_id: productId });
      if (error) throw error;
      return data as { runs_small: number; true_to_size: number; runs_large: number; total_reviews: number; avg_rating: number | null } | null;
    },
    enabled: !!productId,
    staleTime: 30 * 1000,
  });
}

export async function submitReview(
  productId: string,
  rating: number,
  fitFeedback: FitFeedback | null,
  comment: string | null,
): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error('Faça login para avaliar.');
  const { error } = await supabase.from('product_reviews').insert({
    product_id: productId,
    rating,
    fit_feedback: fitFeedback,
    comment: comment || null,
  });
  if (error) throw error;
}
