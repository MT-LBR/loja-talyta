import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { formatBRL, formatDate, formatDateTime } from '@/lib/utils';
import { Search, Loader2, Mail, MapPin, ShoppingBag, Calendar, ChevronRight, Package, TrendingUp, Clock } from 'lucide-react';

type Customer = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
};

type CustomerDetail = {
  user: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
  };
  orders: Array<{
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total: number;
    subtotal: number;
    discount: number;
    shipping_price: number;
    payment_method: string | null;
    created_at: string;
    recipient_name: string;
    city: string;
    state: string;
  }>;
  addresses: Array<{
    id: string;
    label: string | null;
    recipient_name: string;
    zip: string;
    street: string;
    number: string;
    complement: string | null;
    district: string;
    city: string;
    state: string;
    reference: string | null;
    is_default: boolean;
    created_at: string;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'Aguardando pagamento',
  payment_confirmed: 'Pagamento confirmado',
  processing: 'Em processamento',
  shipped: 'Enviado',
  delivered: 'Entregue',
  canceled: 'Cancelado',
  refunded: 'Reembolsado',
};

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: 'bg-warning/15 text-warning',
  payment_confirmed: 'bg-info/15 text-info',
  processing: 'bg-info/15 text-info',
  shipped: 'bg-primary/15 text-primary',
  delivered: 'bg-success/15 text-success',
  canceled: 'bg-error/15 text-error',
  refunded: 'bg-error/15 text-error',
};

