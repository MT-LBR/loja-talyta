import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useProducts } from '@/hooks/useData';
import { ProductCard } from '@/components/ProductCard';
import { PageHeader } from '@/components/PageHeader';
import { Search } from 'lucide-react';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [input, setInput] = useState(q);

  const { data: products, isLoading } = useProducts({ search: q, sort: 'relevance' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: input });
  };

  return (
    <div>
      <PageHeader title="Busca" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'Busca' }]} />
      <div className="container-lg py-8 lg:py-12">
        <form onSubmit={handleSubmit} className="mb-8 flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="O que você procura?"
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">Buscar</button>
        </form>

        {q && (
          <p className="mb-6 text-sm text-stone">
            {isLoading ? 'Buscando...' : `${products?.length ?? 0} resultado(s) para "${q}"`}
          </p>
        )}

        {!q && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-12 w-12 text-stone-light" strokeWidth={1} />
            <p className="mt-4 text-sm text-stone">Digite algo para buscar em nossa boutique.</p>
          </div>
        )}

        {q && !isLoading && products && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-serif text-2xl">Nenhum resultado encontrado</p>
            <p className="mt-2 text-sm text-stone">Tente outros termos ou explore nossas categorias.</p>
          </div>
        )}

        {q && products && products.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
