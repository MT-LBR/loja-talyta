import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatBRL, slugify, effectivePrice } from '@/lib/utils';
import { Plus, Pencil, Trash2, X, Loader2, Search, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminProduct = {
  id: string; name: string; slug: string; price: number; sale_price: number | null;
  published: boolean; is_featured: boolean; is_new: boolean; is_launch: boolean;
  is_bestseller: boolean; is_on_sale: boolean; short_description: string | null;
  description: string | null; sku: string | null; brand: string | null;
  category_id: string | null; collection_id: string | null;
  weight_g: number; height_cm: number; width_cm: number; length_cm: number;
  fabric_composition: string | null; care_instructions: string | null;
  fit: string | null; measurements: string | null;
  category?: { name: string } | null;
};

const EMPTY_FORM = {
  name: '', slug: '', price: '', sale_price: '', short_description: '', description: '',
  sku: '', brand: 'TALYTA AMARAL', category_id: '', collection_id: '',
  weight_g: '', height_cm: '', width_cm: '', length_cm: '',
  fabric_composition: '', care_instructions: '', fit: '', measurements: '',
  published: false, is_featured: false, is_new: false, is_launch: false, is_bestseller: false, is_on_sale: false,
};

export function AdminProducts() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AdminProduct[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').eq('active', true).order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: collections } = useQuery({
    queryKey: ['admin-collections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('collections').select('*').eq('active', true).order('name');
      if (error) throw error;
      return data;
    },
  });

  const filtered = (products ?? []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const startEdit = (p: AdminProduct) => {
    setEditingId(p.id);
    setForm({
      name: p.name, slug: p.slug, price: String(p.price), sale_price: p.sale_price ? String(p.sale_price) : '',
      short_description: p.short_description ?? '', description: p.description ?? '',
      sku: p.sku ?? '', brand: p.brand ?? 'TALYTA AMARAL',
      category_id: p.category_id ?? '', collection_id: p.collection_id ?? '',
      weight_g: String(p.weight_g), height_cm: String(p.height_cm), width_cm: String(p.width_cm), length_cm: String(p.length_cm),
      fabric_composition: p.fabric_composition ?? '', care_instructions: p.care_instructions ?? '',
      fit: p.fit ?? '', measurements: p.measurements ?? '',
      published: p.published, is_featured: p.is_featured, is_new: p.is_new, is_launch: p.is_launch,
      is_bestseller: p.is_bestseller, is_on_sale: p.is_on_sale,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name as string,
      slug: (form.slug as string) || slugify(form.name as string),
      price: parseFloat(form.price as string),
      sale_price: form.sale_price ? parseFloat(form.sale_price as string) : null,
      short_description: form.short_description || null,
      description: form.description || null,
      sku: form.sku || null,
      brand: form.brand || 'TALYTA AMARAL',
      category_id: form.category_id || null,
      collection_id: form.collection_id || null,
      weight_g: parseInt(form.weight_g as string) || 0,
      height_cm: parseFloat(form.height_cm as string) || 0,
      width_cm: parseFloat(form.width_cm as string) || 0,
      length_cm: parseFloat(form.length_cm as string) || 0,
      fabric_composition: form.fabric_composition || null,
      care_instructions: form.care_instructions || null,
      fit: form.fit || null,
      measurements: form.measurements || null,
      published: form.published,
      is_featured: form.is_featured,
      is_new: form.is_new,
      is_launch: form.is_launch,
      is_bestseller: form.is_bestseller,
      is_on_sale: form.is_on_sale,
    };
    if (editingId) {
      await supabase.from('products').update(payload).eq('id', editingId);
    } else {
      await supabase.from('products').insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  const togglePublished = async (p: AdminProduct) => {
    await supabase.from('products').update({ published: !p.published }).eq('id', p.id);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    await supabase.from('products').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">Produtos</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }} className="flex items-center gap-2 btn-primary">
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </div>

      {/* Search */}
      <div className="relative mt-6 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="input-field pl-10 py-2" />
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto border border-stone-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-border bg-pearl-pure text-left text-[11px] uppercase tracking-[0.12em] text-stone">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-stone-border text-sm hover:bg-stone-light/30">
                <td className="px-4 py-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-stone">{p.sku}</p>
                </td>
                <td className="px-4 py-3">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-3">{formatBRL(effectivePrice(p.price, p.sale_price))}</td>
                <td className="px-4 py-3">
                  <button onClick={() => togglePublished(p)} className={cn('px-2 py-1 text-[10px] uppercase tracking-[0.12em]', p.published ? 'bg-ink text-pearl' : 'bg-stone-light text-stone')}>
                    {p.published ? 'Publicado' : 'Oculto'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(p)} className="text-stone hover:text-ink"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="text-stone hover:text-ink"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4">
          <div className="my-8 w-full max-w-2xl bg-pearl-pure p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{editingId ? 'Editar produto' : 'Novo produto'}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">Nome</label>
                  <input type="text" required value={form.name as string} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">SKU</label>
                  <input type="text" value={form.sku as string} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Preço</label>
                  <input type="number" step="0.01" required value={form.price as string} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Preço promocional</label>
                  <input type="number" step="0.01" value={form.sale_price as string} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Categoria</label>
                  <select value={form.category_id as string} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field">
                    <option value="">—</option>
                    {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-field">Coleção</label>
                  <select value={form.collection_id as string} onChange={(e) => setForm({ ...form, collection_id: e.target.value })} className="input-field">
                    <option value="">—</option>
                    {collections?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label-field">Descrição curta</label>
                <input type="text" value={form.short_description as string} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Descrição completa</label>
                <textarea rows={3} value={form.description as string} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field resize-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <label className="label-field">Peso (g)</label>
                  <input type="number" value={form.weight_g as string} onChange={(e) => setForm({ ...form, weight_g: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Altura (cm)</label>
                  <input type="number" step="0.01" value={form.height_cm as string} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Largura (cm)</label>
                  <input type="number" step="0.01" value={form.width_cm as string} onChange={(e) => setForm({ ...form, width_cm: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Comprimento (cm)</label>
                  <input type="number" step="0.01" value={form.length_cm as string} onChange={(e) => setForm({ ...form, length_cm: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">Composição</label>
                  <input type="text" value={form.fabric_composition as string} onChange={(e) => setForm({ ...form, fabric_composition: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Modelagem</label>
                  <input type="text" value={form.fit as string} onChange={(e) => setForm({ ...form, fit: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label-field">Medidas</label>
                <input type="text" value={form.measurements as string} onChange={(e) => setForm({ ...form, measurements: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Cuidados</label>
                <input type="text" value={form.care_instructions as string} onChange={(e) => setForm({ ...form, care_instructions: e.target.value })} className="input-field" />
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'published', label: 'Publicado' },
                  { key: 'is_new', label: 'Novidade' },
                  { key: 'is_launch', label: 'Lançamento' },
                  { key: 'is_featured', label: 'Destaque' },
                  { key: 'is_bestseller', label: 'Mais vendido' },
                  { key: 'is_on_sale', label: 'Promoção' },
                ].map((f) => (
                  <label key={f.key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form[f.key] as boolean} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} className="h-4 w-4 accent-ink" />
                    {f.label}
                  </label>
                ))}
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
