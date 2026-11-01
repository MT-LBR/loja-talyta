import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useFavorites, toggleFavorite } from '@/hooks/useData';
import { useQueryClient } from '@tanstack/react-query';
import { formatBRL, effectivePrice, discountPercent, installmentText, cn } from '@/lib/utils';
import type { ProductWithRelations } from '@/types/database';

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: favorites } = useFavorites();
  const [adding, setAdding] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  const isFavorited = favorites?.some((f) => f.product_id === product.id) ?? false;
  const images = product.product_images?.sort((a, b) => a.display_order - b.display_order) ?? [];
  const mainImage = images[0]?.url;
  const hoverImage = images[1]?.url ?? images[0]?.url;
  const totalStock = product.product_variants?.reduce((s, v) => s + v.stock, 0) ?? 0;
  const outOfStock = totalStock <= 0;
  const price = effectivePrice(product.price, product.sale_price);
  const hasDiscount = discountPercent(product.price, product.sale_price) > 0;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    const firstVariant = product.product_variants?.find((v) => v.stock > 0);
    setAdding(true);
    try {
      await addItem(product, firstVariant?.id ?? null, firstVariant?.size ?? null, firstVariant?.color ?? null, 1);
    } catch {
      navigate(`/produto/${product.slug}`);
    } finally {
      setAdding(false);
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setFavLoading(true);
    try {
      await toggleFavorite(product.id, isFavorited);
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    } catch (err) {
      console.error(err);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <div className="group relative">
      <Link to={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-sand">
          {mainImage && (
            <img
              src={mainImage}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-all duration-[800ms] ease-editorial group-hover:opacity-0 group-hover:scale-105"
            />
          )}
          {hoverImage && (
            <img
              src={hoverImage}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-[800ms] ease-editorial group-hover:opacity-100 group-hover:scale-105"
            />
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.is_new && (
              <span className="bg-pearl-pure/95 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink backdrop-blur-sm">Novo</span>
            )}
            {product.is_launch && !product.is_new && (
              <span className="bg-pearl-pure/95 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink backdrop-blur-sm">Lançamento</span>
            )}
            {hasDiscount && (
              <span className="bg-ink px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-pearl">
                -{discountPercent(product.price, product.sale_price)}%
              </span>
            )}
          </div>

          {/* Favorite button */}
          <button
            onClick={handleFavorite}
            disabled={favLoading}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-pearl-pure/90 backdrop-blur-sm transition-all duration-300 ease-editorial hover:bg-pearl-pure hover:scale-105"
            aria-label="Favoritar"
          >
            <Heart className={cn('h-4 w-4 transition-colors', isFavorited && 'fill-ink text-ink')} />
          </button>

          {/* Out of stock overlay */}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-pearl/70 backdrop-blur-[2px]">
              <span className="bg-ink px-7 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-pearl">Esgotado</span>
            </div>
          )}

          {/* Quick add button */}
          {!outOfStock && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full transition-transform duration-500 ease-editorial group-hover:translate-y-0">
              <button
                onClick={handleQuickAdd}
                disabled={adding}
                className="flex w-full items-center justify-center gap-2 bg-ink/95 py-3.5 text-[11px] font-medium uppercase tracking-[0.16em] text-pearl backdrop-blur-sm transition-colors duration-300 hover:bg-ink"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                {adding ? 'Adicionando...' : 'Adicionar à sacola'}
              </button>
            </div>
          )}
        </div>

        <div className="pt-4">
          {product.brand && <p className="text-[10px] uppercase tracking-[0.16em] text-stone">{product.brand}</p>}
          <h3 className="mt-1 font-serif text-base text-ink transition-colors duration-300 group-hover:text-clay">{product.name}</h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={cn('text-sm', hasDiscount && 'text-ink font-medium')}>{formatBRL(price)}</span>
            {hasDiscount && (
              <span className="text-xs text-stone line-through">{formatBRL(product.price)}</span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-stone">{installmentText(price)}</p>
        </div>
      </Link>
    </div>
  );
}
