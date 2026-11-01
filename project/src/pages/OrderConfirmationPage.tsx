import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatBRL } from '@/lib/utils';
import { Check, Package, ChevronRight } from 'lucide-react';

export function OrderConfirmationPage() {
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

  return (
    <div className="container-lg py-12 lg:py-20">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center bg-ink text-pearl">
          <Check className="h-9 w-9" />
        </div>
        <h1 className="mt-6 font-serif text-3xl lg:text-4xl">Pedido confirmado</h1>
        {isLoading ? (
          <p className="mt-3 text-sm text-stone">Carregando...</p>
        ) : order ? (
          <>
            <p className="mt-3 text-sm text-stone">
              Seu pedido <span className="font-medium text-ink">{order.order_number}</span> foi recebido e está aguardando pagamento.
            </p>
            <p className="mt-1 text-sm text-stone">Total: {formatBRL(order.total)}</p>
            <div className="mt-8 border border-stone-border p-6 text-left">
              <h2 className="flex items-center gap-2 font-serif text-lg"><Package className="h-4 w-4" /> Próximos passos</h2>
              <ol className="mt-4 space-y-3 text-sm text-ink/80">
                <li>1. Você receberá as instruções de pagamento por e-mail.</li>
                <li>2. Após a confirmação do pagamento, o pedido entrará em preparação.</li>
                <li>3. Você poderá acompanhar o status na sua conta.</li>
              </ol>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/conta/pedidos" className="btn-primary">Acompanhar pedido</Link>
              <Link to="/" className="btn-outline">Continuar comprando</Link>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-stone">Pedido não encontrado.</p>
        )}
      </div>
    </div>
  );
}
