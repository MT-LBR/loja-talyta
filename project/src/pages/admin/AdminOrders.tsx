import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatBRL, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'Aguardando pagamento', paid: 'Pagamento aprovado', preparing: 'Em preparação',
  awaiting_pickup: 'Aguardando coleta', shipped: 'Enviado', in_transit: 'Em trânsito',
  delivered: 'Entregue', cancelled: 'Cancelado', refunded: 'Reembolsado',
};

const NEXT_STATUS: Record<string, string> = {
  awaiting_payment: 'paid', paid: 'preparing', preparing: 'shipped',
  shipped: 'in_transit', in_transit: 'delivered',
};

export function AdminOrders() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: selectedOrder } = useQuery({
    queryKey: ['admin-order', selectedId],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').eq('id', selectedId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedId,
  });

  const { data: orderItems } = useQuery({
    queryKey: ['admin-order-items', selectedId],
    queryFn: async () => {
      const { data, error } = await supabase.from('order_items').select('*').eq('order_id', selectedId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedId,
  });

  const advanceStatus = async (orderId: string, currentStatus: string) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    await supabase.from('orders').update({ status: next }).eq('id', orderId);
    await supabase.from('order_status_history').insert({ order_id: orderId, status: next, note: 'Status atualizado pelo admin' });
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
  };

  const cancelOrder = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    await supabase.from('order_status_history').insert({ order_id: orderId, status: 'cancelled', note: 'Pedido cancelado' });
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
  };

  return (
    <div>
      <h1 className="font-serif text-2xl">Pedidos</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* List */}
        <div className="space-y-2">
          {orders?.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelectedId(o.id)}
              className={cn('w-full border p-4 text-left text-sm transition-colors', selectedId === o.id ? 'border-ink' : 'border-stone-border hover:border-stone')}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{o.order_number}</span>
                <span>{formatBRL(o.total)}</span>
              </div>
              <p className="mt-1 text-xs text-stone">{formatDate(o.created_at)} · {STATUS_LABELS[o.status] ?? o.status}</p>
              <p className="text-xs text-stone">{o.recipient_name} — {o.city}/{o.state}</p>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div>
          {selectedOrder ? (
            <div className="border border-stone-border p-6">
              <h2 className="font-serif text-lg">{selectedOrder.order_number}</h2>
              <p className="text-xs text-stone">{formatDate(selectedOrder.created_at)}</p>
              <div className="mt-4">
                <span className="bg-ink px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-pearl">
                  {STATUS_LABELS[selectedOrder.status] ?? selectedOrder.status}
                </span>
              </div>
              <div className="mt-4 text-sm">
                <p className="font-medium">Cliente</p>
                <p className="text-stone">{selectedOrder.recipient_name}</p>
                <p className="text-stone">{selectedOrder.street}, {selectedOrder.number} — {selectedOrder.city}/{selectedOrder.state}</p>
                <p className="text-stone">CEP: {selectedOrder.zip}</p>
              </div>
              <div className="mt-4">
                <p className="font-medium text-sm">Itens</p>
                {orderItems?.map((item) => (
                  <div key={item.id} className="flex justify-between py-1 text-sm">
                    <span className="text-stone">{item.product_name} {[item.color, item.size].filter(Boolean).join(' · ')} ×{item.quantity}</span>
                    <span>{formatBRL(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 border-t border-stone-border pt-3 text-sm">
                <div className="flex justify-between"><span className="text-stone">Subtotal</span><span>{formatBRL(selectedOrder.subtotal)}</span></div>
                {selectedOrder.discount > 0 && <div className="flex justify-between"><span className="text-stone">Desconto</span><span>-{formatBRL(selectedOrder.discount)}</span></div>}
                <div className="flex justify-between"><span className="text-stone">Frete</span><span>{formatBRL(selectedOrder.shipping_price)}</span></div>
                <div className="flex justify-between font-medium"><span>Total</span><span>{formatBRL(selectedOrder.total)}</span></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {NEXT_STATUS[selectedOrder.status] && (
                  <button onClick={() => advanceStatus(selectedOrder.id, selectedOrder.status)} className="btn-primary text-xs py-2">
                    Avançar para {STATUS_LABELS[NEXT_STATUS[selectedOrder.status]]}
                  </button>
                )}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <button onClick={() => cancelOrder(selectedOrder.id)} className="btn-ghost text-xs py-2 text-stone hover:text-ink">
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center border border-stone-border p-12 text-sm text-stone">
              Selecione um pedido para ver os detalhes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