export function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_customers');
      if (error) throw error;
      return data;
    },
  });

  const { data: detail, isLoading: detailLoading } = useQuery<CustomerDetail>({
    queryKey: ['admin-customer-detail', selectedId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_customer_detail', { p_user_id: selectedId });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedId,
  });

  const filtered = (customers ?? []).filter((c) =>
    c.email.toLowerCase().includes(search.toLowerCase()),
  );

  const totalRevenue = (customers ?? []).reduce((sum, c) => sum + Number(c.total_spent), 0);

  return (
    <div>
      <h1 className="font-serif text-2xl">Clientes</h1>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="border border-stone-border bg-pearl-pure px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-stone">Total de clientes</p>
          <p className="mt-1 font-serif text-2xl">{customers?.length ?? '—'}</p>
        </div>
        <div className="border border-stone-border bg-pearl-pure px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-stone">Compras</p>
          <p className="mt-1 font-serif text-2xl">
            {(customers ?? []).reduce((s, c) => s + c.total_orders, 0)}
          </p>
        </div>
        <div className="border border-stone-border bg-pearl-pure px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-stone">Receita total</p>
          <p className="mt-1 font-serif text-2xl">{formatBRL(totalRevenue)}</p>
        </div>
        <div className="border border-stone-border bg-pearl-pure px-4 py-3">
          <p className="text-xs uppercase tracking-wider text-stone">Ticket médio</p>
          <p className="mt-1 font-serif text-2xl">
            {(() => {
              const totalOrders = (customers ?? []).reduce((s, c) => s + c.total_orders, 0);
              return totalOrders > 0 ? formatBRL(totalRevenue / totalOrders) : '—';
            })()}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Left: customer list */}
        <div className="lg:col-span-2">
          <div className="relative max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por e-mail..."
              className="input-field w-full pl-10 py-2"
            />
          </div>

          <div className="mt-4 space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-stone" />
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`block w-full border p-4 text-left text-sm transition-colors ${
                    selectedId === c.id
                      ? 'border-ink bg-ink/5'
                      : 'border-stone-border hover:border-ink/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0 text-stone" />
                      <span className="font-medium">{c.email}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone" />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(c.created_at)}
                    </span>
                    {c.total_orders > 0 && (
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        {c.total_orders} {c.total_orders === 1 ? 'compra' : 'compras'}
                      </span>
                    )}
                    {c.total_orders > 0 && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {formatBRL(Number(c.total_spent))}
                      </span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <p className="py-4 text-center text-sm text-stone">Nenhum cliente encontrado.</p>
            )}
          </div>
        </div>

        {/* Right: customer detail */}
        <div className="lg:col-span-3">
          {selectedId ? (
            detailLoading || !detail ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-stone" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile header */}
                <div className="border border-stone-border bg-pearl-pure p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-pearl">
                      <span className="font-serif text-sm">
                        {detail.user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{detail.user.email}</p>
                      <p className="text-xs text-stone">
                        Cadastrado em {formatDate(detail.user.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="border border-stone-border px-3 py-2.5 text-center">
                      <p className="text-xs uppercase tracking-wider text-stone">Compras</p>
                      <p className="mt-0.5 font-serif text-xl">{detail.orders.length}</p>
                    </div>
                    <div className="border border-stone-border px-3 py-2.5 text-center">
                      <p className="text-xs uppercase tracking-wider text-stone">Total gasto</p>
                      <p className="mt-0.5 font-serif text-xl">
                        {formatBRL(detail.orders.reduce((s, o) => s + Number(o.total), 0))}
                      </p>
                    </div>
                    <div className="border border-stone-border px-3 py-2.5 text-center">
                      <p className="text-xs uppercase tracking-wider text-stone">Ticket médio</p>
                      <p className="mt-0.5 font-serif text-xl">
                        {detail.orders.length > 0
                          ? formatBRL(detail.orders.reduce((s, o) => s + Number(o.total), 0) / detail.orders.length)
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {detail.user.last_sign_in_at && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-stone">
                      <Clock className="h-3 w-3" />
                      Último acesso: {formatDateTime(detail.user.last_sign_in_at)}
                    </p>
                  )}
                </div>

                {/* Addresses */}
                <div>
                  <h2 className="font-serif text-lg">
                    <MapPin className="mr-1.5 inline h-4 w-4 text-stone" />
                    Endereços ({detail.addresses.length})
                  </h2>
                  <div className="mt-3 space-y-2">
                    {detail.addresses.length > 0 ? (
                      detail.addresses.map((a) => (
                        <div key={a.id} className="border border-stone-border bg-pearl-pure p-4 text-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              {a.label && (
                                <span className="mb-1 inline-block rounded-sm bg-stone-light px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-stone">
                                  {a.label}
                                </span>
                              )}
                              <p className="font-medium">{a.recipient_name}</p>
                              <p className="mt-1 text-stone">
                                {a.street}, {a.number}
                                {a.complement && `, ${a.complement}`}
                              </p>
                              <p className="text-stone">
                                {a.district} — {a.city}/{a.state}
                              </p>
                              <p className="text-stone">CEP: {a.zip}</p>
                              {a.reference && <p className="mt-1 text-xs text-stone">Ref: {a.reference}</p>}
                            </div>
                            {a.is_default && (
                              <span className="rounded-sm bg-success/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-success">
                                Padrão
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="border border-stone-border bg-pearl-pure p-4 text-sm text-stone">
                        Nenhum endereço cadastrado.
                      </p>
                    )}
                  </div>
                </div>

                {/* Order history */}
                <div>
                  <h2 className="font-serif text-lg">
                    <Package className="mr-1.5 inline h-4 w-4 text-stone" />
                    Histórico de compras ({detail.orders.length})
                  </h2>
                  <div className="mt-3 space-y-2">
                    {detail.orders.length > 0 ? (
                      detail.orders.map((o) => (
                        <div key={o.id} className="border border-stone-border bg-pearl-pure p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">#{o.order_number}</p>
                              <p className="text-xs text-stone">{formatDate(o.created_at)}</p>
                            </div>
                            <span className={`rounded-sm px-2 py-0.5 text-[11px] uppercase tracking-wide ${STATUS_COLORS[o.status] ?? 'bg-stone-light text-stone'}`}>
                              {STATUS_LABELS[o.status] ?? o.status}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone">
                              <span>Pagamento: <span className="text-ink">{o.payment_status === 'paid' ? 'Pago' : o.payment_status === 'pending' ? 'Pendente' : o.payment_status}</span></span>
                              {o.payment_method && <span>Método: <span className="text-ink">{o.payment_method}</span></span>}
                              <span>Entrega: <span className="text-ink">{o.city}/{o.state}</span></span>
                            </div>
                            <span className="font-serif text-lg">{formatBRL(Number(o.total))}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="border border-stone-border bg-pearl-pure p-4 text-sm text-stone">
                        Nenhuma compra realizada.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center border border-stone-border bg-pearl-pure/50 text-sm text-stone">
              Selecione um cliente para ver os detalhes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
