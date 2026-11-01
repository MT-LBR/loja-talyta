import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useProduct, useRelatedProducts, useStoreSettings, useFavorites, toggleFavorite } from '@/hooks/useData';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ProductCard } from '@/components/ProductCard';
import { Heart, ShoppingBag, Truck, RefreshCw, Shield, ChevronRight, ZoomIn, Check, Minus, Plus } from 'lucide-react';
import { SizeGuideModal } from '@/components/SizeGuideModal';
import { ReviewSection } from '@/components/ReviewSection';
import { formatBRL, effectivePrice, discountPercent, installmentText, cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export function ProductPage() {
  const { slug } = useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { data: settings } = useStoreSettings();
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: favorites } = useFavorites();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [cep, setCep] = useState('');
  const [shippingResult, setShippingResult] = useState<string | null>(null);
  const [tab, setTab] = useState<'description' | 'care' | 'shipping'>('description');

  const categorySlug = product?.category?.slug;
  const { data: related } = useRelatedProducts(product?.id, categorySlug ?? undefined);

  const variants = product?.product_variants ?? [];
  const images = product?.product_images?.sort((a, b) => a.display_order - b.display_order) ?? [];

  const colors = useMemo(() => {
    const set = new Map<string, string>();
    variants.forEach((v) => { if (v.color) set.set(v.color, v.color_hex ?? '#000000'); });
    return Array.from(set.entries()).map(([name, hex]) => ({ name, hex }));
  }, [variants]);

  const sizes = useMemo(() => {
    if (!selectedColor) return Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[];
    return Array.from(new Set(variants.filter((v) => v.color === selectedColor).map((v) => v.size).filter(Boolean))) as string[];
  }, [variants, selectedColor]);

  const currentVariant = useMemo(() => {
    return variants.find((v) =>
      (!selectedColor || v.color === selectedColor) && (!selectedSize || v.size === selectedSize),
    );
  }, [variants, selectedColor, selectedSize]);

  const availableStock = currentVariant?.stock ?? 0;
  const outOfStock = availableStock <= 0;

  const isFavorited = favorites?.some((f) => f.product_id === product?.id) ?? false;

  const displayImages = useMemo(() => {
    if (!selectedColor) return images;
    const colorImages = images.filter((img) => img.color === selectedColor);
    return colorImages.length > 0 ? colorImages : images;
  }, [images, selectedColor]);

  const price = product ? effectivePrice(product.price, product.sale_price) : 0;
  const hasDiscount = product ? discountPercent(product.price, product.sale_price) > 0 : false;

  const handleAdd = async () => {
    if (!product) return;
    if (!selectedColor && colors.length > 0) return;
    if (!selectedSize && sizes.length > 0) return;
    if (outOfStock) return;
    setAdding(true);
    try {
      await addItem(product, currentVariant?.id ?? null, selectedSize, selectedColor, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch {
      navigate('/login');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (!user) { navigate('/login', { state: { from: `/produto/${product.slug}` } }); return; }
    if (!selectedColor && colors.length > 0) return;
    if (!selectedSize && sizes.length > 0) return;
    if (outOfStock) return;
    setAdding(true);
    try {
      await addItem(product, currentVariant?.id ?? null, selectedSize, selectedColor, quantity);
      navigate('/checkout');
    } catch {
      // error already logged in addItem
    } finally {
      setAdding(false);
    }
  };

  const handleFavorite = async () => {
    if (!product) return;
    if (!user) { navigate('/login'); return; }
    await toggleFavorite(product.id, isFavorited);
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
  };

  const handleShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cep || cep.length < 8) return;
    setShippingResult('Calculando...');
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shipping-quote`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ zip: cep, subtotal: price, items: [{ quantity }] }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const basePrice = settings?.default_shipping_price ?? 29.90;
        setShippingResult(`Frete a partir de ${formatBRL(basePrice)} · Prazo de 3 a 10 dias úteis`);
        return;
      }
      const standard = data.options?.[0];
      if (standard) {
        setShippingResult(`Frete ${standard.price === 0 ? 'grátis' : formatBRL(standard.price)} · ${standard.method} · ${standard.days} dias úteis`);
      } else {
        setShippingResult(`Frete a partir de ${formatBRL(settings?.default_shipping_price ?? 29.90)} · Prazo de 3 a 10 dias úteis`);
      }
    } catch {
      const basePrice = settings?.default_shipping_price ?? 29.90;
      setShippingResult(`Frete a partir de ${formatBRL(basePrice)} · Prazo de 3 a 10 dias úteis`);
    }
  };

  if (isLoading) {
    return (
      <div className="container-lg py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="skeleton aspect-[3/4]" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-6 w-1/2" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-lg py-20 text-center">
        <h1 className="font-serif text-3xl">Produto não encontrado</h1>
        <Link to="/" className="mt-6 inline-block btn-outline">Voltar ao início</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="container-lg py-4">
        <nav className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-stone">
          <Link to="/" className="hover:text-ink">Início</Link>
          <ChevronRight className="h-3 w-3" />
          {product.category && (
            <>
              <Link to={`/catalogo/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="text-ink">{product.name}</span>
        </nav>
      </div>

      <div className="container-lg pb-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div>
            <div className="relative aspect-[3/4] overflow-hidden bg-stone-light">
              {displayImages[activeImage]?.url && (
                <img
                  src={displayImages[activeImage].url}
                  alt={displayImages[activeImage].alt ?? product.name}
                  className="h-full w-full object-cover"
                />
              )}
              <button
                onClick={() => setZoomOpen(true)}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-pearl-pure/90 backdrop-blur-sm transition-opacity hover:opacity-100"
                aria-label="Ampliar"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              {hasDiscount && (
                <span className="absolute left-3 top-3 bg-ink px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-pearl">
                  -{discountPercent(product.price, product.sale_price)}%
                </span>
              )}
            </div>
            {displayImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {displayImages.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'h-20 w-16 flex-shrink-0 overflow-hidden border transition-all',
                      i === activeImage ? 'border-ink' : 'border-stone-border',
                    )}
                  >
                    <img src={img.url} alt={img.alt ?? ''} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-stone">{product.brand}</p>
            <h1 className="mt-1 font-serif text-3xl text-ink lg:text-4xl">{product.name}</h1>
            {product.short_description && (
              <p className="mt-2 text-sm text-stone">{product.short_description}</p>
            )}

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-serif text-3xl text-ink">{formatBRL(price)}</span>
              {hasDiscount && (
                <span className="text-lg text-stone line-through">{formatBRL(product.price)}</span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-stone">ou {installmentText(price)} sem juros</p>

            {/* Color selector */}
            {colors.length > 0 && (
              <div className="mt-8">
                <h4 className="label-field">Cor: {selectedColor ?? '—'}</h4>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => { setSelectedColor(c.name); setSelectedSize(null); setActiveImage(0); }}
                      className={cn(
                        'flex items-center gap-2 border px-3 py-2 text-xs transition-all',
                        selectedColor === c.name ? 'border-ink bg-ink text-pearl' : 'border-stone-border hover:border-ink',
                      )}
                    >
                      <span className="h-3.5 w-3.5 border border-stone-border" style={{ backgroundColor: c.hex }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {sizes.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="label-field">Tamanho: {selectedSize ?? '—'}</h4>
                  <button
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-[11px] uppercase tracking-[0.14em] text-stone transition-colors hover:text-ink"
                  >
                    Tabela de medidas
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const v = variants.find((v) => v.color === selectedColor && v.size === s);
                    const inStock = (v?.stock ?? 0) > 0;
                    return (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        disabled={!inStock}
                        className={cn(
                          'flex h-11 min-w-11 items-center justify-center border px-3 text-sm transition-all',
                          selectedSize === s ? 'border-ink bg-ink text-pearl' : 'border-stone-border',
                          !inStock && 'cursor-not-allowed text-stone line-through opacity-40',
                          inStock && selectedSize !== s && 'hover:border-ink',
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock warning */}
            {selectedColor && selectedSize && !outOfStock && availableStock <= 3 && (
              <p className="mt-4 text-xs text-ink">Últimas {availableStock} {availableStock === 1 ? 'unidade' : 'unidades'}!</p>
            )}
            {selectedColor && selectedSize && outOfStock && (
              <p className="mt-4 text-xs text-stone">Esta combinação está esgotada.</p>
            )}

            {/* Quantity */}
            <div className="mt-6">
              <h4 className="label-field">Quantidade</h4>
              <div className="flex items-center border border-stone-border w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-10 w-10 items-center justify-center hover:bg-stone-light">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="flex h-10 w-12 items-center justify-center text-sm">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(availableStock > 0 ? availableStock : 1, quantity + 1))} disabled={availableStock <= 0} className="flex h-10 w-10 items-center justify-center hover:bg-stone-light disabled:opacity-40">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleAdd}
                disabled={adding || outOfStock || (colors.length > 0 && !selectedColor) || (sizes.length > 0 && !selectedSize)}
                className={cn('btn-outline flex-1', added && 'bg-ink text-pearl')}
              >
                {added ? (
                  <><Check className="h-4 w-4" /> Adicionado</>
                ) : adding ? (
                  'Adicionando...'
                ) : (
                  <><ShoppingBag className="h-4 w-4" /> Adicionar à sacola</>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={adding || outOfStock || (colors.length > 0 && !selectedColor) || (sizes.length > 0 && !selectedSize)}
                className="btn-primary flex-1"
              >
                Comprar agora
              </button>
              <button
                onClick={handleFavorite}
                className="flex h-12 w-12 items-center justify-center border border-stone-border transition-colors hover:border-ink"
                aria-label="Favoritar"
              >
                <Heart className={cn('h-5 w-5', isFavorited && 'fill-ink text-ink')} />
              </button>
            </div>

            {/* Shipping calculator */}
            <div className="mt-8 border-t border-stone-border pt-6">
              <h4 className="label-field">Calcular frete e prazo</h4>
              <form onSubmit={handleShipping} className="flex gap-2">
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Digite seu CEP"
                  className="input-field flex-1"
                  maxLength={8}
                />
                <button type="submit" className="btn-light">Calcular</button>
              </form>
              {shippingResult && <p className="mt-2 text-xs text-stone">{shippingResult}</p>}
              <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noreferrer" className="mt-1 text-[11px] text-stone underline hover:text-ink">
                Não sei meu CEP
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-stone-border pt-6">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Truck className="h-5 w-5 text-ink" strokeWidth={1.2} />
                <p className="text-[10px] text-stone">Entrega nacional</p>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <RefreshCw className="h-5 w-5 text-ink" strokeWidth={1.2} />
                <p className="text-[10px] text-stone">Trocas fáceis</p>
              </div>
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Shield className="h-5 w-5 text-ink" strokeWidth={1.2} />
                <p className="text-[10px] text-stone">Compra segura</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16 border-t border-stone-border">
          <div className="flex gap-8 border-b border-stone-border">
            {[
              { id: 'description', label: 'Descrição' },
              { id: 'care', label: 'Cuidados e composição' },
              { id: 'shipping', label: 'Entrega e troca' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={cn(
                  'py-4 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors border-b-2 -mb-px',
                  tab === t.id ? 'border-ink text-ink' : 'border-transparent text-stone hover:text-ink',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="py-8 max-w-3xl">
            {tab === 'description' && (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-ink/80">{product.description}</p>
                {product.fit && <p className="text-sm"><span className="text-stone">Modelagem:</span> {product.fit}</p>}
                {product.measurements && <p className="text-sm"><span className="text-stone">Medidas:</span> {product.measurements}</p>}
              </div>
            )}
            {tab === 'care' && (
              <div className="space-y-3">
                {product.fabric_composition && <p className="text-sm"><span className="text-stone">Composição:</span> {product.fabric_composition}</p>}
                {product.care_instructions && <p className="text-sm"><span className="text-stone">Cuidados:</span> {product.care_instructions}</p>}
              </div>
            )}
            {tab === 'shipping' && (
              <div className="space-y-3 text-sm text-ink/80">
                <p>Entregamos para todo o Brasil. O prazo varia conforme a região e a transportadora.</p>
                <p>Você pode solicitar troca ou devolução em até 7 dias após o recebimento, conforme o Código de Defesa do Consumidor.</p>
                <Link to="/politica/trocas-devolucoes" className="text-ink underline">Ver política completa</Link>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <ReviewSection productId={product.id} />

        {/* Related products */}
        {related && related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-8 text-center font-serif text-3xl">Você também pode gostar</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zoom modal */}
      {zoomOpen && displayImages[activeImage] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80" onClick={() => setZoomOpen(false)}>
          <img src={displayImages[activeImage].url} alt={displayImages[activeImage].alt ?? ''} className="max-h-[90vh] max-w-[90vw] object-contain" />
        </div>
      )}

      {/* Size guide modal */}
      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        productName={product.name}
        fit={product.fit}
        measurements={product.measurements}
        sizes={sizes}
        productId={product.id}
      />
    </div>
  );
}
