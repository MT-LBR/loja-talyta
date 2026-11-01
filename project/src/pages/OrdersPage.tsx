import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/PageHeader';
import { formatBRL, formatDate } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Pagamento aprovado',
  preparing: 'Em preparação',
  awaiting_pickup: 'Aguardando coleta',
  shipped: 'Enviado',
  in_transit: 'Em trânsito',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

export function OrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader title="Meus pedidos" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'Minha conta', to: '/conta' }, { label: 'Meus pedidos' }]} />
      <div className="container-lg py-8 lg:py-12">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 w-full" />)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-serif text-2xl">Nenhum pedido</p>
            <p className="mt-2 text-sm text-stone">Quando você fizer sua primeira compra, ela aparecerá aqui.</p>
            <Link to="/" className="mt-6 btn-primary">Explorar a loja</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                to={`/conta/pedidos/${o.order_number}`}
                className="flex items-center justify-between border border-stone-border p-5 transition-colors hover:border-ink"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{o.order_number}</span>
                  <span className="text-xs text-stone">{formatDate(o.created_at)}</span>
                  <span className="text-xs text-stone">{STATUS_LABELS[o.status] ?? o.status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm">{formatBRL(o.total)}</span>
                  <ChevronRight className="h-4 w-4 text-stone" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
