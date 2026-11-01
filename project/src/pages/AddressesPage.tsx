import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/PageHeader';
import { Plus, Trash2, MapPin, Loader2, Check } from 'lucide-react';
import type { Address } from '@/types/database';
import { cn } from '@/lib/utils';

export function AddressesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cep, setCep] = useState('');
  const [form, setForm] = useState({
    label: '',
    recipient_name: '',
    zip: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
    reference: '',
    is_default: false,
  });

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('addresses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Address[];
    },
  });

  const lookupCep = async (cepValue: string) => {
    if (cepValue.length < 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          zip: cepValue,
          street: data.logradouro ?? f.street,
          district: data.bairro ?? f.district,
          city: data.localidade ?? f.city,
          state: data.uf ?? f.state,
        }));
      }
    } catch { /* ignore */ }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await supabase.from('addresses').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { id, ...rest } = data;
        const { error } = await supabase.from('addresses').insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setShowForm(false);
      setEditingId(null);
      setForm({ label: '', recipient_name: '', zip: '', street: '', number: '', complement: '', district: '', city: '', state: '', reference: '', is_default: false });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('addresses').delete().eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, id: editingId ?? undefined });
  };

  const startEdit = (addr: Address) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label ?? '',
      recipient_name: addr.recipient_name,
      zip: addr.zip,
      street: addr.street,
      number: addr.number,
      complement: addr.complement ?? '',
      district: addr.district,
      city: addr.city,
      state: addr.state,
      reference: addr.reference ?? '',
      is_default: addr.is_default,
    });
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader title="Endereços" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'Minha conta', to: '/conta' }, { label: 'Endereços' }]} />
      <div className="container-lg py-8 lg:py-12">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Meus endereços</h2>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({ label: '', recipient_name: '', zip: '', street: '', number: '', complement: '', district: '', city: '', state: '', reference: '', is_default: false }); }}
            className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-ink hover:text-stone"
          >
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 border border-stone-border p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Identificação (opcional)</label>
                <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="input-field" placeholder="Casa, Trabalho..." />
              </div>
              <div>
                <label className="label-field">Destinatário</label>
                <input type="text" required value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">CEP</label>
                <input
                  type="text"
                  required
                  value={cep || form.zip}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 8); setCep(v); setForm({ ...form, zip: v }); }}
                  onBlur={() => lookupCep(cep || form.zip)}
                  className="input-field"
                  maxLength={8}
                />
              </div>
              <div>
                <label className="label-field">Rua</label>
                <input type="text" required value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Número</label>
                <input type="text" required value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Complemento</label>
                <input type="text" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Bairro</label>
                <input type="text" required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Cidade</label>
                <input type="text" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Estado</label>
                <input type="text" required maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Referência (opcional)</label>
                <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="input-field" />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-ghost">Cancelar</button>
            </div>
          </form>
        )}

        <div className="mt-6 space-y-3">
          {isLoading ? (
            <div className="skeleton h-24 w-full" />
          ) : !addresses || addresses.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <MapPin className="h-10 w-10 text-stone-light" strokeWidth={1} />
              <p className="mt-3 text-sm text-stone">Nenhum endereço cadastrado.</p>
            </div>
          ) : (
            addresses.map((addr) => (
              <div key={addr.id} className="border border-stone-border p-5">
                <div className="flex items-start justify-between">
                  <div>
                    {addr.label && <span className="text-xs font-medium uppercase tracking-[0.14em] text-stone">{addr.label}</span>}
                    {addr.is_default && <span className="ml-2 text-[10px] text-ink">Principal</span>}
                    <p className="mt-1 text-sm">{addr.recipient_name}</p>
                    <p className="text-xs text-stone">{addr.street}, {addr.number}{addr.complement ? `, ${addr.complement}` : ''}</p>
                    <p className="text-xs text-stone">{addr.district} — {addr.city}/{addr.state}</p>
                    <p className="text-xs text-stone">CEP: {addr.zip}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(addr)} className="text-xs text-stone hover:text-ink">Editar</button>
                    <button onClick={() => deleteMutation.mutate(addr.id)} className="text-stone hover:text-ink">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
