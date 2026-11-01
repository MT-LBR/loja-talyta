import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/PageHeader';
import { formatBRL, formatDate } from '@/lib/utils';
import { ChevronRight, Package, MapPin, CreditCard } from 'lucide-react';

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

export function OrderDetailPage() {
  const { orderNumber } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderNumber,
  });

  const { data: items } = useQuery({
    queryKey: ['order-items', order?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, product:products(slug)')
        .eq('order_id', order!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!order?.id,
  });

  const { data: history } = useQuery({
    queryKey: ['order-history', order?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', order!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!order?.id,
  });

  if (isLoading) {
    return <div className="container-lg py-12"><div className="skeleton h-64 w-full" /></div>;
  }

  if (!order) {
    return (
      <div className="container-lg py-20 text-center">
        <p className="font-serif text-2xl">Pedido não encontrado</p>
        <Link to="/conta/pedidos" className="mt-6 btn-outline">Voltar</Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={order.order_number}
        breadcrumb={[
          { label: 'Início', to: '/' },
          { label: 'Minha conta', to: '/conta' },
          { label: 'Meus pedidos', to: '/conta/pedidos' },
          { label: order.order_number },
        ]}
      />
      <div className="container-lg py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Status */}
            <div className="border border-stone-border p-6">
              <h2 className="font-serif text-lg">Status do pedido</h2>
              <div className="mt-4 flex items-center gap-2">
                <span className="bg-ink px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-pearl">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
                <span className="text-xs text-stone">{formatDate(order.created_at)}</span>
              </div>
              {history && history.length > 0 && (
                <div className="mt-6 space-y-3">
                  {history.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-ink" />
                      <div>
                        <p className="font-medium">{STATUS_LABELS[h.status] ?? h.status}</p>
                        <p className="text-xs text-stone">{formatDate(h.created_at)}{h.note ? ` · ${h.note}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="border border-stone-border p-6">
              <h2 className="font-serif text-lg">Itens</h2>
              <div className="mt-4 space-y-4">
                {items?.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 border-b border-stone-border pb-4 last:border-0">
                    <div>
                      <Link to={`/produto/${item.product?.slug ?? ''}`} className="font-serif text-sm hover:text-stone">
                        {item.product_name}
                      </Link>
                      <p className="text-xs text-stone">
                        {[item.color, item.size].filter(Boolean).join(' · ')} · Qtd: {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm">{formatBRL(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping address */}
            <div className="border border-stone-border p-6">
              <h2 className="flex items-center gap-2 font-serif text-lg"><MapPin className="h-4 w-4" /> Entrega</h2>
              <div className="mt-3 text-sm text-ink/80">
                <p>{order.recipient_name}</p>
                <p>{order.street}, {order.number}{order.complement ? ` - ${order.complement}` : ''}</p>
                <p>{order.district} — {order.city}/{order.state}</p>
                <p>CEP: {order.zip}</p>
                {order.tracking_code && <p className="mt-2"><span className="text-stone">Rastreio:</span> {order.tracking_code}</p>}
                {order.shipping_method && <p><span className="text-stone">Envio:</span> {order.shipping_method}</p>}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="border border-stone-border p-6">
              <h2 className="flex items-center gap-2 font-serif text-lg"><CreditCard className="h-4 w-4" /> Resumo</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone">Subtotal</span>
                  <span>{formatBRL(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone">Desconto</span>
                    <span>-{formatBRL(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone">Frete</span>
                  <span>{formatBRL(order.shipping_price)}</span>
                </div>
                <div className="flex justify-between border-t border-stone-border pt-3">
                  <span className="font-medium">Total</span>
                  <span className="font-serif text-lg">{formatBRL(order.total)}</span>
                </div>
                <div className="pt-2">
                  <span className="text-stone">Pagamento:</span> {order.payment_method ?? '—'}
                </div>
              </div>
            </div>
            <Link to="/conta/pedidos" className="mt-4 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.14em] text-stone hover:text-ink">
              <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Voltar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
