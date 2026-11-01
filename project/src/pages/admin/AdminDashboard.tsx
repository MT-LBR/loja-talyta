import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatBRL, formatDate } from '@/lib/utils';
import { TrendingUp, ShoppingBag, Clock, Users, Package, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: '#8D8A86',
  paid: '#090909',
  preparing: '#202020',
  shipped: '#4A4A4A',
  in_transit: '#6B6B6B',
  delivered: '#2D5F2D',
  cancelled: '#B33A3A',
};

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Pago',
  preparing: 'Em preparação',
  shipped: 'Enviado',
  in_transit: 'Em trânsito',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_dashboard_stats');
      if (error) throw error;
      return data as Record<string, number>;
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ['admin-low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, stock, size, color, product:products(name)')
        .lt('stock', 3)
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: statusCounts } = useQuery({
    queryKey: ['admin-status-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .order('status');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((o: { status: string }) => { counts[o.status] = (counts[o.status] ?? 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const cards = [
    { label: 'Faturamento total', value: formatBRL(stats?.total_revenue ?? 0), icon: TrendingUp },
    { label: 'Faturamento do mês', value: formatBRL(stats?.month_revenue ?? 0), icon: TrendingUp },
    { label: 'Faturamento do dia', value: formatBRL(stats?.today_revenue ?? 0), icon: TrendingUp },
    { label: 'Ticket médio', value: formatBRL(stats?.avg_ticket ?? 0), icon: ShoppingBag },
    { label: 'Total de pedidos', value: String(stats?.order_count ?? 0), icon: Package },
    { label: 'Novos clientes (30d)', value: String(stats?.new_customers ?? 0), icon: Users },
    { label: 'Pedidos pendentes', value: String(stats?.pending ?? 0), icon: Clock },
    { label: 'Pedidos enviados', value: String(stats?.shipped ?? 0), icon: Package },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl">Dashboard</h1>
      <p className="mt-1 text-sm text-stone">Visão geral da sua boutique</p>

      {/* Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, i) => (
          <div key={i} className="border border-stone-border bg-pearl-pure p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.14em] text-stone">{c.label}</p>
              <c.icon className="h-4 w-4 text-stone" />
            </div>
            {isLoading ? (
              <div className="skeleton mt-2 h-6 w-20" />
            ) : (
              <p className="mt-2 font-serif text-xl">{c.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="border border-stone-border bg-pearl-pure p-6">
          <h2 className="font-serif text-lg">Status dos pedidos</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusCounts ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                  {(statusCounts ?? []).map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] ?? '#8D8A86'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-stone-border bg-pearl-pure p-6">
          <h2 className="font-serif text-lg">Pedidos recentes</h2>
          <div className="mt-4 space-y-2">
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.slice(0, 6).map((o) => (
                <div key={o.id} className="flex items-center justify-between border-b border-stone-border pb-2 text-sm">
                  <div>
                    <p className="font-medium">{o.order_number}</p>
                    <p className="text-xs text-stone">{formatDate(o.created_at)} · {STATUS_LABELS[o.status] ?? o.status}</p>
                  </div>
                  <span>{formatBRL(o.total)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-stone">Nenhum pedido ainda.</p>
            )}
          </div>
        </div>
      </div>

      {/* Low stock */}
      <div className="mt-6 border border-stone-border bg-pearl-pure p-6">
        <h2 className="flex items-center gap-2 font-serif text-lg">
          <AlertCircle className="h-4 w-4" /> Estoque baixo
        </h2>
        <div className="mt-4 space-y-2">
          {lowStock && lowStock.length > 0 ? (
            lowStock.map((v: Record<string, unknown>) => {
              const product = v.product as { name: string };
              return (
                <div key={v.id as string} className="flex items-center justify-between border-b border-stone-border pb-2 text-sm">
                  <span>{product?.name} — {v.color as string} / {v.size as string}</span>
                  <span className="text-stone">{v.stock as number} un.</span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-stone">Tudo em ordem.</p>
          )}
        </div>
      </div>
    </div>
  );
}
