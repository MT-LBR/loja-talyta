import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, X, Loader2 } from 'lucide-react';

const EMPTY = { title: '', subtitle: '', cta_text: '', cta_link: '', image_url: '', position: 'hero', active: true };

export function AdminBanners() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data: banners } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase.from('banners').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('banners').insert({
      title: form.title, subtitle: form.subtitle || null, cta_text: form.cta_text || null,
      cta_link: form.cta_link || null, image_url: form.image_url, position: form.position, active: form.active,
    });
    setSaving(false);
    setShowForm(false);
    setForm(EMPTY);
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    queryClient.invalidateQueries({ queryKey: ['banners'] });
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('banners').update({ active: !current }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    queryClient.invalidateQueries({ queryKey: ['banners'] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir banner?')) return;
    await supabase.from('banners').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    queryClient.invalidateQueries({ queryKey: ['banners'] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">Banners</h1>
        <button onClick={() => { setShowForm(true); setForm(EMPTY); }} className="flex items-center gap-2 btn-primary">
          <Plus className="h-4 w-4" /> Novo banner
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners?.map((b) => (
          <div key={b.id} className="border border-stone-border">
            <div className="aspect-video overflow-hidden bg-stone-light">
              <img src={b.image_url} alt={b.title} className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <h3 className="font-serif text-base">{b.title}</h3>
              <p className="text-xs text-stone">{b.position}</p>
              <div className="mt-3 flex items-center justify-between">
                <button onClick={() => toggleActive(b.id, b.active)} className={`px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${b.active ? 'bg-ink text-pearl' : 'bg-stone-light text-stone'}`}>
                  {b.active ? 'Ativo' : 'Inativo'}
                </button>
                <button onClick={() => handleDelete(b.id)} className="text-stone hover:text-ink"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-lg bg-pearl-pure p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">Novo banner</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label-field">Título</label>
                <input type="text" required value={form.title as string} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Subtítulo</label>
                <input type="text" value={form.subtitle as string} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="input-field" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">Texto do botão</label>
                  <input type="text" value={form.cta_text as string} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Link</label>
                  <input type="text" value={form.cta_link as string} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} className="input-field" placeholder="/catalogo/vestidos" />
                </div>
              </div>
              <div>
                <label className="label-field">URL da imagem</label>
                <input type="url" required value={form.image_url as string} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Posição</label>
                <select value={form.position as string} onChange={(e) => setForm({ ...form, position: e.target.value })} className="input-field">
                  <option value="hero">Hero (carrossel)</option>
                  <option value="secondary">Secundário</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active as boolean} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-ink" />
                Ativo
              </label>
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
