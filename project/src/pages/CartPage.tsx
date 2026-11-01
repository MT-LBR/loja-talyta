import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatBRL, effectivePrice } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';

export function CartPage() {
  const { items, subtotal, updateQty, removeItem, loading } = useCart();

  return (
    <div>
      <PageHeader title="Sacola" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'Sacola' }]} />
      <div className="container-lg py-8 lg:py-12">
        {loading ? (
          <div className="skeleton h-64 w-full" />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-16 w-16 text-stone-light" strokeWidth={1} />
            <p className="mt-4 font-serif text-2xl">Sua sacola está vazia</p>
            <p className="mt-2 text-sm text-stone">Adicione peças para continuar sua compra.</p>
            <Link to="/" className="mt-6 btn-primary">Explorar a loja</Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {items.map((item) => {
                  const img = item.product?.product_images?.[0]?.url;
                  const price = effectivePrice(item.product?.price ?? 0, item.product?.sale_price ?? null);
                  return (
                    <div key={item.id} className="flex gap-4 border-b border-stone-border pb-6">
                      <Link to={`/produto/${item.product?.slug ?? ''}`} className="flex-shrink-0">
                        <div className="h-36 w-28 overflow-hidden bg-stone-light">
                          {img && <img src={img} alt={item.product?.name ?? ''} className="h-full w-full object-cover" />}
                        </div>
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between">
                          <Link to={`/produto/${item.product?.slug ?? ''}`} className="font-serif text-lg hover:text-stone">
                            {item.product?.name}
                          </Link>
                          <button onClick={() => removeItem(item.id)} className="text-stone hover:text-ink" aria-label="Remover">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {(item.color || item.size) && (
                          <p className="mt-1 text-xs text-stone">{[item.color, item.size].filter(Boolean).join(' · ')}</p>
                        )}
                        <p className="mt-1 text-sm text-stone">{formatBRL(price)}</p>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center border border-stone-border">
                            <button onClick={() => updateQty(item.id, item.quantity - 1)} className="flex h-8 w-8 items-center justify-center hover:bg-stone-light">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="flex h-8 w-10 items-center justify-center text-sm">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, item.quantity + 1)} className="flex h-8 w-8 items-center justify-center hover:bg-stone-light">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="font-medium">{formatBRL(price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link to="/" className="mt-8 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-stone hover:text-ink">
                <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Continuar comprando
              </Link>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-pearl-pure p-6 lg:p-8">
                <h2 className="font-serif text-xl">Resumo</h2>
                <div className="mt-4 space-y-3 border-b border-stone-border pb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone">Subtotal</span>
                    <span>{formatBRL(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone">Frete</span>
                    <span className="text-stone">Calculado no checkout</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <span className="text-sm text-stone">Total</span>
                  <span className="font-serif text-2xl">{formatBRL(subtotal)}</span>
                </div>
                <Link to="/checkout" className="mt-6 btn-primary w-full">
                  Finalizar compra
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
