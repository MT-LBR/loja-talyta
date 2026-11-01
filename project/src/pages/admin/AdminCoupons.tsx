import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatBRL, formatDate, formatDateTime, cn } from '@/lib/utils';
import { Plus, Trash2, X, Loader2, Pencil, Ticket, TrendingUp, Users, Percent, DollarSign, ChevronRight, ShoppingBag, Calendar } from 'lucide-react';

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  max_uses_per_customer: number | null;
  used_count: number;
  active: boolean;
  created_at: string;
};

type Redemption = {
  redemption_id: string;
  order_id: string;
  order_number: string;
  order_total: number;
  order_discount: number;
  order_status: string;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
};

const EMPTY_FORM = {
  id: '',
  code: '', description: '', discount_type: 'percentage', discount_value: '',
  min_order_value: '', max_uses: '', max_uses_per_customer: '1',
  starts_at: '', ends_at: '', active: true,
};

const STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Pago',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

const STATUS_COLORS: Record<string, string> = {
  awaiting_payment: 'bg-warning/15 text-warning',
  paid: 'bg-success/15 text-success',
  preparing: 'bg-info/15 text-info',
  shipped: 'bg-primary/15 text-primary',
  delivered: 'bg-success/15 text-success',
  cancelled: 'bg-error/15 text-error',
  refunded: 'bg-error/15 text-error',
};

