import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getCartToken } from '@/lib/utils';
import { useAuth } from './AuthContext';
import type { CartItem, Product } from '@/types/database';

export type CartLine = {
  id: string;
  product_id: string;
  variant_id: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  unit_price: number;
  product: Product | null;
};

type CartContextValue = {
  items: CartLine[];
  count: number;
  subtotal: number;
  loading: boolean;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
  addItem: (product: Product, variantId: string | null, size: string | null, color: string | null, quantity?: number) => Promise<void>;
  updateQty: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);
  const previousUserId = useRef<string | null>(null);

  const ensureCart = useCallback(async (): Promise<string | null> => {
    const token = getCartToken();
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_cart_id', {
      p_user_id: user?.id ?? null,
      p_cart_token: user?.id ? null : token,
    });
    if (rpcError) {
      console.error('ensureCart', rpcError);
      return null;
    }
    setCartId(rpcData as string);
    return rpcData as string;
  }, [user]);

  const refresh = useCallback(async () => {
    const cId = await ensureCart();
    if (!cId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('cart_items')
      .select('id, product_id, variant_id, size, color, quantity, unit_price, product:products(*)')
      .eq('cart_id', cId);
    if (error) {
      console.error('refresh cart', error);
    }
    const lines: CartLine[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      product_id: row.product_id as string,
      variant_id: row.variant_id as string | null,
      size: row.size as string | null,
      color: row.color as string | null,
      quantity: row.quantity as number,
      unit_price: row.unit_price as number,
      product: row.product as Product | null,
    }));
    setItems(lines);
    setLoading(false);
  }, [ensureCart]);

  // Migrate guest cart to user cart on login
  useEffect(() => {
    const prevId = previousUserId.current;
    previousUserId.current = user?.id ?? null;
    if (user && prevId === null) {
      (async () => {
        const token = getCartToken();
        // Check if guest cart has items
        const { data: guestCart } = await supabase.rpc('get_cart_id', {
          p_user_id: null,
          p_cart_token: token,
        });
        if (guestCart) {
          const { data: guestItems } = await supabase
            .from('cart_items')
            .select('*')
            .eq('cart_id', guestCart as string);
          if (guestItems && guestItems.length > 0) {
            // Assign guest cart to the user
            await supabase.from('carts').update({ user_id: user.id, cart_token: null }).eq('id', guestCart as string);
          }
        }
        await refresh();
      })();
    } else {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addItem = useCallback(
    async (product: Product, variantId: string | null, size: string | null, color: string | null, quantity = 1) => {
      const cId = await ensureCart();
      if (!cId) throw new Error('Não foi possível acessar o carrinho.');
      const unitPrice = product.sale_price && product.sale_price < product.price ? product.sale_price : product.price;

      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cId)
        .eq('product_id', product.id)
        .eq('variant_id', variantId ?? '')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: (existing.quantity as number) + quantity })
          .eq('id', existing.id as string);
        if (error) throw new Error('Erro ao atualizar item no carrinho.');
      } else {
        const { error } = await supabase.from('cart_items').insert({
          cart_id: cId,
          product_id: product.id,
          variant_id: variantId,
          size,
          color,
          quantity,
          unit_price: unitPrice,
        });
        if (error) throw new Error('Erro ao adicionar item ao carrinho.');
      }
      await refresh();
      setCartOpen(true);
    },
    [ensureCart, refresh],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
      if (error) console.error('removeItem', error);
      await refresh();
    },
    [refresh],
  );

  const updateQty = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) {
        await removeItem(itemId);
        return;
      }
      const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
      if (error) console.error('updateQty', error);
      await refresh();
    },
    [removeItem, refresh],
  );

  const clear = useCallback(async () => {
    if (!cartId) return;
    const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);
    if (error) console.error('clear cart', error);
    setItems([]);
  }, [cartId]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, loading, cartOpen, setCartOpen, refresh, addItem, updateQty, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
