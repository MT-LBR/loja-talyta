import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useData';
import { ProductCard } from '@/components/ProductCard';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';

export function FavoritesPage() {
  const { user } = useAuth();
  const { data: favorites, isLoading } = useFavorites();

  if (!user) {
    return (
      <div>
        <PageHeader title="Favoritos" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'Favoritos' }]} />
        <div className="container-lg py-16 text-center">
          <p className="font-serif text-2xl">Faça login para ver seus favoritos</p>
          <Link to="/login" className="mt-6 inline-block btn-outline">Entrar</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Favoritos" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'Favoritos' }]} />
      <div className="container-lg py-8 lg:py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="skeleton aspect-[3/4]" />
                <div className="skeleton mt-3 h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : !favorites || favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="h-12 w-12 text-stone-light" strokeWidth={1} />
            <p className="mt-4 font-serif text-2xl">Sua lista de favoritos está vazia</p>
            <p className="mt-2 text-sm text-stone">Toque no coração das peças que você ama para salvá-las aqui.</p>
            <Link to="/" className="mt-6 btn-primary">Explorar a loja</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
            {favorites.map((f) => (
              <ProductCard key={f.id} product={f.product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
