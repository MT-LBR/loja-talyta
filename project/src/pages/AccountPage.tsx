import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { User, Package, MapPin, Heart, KeyRound, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export function AccountPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: orders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div>
      <PageHeader title="Minha conta" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'Minha conta' }]} />
      <div className="container-lg py-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="border border-stone-border p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center bg-ink text-pearl">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-[11px] text-stone">Cliente</p>
                </div>
              </div>
              <nav className="mt-6 space-y-1">
                <Link to="/conta" className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink hover:bg-stone-light">
                  <User className="h-4 w-4" /> Meus dados
                </Link>
                <Link to="/conta/pedidos" className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink hover:bg-stone-light">
                  <Package className="h-4 w-4" /> Meus pedidos
                </Link>
                <Link to="/conta/enderecos" className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink hover:bg-stone-light">
                  <MapPin className="h-4 w-4" /> Endereços
                </Link>
                <Link to="/favoritos" className="flex items-center gap-3 px-3 py-2.5 text-sm text-ink hover:bg-stone-light">
                  <Heart className="h-4 w-4" /> Favoritos
                </Link>
                <button onClick={handleSignOut} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-ink hover:bg-stone-light">
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3">
            <h2 className="font-serif text-xl">Resumo</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="border border-stone-border p-5">
                <Package className="h-5 w-5 text-stone" />
                <p className="mt-3 font-serif text-2xl">{orders?.length ?? 0}</p>
                <p className="text-xs text-stone">Pedidos recentes</p>
              </div>
              <Link to="/favoritos" className="border border-stone-border p-5 transition-colors hover:border-ink">
                <Heart className="h-5 w-5 text-stone" />
                <p className="mt-3 font-serif text-2xl">Ver</p>
                <p className="text-xs text-stone">Favoritos</p>
              </Link>
              <Link to="/conta/enderecos" className="border border-stone-border p-5 transition-colors hover:border-ink">
                <MapPin className="h-5 w-5 text-stone" />
                <p className="mt-3 font-serif text-2xl">Gerenciar</p>
                <p className="text-xs text-stone">Endereços</p>
              </Link>
            </div>

            <h3 className="mt-8 font-serif text-lg">Pedidos recentes</h3>
            <div className="mt-3 space-y-3">
              {orders && orders.length > 0 ? (
                orders.map((o) => (
                  <Link key={o.id} to={`/conta/pedidos/${o.order_number}`} className="flex items-center justify-between border border-stone-border p-4 hover:border-ink">
                    <div>
                      <p className="text-sm font-medium">{o.order_number}</p>
                      <p className="text-xs text-stone">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className="text-sm">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.total)}</span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-stone">Nenhum pedido ainda.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
