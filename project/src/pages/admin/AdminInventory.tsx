import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Loader2, Pencil, Check, X } from 'lucide-react';

export function AdminInventory() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: variants } = useQuery({
    queryKey: ['admin-variants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, sku, size, color, color_hex, stock, product:products(name, slug)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStock = async (id: string) => {
    setSaving(true);
    await supabase.from('product_variants').update({ stock: parseInt(editStock) || 0 }).eq('id', id);
    setSaving(false);
    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ['admin-variants'] });
  };

  return (
    <div>
      <h1 className="font-serif text-2xl">Estoque</h1>
      <p className="mt-1 text-sm text-stone">Gerencie o estoque por variação</p>

      <div className="mt-6 overflow-x-auto border border-stone-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-border bg-pearl-pure text-left text-[11px] uppercase tracking-[0.12em] text-stone">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Cor</th>
              <th className="px-4 py-3">Tamanho</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {variants?.map((v: Record<string, unknown>) => {
              const product = v.product as { name: string; slug: string };
              const stock = v.stock as number;
              const lowStock = stock < 3;
              return (
                <tr key={v.id as string} className="border-b border-stone-border text-sm hover:bg-stone-light/30">
                  <td className="px-4 py-3">{product?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {v.color_hex ? <span className="h-3.5 w-3.5 border border-stone-border" style={{ backgroundColor: v.color_hex as string }} /> : null}
                      {v.color as string ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">{v.size as string ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-stone">{v.sku as string ?? '—'}</td>
                  <td className="px-4 py-3">
                    {editingId === v.id ? (
                      <input type="number" value={editStock} onChange={(e) => setEditStock(e.target.value)} className="input-field w-20 py-1" autoFocus />
                    ) : (
                      <span className={lowStock ? 'text-ink font-medium' : ''}>{stock}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === v.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => updateStock(v.id as string)} disabled={saving} className="text-ink">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-stone"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(v.id as string); setEditStock(String(stock)); }} className="text-stone hover:text-ink">
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
