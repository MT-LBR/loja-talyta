import { useState } from 'react';
import { useStoreSettings } from '@/hooks/useData';
import { PageHeader } from '@/components/PageHeader';
import { Mail, Phone, MapPin, Clock, Instagram, MessageCircle, Loader2, Check } from 'lucide-react';

export function ContactPage() {
  const { data: settings } = useStoreSettings();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? 'Erro ao enviar mensagem.');
      } else {
        setSent(true);
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch {
      setErrorMsg('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Contato" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'Contato' }]} />
      <div className="container-lg py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Info */}
          <div>
            <h2 className="font-serif text-2xl">Fale conosco</h2>
            <p className="mt-2 text-sm text-stone">Estamos à disposição para ajudar com qualquer dúvida.</p>
            <div className="mt-8 space-y-5">
              {settings?.whatsapp && (
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm hover:text-stone">
                  <MessageCircle className="h-5 w-5 text-ink" strokeWidth={1.2} />
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-xs text-stone">{settings.whatsapp}</p>
                  </div>
                </a>
              )}
              {settings?.email && (
                <a href={`mailto:${settings.email}`} className="flex items-center gap-3 text-sm hover:text-stone">
                  <Mail className="h-5 w-5 text-ink" strokeWidth={1.2} />
                  <div>
                    <p className="font-medium">E-mail</p>
                    <p className="text-xs text-stone">{settings.email}</p>
                  </div>
                </a>
              )}
              {settings?.phone && (
                <a href={`tel:${settings.phone}`} className="flex items-center gap-3 text-sm hover:text-stone">
                  <Phone className="h-5 w-5 text-ink" strokeWidth={1.2} />
                  <div>
                    <p className="font-medium">Telefone</p>
                    <p className="text-xs text-stone">{settings.phone}</p>
                  </div>
                </a>
              )}
              {settings?.instagram && (
                <a href={`https://instagram.com/${settings.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm hover:text-stone">
                  <Instagram className="h-5 w-5 text-ink" strokeWidth={1.2} />
                  <div>
                    <p className="font-medium">Instagram</p>
                    <p className="text-xs text-stone">{settings.instagram}</p>
                  </div>
                </a>
              )}
              {settings?.business_hours && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-5 w-5 text-ink" strokeWidth={1.2} />
                  <div>
                    <p className="font-medium">Horário de atendimento</p>
                    <p className="text-xs text-stone">{settings.business_hours}</p>
                  </div>
                </div>
              )}
              {settings?.address_street && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-5 w-5 text-ink" strokeWidth={1.2} />
                  <div>
                    <p className="font-medium">Endereço</p>
                    <p className="text-xs text-stone">{settings.address_street}, {settings.address_number}{settings.address_city ? ` — ${settings.address_city}/${settings.address_state}` : ''}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div>
            {sent ? (
              <div className="flex flex-col items-center justify-center border border-stone-border p-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center bg-ink text-pearl">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-serif text-xl">Mensagem enviada</h3>
                <p className="mt-2 text-sm text-stone">Responderemos o mais breve possível.</p>
                <button onClick={() => setSent(false)} className="mt-4 btn-ghost">Enviar outra</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="border border-stone-border p-6 lg:p-8">
                <h2 className="font-serif text-xl">Envie uma mensagem</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <label className="label-field">Nome</label>
                    <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label-field">E-mail</label>
                      <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
                    </div>
                    <div>
                      <label className="label-field">Telefone</label>
                      <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="label-field">Assunto</label>
                    <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="label-field">Mensagem</label>
                    <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-field resize-none" />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar mensagem'}
                  </button>
                  {errorMsg && <p className="text-xs text-ink">{errorMsg}</p>}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
