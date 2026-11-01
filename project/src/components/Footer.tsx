import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useData';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function Footer() {
  const { data: settings } = useStoreSettings();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'err' | 'dup'>('idle');

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('idle');
    const { error } = await supabase.from('newsletters').insert({ email: email.trim(), consent: true });
    if (error) {
      if (error.code === '23505') setStatus('dup');
      else setStatus('err');
    } else {
      setStatus('ok');
      setEmail('');
    }
  };

  return (
    <footer className="bg-ink text-pearl grain">
      {/* Newsletter */}
      <div className="relative border-b border-pearl/10">
        <div className="container-lg py-14 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-nude">Newsletter</p>
            <h3 className="mt-4 font-serif text-2xl lg:text-4xl">Receba as novidades</h3>
            <p className="mt-3 text-sm font-light leading-relaxed text-pearl/60">
              Cadastre seu e-mail e seja a primeira a saber sobre novas coleções e edições especiais.
            </p>
            <form onSubmit={handleNewsletter} className="mx-auto mt-8 flex max-w-md items-end gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="flex-1 border-b border-pearl/30 bg-transparent py-3 text-sm text-pearl placeholder-pearl/40 focus:border-nude focus:outline-none transition-colors duration-300"
              />
              <button type="submit" className="border border-pearl px-7 py-3 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-500 ease-editorial hover:bg-pearl hover:text-ink">
                Cadastrar
              </button>
            </form>
            {status === 'ok' && <p className="mt-4 text-xs text-nude">Cadastro realizado com sucesso!</p>}
            {status === 'dup' && <p className="mt-4 text-xs text-pearl/50">Este e-mail já está cadastrado.</p>}
            {status === 'err' && <p className="mt-4 text-xs text-pearl/50">Não foi possível cadastrar. Tente novamente.</p>}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="container-lg py-14 lg:py-20 relative z-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-pearl/40">A Marca</h4>
            <ul className="mt-5 space-y-3">
              <li><Link to="/sobre" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">Sobre nós</Link></li>
              <li><Link to="/sobre" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">Nossa essência</Link></li>
              <li><Link to="/contato" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">Contato</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-pearl/40">Atendimento</h4>
            <ul className="mt-5 space-y-3">
              <li><a href={`https://wa.me/${settings?.whatsapp ?? ''}`} target="_blank" rel="noreferrer" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">WhatsApp</a></li>
              <li><Link to="/faq" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">Dúvidas frequentes</Link></li>
              <li><Link to="/contato" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">Atendimento</Link></li>
              <li><Link to="/sobre" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">Localização</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-pearl/40">Ajuda</h4>
            <ul className="mt-5 space-y-3">
              <li><Link to="/politica/entrega" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">Entrega</Link></li>
              <li><Link to="/politica/trocas-devolucoes" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">Trocas e devoluções</Link></li>
              <li><Link to="/conta/pedidos" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">Acompanhar pedido</Link></li>
              <li><Link to="/politica/pagamento" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">Formas de pagamento</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-[0.2em] text-pearl/40">Institucional</h4>
            <ul className="mt-5 space-y-3">
              <li><Link to="/politica/privacidade" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">Política de privacidade</Link></li>
              <li><Link to="/politica/termos" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">Termos de uso</Link></li>
              <li><Link to="/politica/cookies" className="text-sm text-pearl/75 transition-colors duration-300 hover:text-pearl">Política de cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-pearl/10 pt-10 md:flex-row">
          <div className="font-serif text-2xl tracking-[0.22em]">TALYTA AMARAL</div>
          <div className="flex items-center gap-5">
            {settings?.instagram && (
              <a href={`https://instagram.com/${settings.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" aria-label="Instagram" className="transition-all duration-300 hover:scale-110 hover:text-nude">
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {settings?.email && (
              <a href={`mailto:${settings.email}`} aria-label="E-mail" className="transition-all duration-300 hover:scale-110 hover:text-nude">
                <Mail className="h-5 w-5" />
              </a>
            )}
            {settings?.phone && (
              <a href={`tel:${settings.phone}`} aria-label="Telefone" className="transition-all duration-300 hover:scale-110 hover:text-nude">
                <Phone className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-[11px] text-pearl/30">
          © {new Date().getFullYear()} TALYTA AMARAL. Todos os direitos reservados. CNPJ: {settings?.cnpj || 'Não informado'}.
        </div>
      </div>
    </footer>
  );
}