export function AdminCoupons() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: redemptions, isLoading: redemptionsLoading } = useQuery<Redemption[]>({
    queryKey: ['coupon-redemptions', selectedCoupon?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_coupon_redemptions', { p_coupon_id: selectedCoupon!.id });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCoupon,
  });

  const totalDiscount = (redemptions ?? []).reduce((sum, r) => sum + Number(r.order_discount), 0);
  const totalRedeemedRevenue = (redemptions ?? []).reduce((sum, r) => sum + Number(r.order_total), 0);
  const uniqueCustomers = new Set((redemptions ?? []).map((r) => r.user_id).filter(Boolean)).size;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      id: c.id,
      code: c.code,
      description: c.description ?? '',
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_value: c.min_order_value ? String(c.min_order_value) : '',
      max_uses: c.max_uses ? String(c.max_uses) : '',
      max_uses_per_customer: c.max_uses_per_customer ? String(c.max_uses_per_customer) : '1',
      starts_at: c.starts_at ? c.starts_at.slice(0, 10) : '',
      ends_at: c.ends_at ? c.ends_at.slice(0, 10) : '',
      active: c.active,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    const payload = {
      code: (form.code as string).toUpperCase().trim(),
      description: (form.description as string) || null,
      discount_type: form.discount_type as string,
      discount_value: parseFloat(form.discount_value as string),
      min_order_value: form.min_order_value ? parseFloat(form.min_order_value as string) : 0,
      max_uses: form.max_uses ? parseInt(form.max_uses as string) : null,
      max_uses_per_customer: parseInt(form.max_uses_per_customer as string) || 1,
      starts_at: form.starts_at ? new Date(form.starts_at as string).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at as string).toISOString() : null,
      active: form.active as boolean,
    };

    if (!payload.code || isNaN(payload.discount_value) || payload.discount_value <= 0) {
      setFormError('Preencha codigo e valor do desconto.');
      setSaving(false);
      return;
    }

    const { error } = editingId
      ? await supabase.from('coupons').update(payload).eq('id', editingId)
      : await supabase.from('coupons').insert(payload);

    setSaving(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('coupons').update({ active: !current }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Excluir o cupom "${code}"? Esta acao nao pode ser desfeita.`)) return;
    await supabase.from('coupons').delete().eq('id', id);
    if (selectedCoupon?.id === id) setSelectedCoupon(null);
    queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
  };

  const formatDateForInput = (d: string | null) => (d ? d.slice(0, 10) : '');

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl">Cupons de desconto</h1>
          <p className="mt-1 text-sm text-stone">Crie, edite e acompanhe o uso de cupons no checkout.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 btn-primary">
          <Plus className="h-4 w-4" /> Novo cupom
        </button>
      </div>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="border border-stone-border bg-pearl-pure px-4 py-3">
          <div className="flex items-center gap-2">
            <Ticket className="h-3.5 w-3.5 text-stone" />
            <p className="text-xs uppercase tracking-wider text-stone">Cupons ativos</p>
          </div>
          <p className="mt-1 font-serif text-2xl">{(coupons ?? []).filter((c) => c.active).length}</p>
        </div>
        <div className="border border-stone-border bg-pearl-pure px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-stone" />
            <p className="text-xs uppercase tracking-wider text-stone">Resgates totais</p>
          </div>
          <p className="mt-1 font-serif text-2xl">{(coupons ?? []).reduce((s, c) => s + c.used_count, 0)}</p>
        </div>
        <div className="border border-stone-border bg-pearl-pure px-4 py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-stone" />
            <p className="text-xs uppercase tracking-wider text-stone">Receita c/ cupom</p>
          </div>
          <p className="mt-1 font-serif text-2xl">
            {selectedCoupon ? formatBRL(totalRedeemedRevenue) : '—'}
          </p>
        </div>
        <div className="border border-stone-border bg-pearl-pure px-4 py-3">
          <div className="flex items-center gap-2">
            <Percent className="h-3.5 w-3.5 text-stone" />
            <p className="text-xs uppercase tracking-wider text-stone">Desconto concedido</p>
          </div>
          <p className="mt-1 font-serif text-2xl">
            {selectedCoupon ? formatBRL(totalDiscount) : '—'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Left: coupon list */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-stone" />
            </div>
          ) : (coupons ?? []).length > 0 ? (
            <div className="space-y-2">
              {coupons.map((c) => {
                const isExpired = c.ends_at && new Date(c.ends_at) < new Date();
                const isExhausted = c.max_uses !== null && c.used_count >= c.max_uses;
                const usagePct = c.max_uses ? Math.min((c.used_count / c.max_uses) * 100, 100) : 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCoupon(c)}
                    className={`block w-full border p-4 text-left transition-colors ${
                      selectedCoupon?.id === c.id
                        ? 'border-ink bg-ink/5'
                        : 'border-stone-border hover:border-ink/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{c.code}</span>
                        <span className={cn('rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-wide', c.active ? 'bg-success/15 text-success' : 'bg-stone-light text-stone')}>
                          {c.active ? 'Ativo' : 'Inativo'}
                        </span>
                        {isExpired && (
                          <span className="rounded-sm bg-error/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-error">Expirado</span>
                        )}
                        {isExhausted && !isExpired && (
                          <span className="rounded-sm bg-warning/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-warning">Esgotado</span>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-stone" />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone">
                      <span className="flex items-center gap-1">
                        {c.discount_type === 'percentage' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                        {c.discount_type === 'percentage' ? `${c.discount_value}%` : formatBRL(c.discount_value)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        {c.used_count}{c.max_uses ? `/${c.max_uses}` : ' usos'}
                      </span>
                      {c.ends_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(c.ends_at)}
                        </span>
                      )}
                    </div>
                    {c.max_uses && (
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone-light">
                        <div className={cn('h-full rounded-full transition-all', usagePct >= 100 ? 'bg-error' : 'bg-ink')} style={{ width: `${usagePct}%` }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="border border-stone-border p-8 text-center text-sm text-stone">
              Nenhum cupom cadastrado.
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        <div className="lg:col-span-3">
          {selectedCoupon ? (
            <div className="space-y-5">
              {/* Coupon info header */}
              <div className="border border-stone-border bg-pearl-pure p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-mono font-serif text-xl">{selectedCoupon.code}</h2>
                      <button
                        onClick={() => toggleActive(selectedCoupon.id, selectedCoupon.active)}
                        className={cn('rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wide transition-colors', selectedCoupon.active ? 'bg-success/15 text-success' : 'bg-stone-light text-stone')}
                      >
                        {selectedCoupon.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                    {selectedCoupon.description && (
                      <p className="mt-1 text-sm text-stone">{selectedCoupon.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(selectedCoupon)} title="Editar" className="p-1.5 text-stone transition-colors hover:text-ink">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(selectedCoupon.id, selectedCoupon.code)} title="Excluir" className="p-1.5 text-stone transition-colors hover:text-error">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="border border-stone-border px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-stone">Desconto</p>
                    <p className="mt-0.5 font-serif text-lg">
                      {selectedCoupon.discount_type === 'percentage' ? `${selectedCoupon.discount_value}%` : formatBRL(selectedCoupon.discount_value)}
                    </p>
                  </div>
                  <div className="border border-stone-border px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-stone">Pedido min.</p>
                    <p className="mt-0.5 font-serif text-lg">{selectedCoupon.min_order_value ? formatBRL(selectedCoupon.min_order_value) : '—'}</p>
                  </div>
                  <div className="border border-stone-border px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-stone">Usos</p>
                    <p className="mt-0.5 font-serif text-lg">
                      {selectedCoupon.used_count}{selectedCoupon.max_uses ? `/${selectedCoupon.max_uses}` : ''}
                    </p>
                  </div>
                  <div className="border border-stone-border px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-stone">Limite/cliente</p>
                    <p className="mt-0.5 font-serif text-lg">{selectedCoupon.max_uses_per_customer ?? '—'}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone">
                  {selectedCoupon.starts_at && <span>Inicio: {formatDate(selectedCoupon.starts_at)}</span>}
                  {selectedCoupon.ends_at && <span>Validade: {formatDate(selectedCoupon.ends_at)}</span>}
                  {!selectedCoupon.starts_at && !selectedCoupon.ends_at && <span>Sem periodo de validade definido</span>}
                </div>
              </div>

              {/* Redemption stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-stone-border bg-pearl-pure px-4 py-3">
                  <p className="text-xs uppercase tracking-wider text-stone">Resgates</p>
                  <p className="mt-1 font-serif text-xl">{redemptions?.length ?? 0}</p>
                </div>
                <div className="border border-stone-border bg-pearl-pure px-4 py-3">
                  <p className="text-xs uppercase tracking-wider text-stone">Receita</p>
                  <p className="mt-1 font-serif text-xl">{formatBRL(totalRedeemedRevenue)}</p>
                </div>
                <div className="border border-stone-border bg-pearl-pure px-4 py-3">
                  <p className="text-xs uppercase tracking-wider text-stone">Desconto</p>
                  <p className="mt-1 font-serif text-xl">{formatBRL(totalDiscount)}</p>
                </div>
              </div>

              {/* Redemption list */}
              <div>
                <h3 className="font-serif text-base">Historico de uso</h3>
                <div className="mt-3 space-y-2">
                  {redemptionsLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-stone" />
                    </div>
                  ) : (redemptions ?? []).length > 0 ? (
                    redemptions.map((r) => (
                      <div key={r.redemption_id} className="border border-stone-border bg-pearl-pure p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium">#{r.order_number}</p>
                            <p className="text-xs text-stone">
                              {r.user_email ?? 'Cliente nao identificado'} — {formatDateTime(r.created_at)}
                            </p>
                          </div>
                          <span className={cn('rounded-sm px-2 py-0.5 text-[11px] uppercase tracking-wide', STATUS_COLORS[r.order_status] ?? 'bg-stone-light text-stone')}>
                            {STATUS_LABELS[r.order_status] ?? r.order_status}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                          <div className="flex gap-4 text-xs text-stone">
                            <span>Pedido: <span className="text-ink">{formatBRL(Number(r.order_total))}</span></span>
                            <span>Desconto: <span className="text-error">-{formatBRL(Number(r.order_discount))}</span></span>
                          </div>
                          <span className="text-xs text-stone">Cliente unico: {uniqueCustomers}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border border-stone-border bg-pearl-pure p-6 text-center text-sm text-stone">
                      Este cupom ainda nao foi utilizado.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center border border-stone-border bg-pearl-pure/50 text-sm text-stone">
              Selecione um cupom para ver os detalhes e o historico de uso
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg border border-stone-border bg-pearl-pure p-6 lg:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{editingId ? 'Editar cupom' : 'Novo cupom'}</h2>
              <button onClick={() => setShowForm(false)} className="text-stone hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 border border-error bg-error/10 px-3 py-2 text-sm text-error">{formError}</div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="label-field">Codigo</label>
                <input
                  type="text"
                  required
                  value={form.code as string}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="input-field"
                  placeholder="BEMVINDA10"
                  disabled={!!editingId}
                />
                {editingId && <p className="mt-1 text-xs text-stone">O codigo nao pode ser alterado apos a criacao.</p>}
              </div>

              <div>
                <label className="label-field">Descricao (opcional)</label>
                <input
                  type="text"
                  value={form.description as string}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field"
                  placeholder="Cupom de boas-vindas"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">Tipo de desconto</label>
                  <select value={form.discount_type as string} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="input-field">
                    <option value="percentage">Porcentagem</option>
                    <option value="fixed">Valor fixo</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Valor do desconto</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.discount_value as string}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    className="input-field"
                    placeholder={form.discount_type === 'percentage' ? '10' : '50.00'}
                  />
                </div>
                <div>
                  <label className="label-field">Valor minimo do pedido</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.min_order_value as string}
                    onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label-field">Limite de usos total</label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_uses as string}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    className="input-field"
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <label className="label-field">Limite por cliente</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_uses_per_customer as string}
                    onChange={(e) => setForm({ ...form, max_uses_per_customer: e.target.value })}
                    className="input-field"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="label-field">Inicio (opcional)</label>
                  <input
                    type="date"
                    value={formatDateForInput(form.starts_at as string | null)}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">Validade (opcional)</label>
                  <input
                    type="date"
                    value={formatDateForInput(form.ends_at as string | null)}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active as boolean} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-ink" />
                Cupom ativo
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-stone hover:text-ink">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 btn-primary">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingId ? 'Salvar alteracoes' : 'Criar cupom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
