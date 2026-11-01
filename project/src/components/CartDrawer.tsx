import { Link } from 'react-router-dom';
import { useState } from 'react';
import { X, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatBRL, effectivePrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function CartDrawer() {
  const { items, cartOpen, setCartOpen, subtotal, updateQty, removeItem, loading } = useCart();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    await removeItem(id);
    setRemovingId(null);
  };

  return (
    <div className={cn('fixed inset-0 z-50', cartOpen ? 'pointer-events-auto' : 'pointer-events-none')}>
      <div
        className={cn('absolute inset-0 bg-ink/40 transition-opacity duration-300', cartOpen ? 'opacity-100' : 'opacity-0')}
        onClick={() => setCartOpen(false)}
      />
      <div
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-pearl-pure shadow-card transition-transform duration-300 ease-out',
          cartOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-stone-border px-6 py-5">
          <h2 className="font-serif text-lg tracking-wide">Sua sacola</h2>
          <button onClick={() => setCartOpen(false)} aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 space-y-4 p-6">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton h-28 w-20" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-stone-light" strokeWidth={1} />
            <p className="font-serif text-xl">Sua sacola está vazia</p>
            <p className="text-sm text-stone">Adicione peças à sua sacola para continuar.</p>
            <button onClick={() => setCartOpen(false)} className="btn-primary mt-2">
              Continuar comprando
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-5">
                {items.map((item) => {
                  const img = item.product?.product_images?.[0]?.url;
                  const price = effectivePrice(item.product?.price ?? 0, item.product?.sale_price ?? null);
                  const lineTotal = price * item.quantity;
                  return (
                    <div key={item.id} className="flex gap-4">
                      <Link to={`/produto/${item.product?.slug ?? ''}`} onClick={() => setCartOpen(false)} className="flex-shrink-0">
                        <div className="h-28 w-20 overflow-hidden bg-stone-light">
                          {img && <img src={img} alt={item.product?.name ?? ''} className="h-full w-full object-cover" />}
                        </div>
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <Link to={`/produto/${item.product?.slug ?? ''}`} onClick={() => setCartOpen(false)} className="font-serif text-sm leading-tight hover:text-stone">
                            {item.product?.name}
                          </Link>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="text-stone transition-colors hover:text-ink"
                            aria-label="Remover"
                          >
                            {removingId === item.id ? (
                              <span className="text-[10px]">...</span>
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        {(item.color || item.size) && (
                          <p className="mt-0.5 text-[11px] text-stone">
                            {[item.color, item.size].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center border border-stone-border">
                            <button
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center transition-colors hover:bg-stone-light"
                              aria-label="Diminuir"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="flex h-7 w-8 items-center justify-center text-xs">{item.quantity}</span>
                            <button
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center transition-colors hover:bg-stone-light"
                              aria-label="Aumentar"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-sm font-medium">{formatBRL(lineTotal)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-stone-border px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone">Subtotal</span>
                <span className="font-serif text-xl">{formatBRL(subtotal)}</span>
              </div>
              <p className="mt-1 text-[11px] text-stone">Frete calculado no checkout</p>
              <div className="mt-4 flex flex-col gap-2">
                <Link to="/checkout" onClick={() => setCartOpen(false)} className="btn-primary w-full">
                  Finalizar compra
                </Link>
                <button onClick={() => setCartOpen(false)} className="btn-ghost w-full">
                  Continuar comprando
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
