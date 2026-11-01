import { useState } from 'react';
import { useStoreSettings } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Check } from 'lucide-react';

export function AdminSettings() {
  const { data: settings } = useStoreSettings();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const s: Record<string, unknown> = { ...settings, ...form };

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const update = { ...form };
    await supabase.from('store_settings').update(update).eq('id', settings!.id);
    setSaving(false);
    setSaved(true);
    setForm({});
    queryClient.invalidateQueries({ queryKey: ['store-settings'] });
    setTimeout(() => setSaved(false), 2500);
  };

  if (!settings) return <div className="skeleton h-64 w-full" />;

  return (
    <div>
      <h1 className="font-serif text-2xl">Configurações</h1>
      <p className="mt-1 text-sm text-stone">Personalize as informações da sua loja</p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
        {/* Store info */}
        <div className="border border-stone-border p-6">
          <h2 className="font-serif text-lg">Informações da loja</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="label-field">Nome da loja</label>
              <input type="text" defaultValue={s.store_name as string} onChange={(e) => set('store_name', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">Slogan</label>
              <input type="text" defaultValue={s.tagline as string} onChange={(e) => set('tagline', e.target.value)} className="input-field" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">E-mail comercial</label>
                <input type="email" defaultValue={s.email as string} onChange={(e) => set('email', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label-field">Telefone</label>
                <input type="text" defaultValue={s.phone as string} onChange={(e) => set('phone', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label-field">WhatsApp (com DDI)</label>
                <input type="text" defaultValue={s.whatsapp as string} onChange={(e) => set('whatsapp', e.target.value)} className="input-field" placeholder="5511999999999" />
              </div>
              <div>
                <label className="label-field">Instagram</label>
                <input type="text" defaultValue={s.instagram as string} onChange={(e) => set('instagram', e.target.value)} className="input-field" placeholder="@talytaamaral" />
              </div>
            </div>
            <div>
              <label className="label-field">CNPJ</label>
              <input type="text" defaultValue={s.cnpj as string} onChange={(e) => set('cnpj', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">Horário de atendimento</label>
              <input type="text" defaultValue={s.business_hours as string} onChange={(e) => set('business_hours', e.target.value)} className="input-field" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="border border-stone-border p-6">
          <h2 className="font-serif text-lg">Endereço</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Rua</label>
              <input type="text" defaultValue={s.address_street as string} onChange={(e) => set('address_street', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">Número</label>
              <input type="text" defaultValue={s.address_number as string} onChange={(e) => set('address_number', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">Bairro</label>
              <input type="text" defaultValue={s.address_district as string} onChange={(e) => set('address_district', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">Cidade</label>
              <input type="text" defaultValue={s.address_city as string} onChange={(e) => set('address_city', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">Estado</label>
              <input type="text" defaultValue={s.address_state as string} onChange={(e) => set('address_state', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">CEP de origem (frete)</label>
              <input type="text" defaultValue={s.origin_zip as string} onChange={(e) => set('origin_zip', e.target.value)} className="input-field" />
            </div>
          </div>
        </div>

        {/* Announcement */}
        <div className="border border-stone-border p-6">
          <h2 className="font-serif text-lg">Faixa de anúncio</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="label-field">Texto da faixa</label>
              <input type="text" defaultValue={s.announcement_text as string} onChange={(e) => set('announcement_text', e.target.value)} className="input-field" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked={s.announcement_active as boolean} onChange={(e) => set('announcement_active', e.target.checked)} className="h-4 w-4 accent-ink" />
              Exibir faixa de anúncio
            </label>
          </div>
        </div>

        {/* Shipping */}
        <div className="border border-stone-border p-6">
          <h2 className="font-serif text-lg">Frete</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Frete grátis acima de (R$)</label>
              <input type="number" step="0.01" defaultValue={s.free_shipping_threshold as number} onChange={(e) => set('free_shipping_threshold', parseFloat(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="label-field">Preço padrão de frete (R$)</label>
              <input type="number" step="0.01" defaultValue={s.default_shipping_price as number} onChange={(e) => set('default_shipping_price', parseFloat(e.target.value))} className="input-field" />
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="border border-stone-border p-6">
          <h2 className="font-serif text-lg">Página inicial</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="label-field">Título do hero</label>
              <input type="text" defaultValue={s.hero_title as string} onChange={(e) => set('hero_title', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">Subtítulo do hero</label>
              <input type="text" defaultValue={s.hero_subtitle as string} onChange={(e) => set('hero_subtitle', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">Texto do botão</label>
              <input type="text" defaultValue={s.hero_cta as string} onChange={(e) => set('hero_cta', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">Imagem do hero (URL)</label>
              <input type="url" defaultValue={s.hero_image as string} onChange={(e) => set('hero_image', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">Texto "Sobre"</label>
              <textarea rows={4} defaultValue={s.about_text as string} onChange={(e) => set('about_text', e.target.value)} className="input-field resize-none" />
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="border border-stone-border p-6">
          <h2 className="font-serif text-lg">Analytics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Meta Pixel ID</label>
              <input type="text" defaultValue={s.meta_pixel_id as string} onChange={(e) => set('meta_pixel_id', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label-field">Google Analytics ID</label>
              <input type="text" defaultValue={s.google_analytics_id as string} onChange={(e) => set('google_analytics_id', e.target.value)} className="input-field" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <><Check className="h-4 w-4" /> Salvo</> : 'Salvar configurações'}
        </button>
      </form>
    </div>
  );
}
