import { useParams, useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useProducts, useCategories } from '@/hooks/useData';
import { ProductCard } from '@/components/ProductCard';
import { PageHeader } from '@/components/PageHeader';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIZES = ['PP', 'P', 'M', 'G', 'GG', '36', '38', '40', '42'];
const COLORS = ['Preto', 'Off-White', 'Branco', 'Bege', 'Azul Claro', 'Azul Escuro'];
const SORTS = [
  { value: 'relevance', label: 'Mais relevantes' },
  { value: 'newest', label: 'Mais recentes' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'bestsellers', label: 'Mais vendidos' },
];

export function CatalogPage() {
  const { categorySlug, collectionSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = useCategories();
  const category = categories?.find((c) => c.slug === categorySlug);

  const filters = useMemo(
    () => ({
      categorySlug,
      collectionSlug,
      isNew: categorySlug === 'novidades' || undefined,
      isLaunch: categorySlug === 'lancamentos' || undefined,
      isOnSale: categorySlug === 'promocoes' || undefined,
      search: searchParams.get('q') || undefined,
      minPrice: searchParams.get('min') ? Number(searchParams.get('min')) : undefined,
      maxPrice: searchParams.get('max') ? Number(searchParams.get('max')) : undefined,
      sort: searchParams.get('sort') || 'relevance',
    }),
    [categorySlug, collectionSlug, searchParams],
  );

  const { data: products, isLoading } = useProducts(filters);

  // Client-side filter by size and color
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      if (selectedSizes.length > 0) {
        const hasSize = p.product_variants?.some((v) => v.size && selectedSizes.includes(v.size));
        if (!hasSize) return false;
      }
      if (selectedColors.length > 0) {
        const hasColor = p.product_variants?.some((v) => v.color && selectedColors.includes(v.color));
        if (!hasColor) return false;
      }
      return true;
    });
  }, [products, selectedSizes, selectedColors]);

  const title = category?.name
    ?? (collectionSlug ? collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1) : 'Catálogo');
  const breadcrumb = [{ label: 'Início', to: '/' }, { label: title }];

  const toggleArray = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const setSort = (val: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('sort', val);
    setSearchParams(next);
  };

  return (
    <div>
      <PageHeader title={title} breadcrumb={breadcrumb} />

      <div className="container-lg py-8 lg:py-12">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar filters */}
          <aside
            className={cn(
              'lg:w-64 lg:flex-shrink-0',
              showFilters ? 'fixed inset-0 z-50 overflow-y-auto bg-pearl-pure p-6 lg:static lg:p-0' : 'hidden lg:block',
            )}
          >
            <div className="flex items-center justify-between lg:mb-6">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink">Filtros</h3>
              <button onClick={() => setShowFilters(false)} className="lg:hidden">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="label-field">Tamanho</h4>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleArray(selectedSizes, s, setSelectedSizes)}
                      className={cn(
                        'flex h-9 min-w-9 items-center justify-center border px-3 text-xs transition-colors',
                        selectedSizes.includes(s)
                          ? 'border-ink bg-ink text-pearl'
                          : 'border-stone-border text-ink hover:border-ink',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="label-field">Cor</h4>
                <div className="space-y-2">
                  {COLORS.map((c) => (
                    <label key={c} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(c)}
                        onChange={() => toggleArray(selectedColors, c, setSelectedColors)}
                        className="h-3.5 w-3.5 accent-ink"
                      />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="label-field">Faixa de preço</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Mín"
                    className="input-field px-2 py-2 text-xs"
                    value={searchParams.get('min') ?? ''}
                    onChange={(e) => {
                      const next = new URLSearchParams(searchParams);
                      if (e.target.value) next.set('min', e.target.value);
                      else next.delete('min');
                      setSearchParams(next);
                    }}
                  />
                  <span className="text-stone">—</span>
                  <input
                    type="number"
                    placeholder="Máx"
                    className="input-field px-2 py-2 text-xs"
                    value={searchParams.get('max') ?? ''}
                    onChange={(e) => {
                      const next = new URLSearchParams(searchParams);
                      if (e.target.value) next.set('max', e.target.value);
                      else next.delete('max');
                      setSearchParams(next);
                    }}
                  />
                </div>
              </div>

              {(selectedSizes.length > 0 || selectedColors.length > 0) && (
                <button
                  onClick={() => { setSelectedSizes([]); setSelectedColors([]); }}
                  className="text-[11px] uppercase tracking-[0.12em] text-stone hover:text-ink"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-stone">
                {isLoading ? 'Carregando...' : `${filtered.length} ${filtered.length === 1 ? 'peça' : 'peças'}`}
              </p>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-ink lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                </button>
                <select
                  value={searchParams.get('sort') ?? 'relevance'}
                  onChange={(e) => setSort(e.target.value)}
                  className="border border-stone-border bg-pearl-pure px-3 py-2 text-xs text-ink focus:outline-none"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i}>
                    <div className="skeleton aspect-[3/4]" />
                    <div className="skeleton mt-3 h-4 w-3/4" />
                    <div className="skeleton mt-2 h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <p className="font-serif text-2xl">Nenhuma peça encontrada</p>
                <p className="text-sm text-stone">Tente ajustar os filtros ou explore outras categorias.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-6">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
