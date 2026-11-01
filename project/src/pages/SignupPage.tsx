import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, Phone, Loader2, ArrowRight, Check } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (!consent) {
      setError('Você precisa concordar com as políticas.');
      return;
    }
    setLoading(true);
    const { error: err } = await signUp(email, password, {
      full_name: name.trim(),
      phone: phone.trim() || undefined,
    });
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div>
        <PageHeader title="Cadastro" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'Cadastro' }]} />
        <div className="container-lg py-16">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center bg-ink text-pearl">
              <Check className="h-7 w-7" />
            </div>
            <h2 className="mt-6 font-serif text-2xl">Conta criada com sucesso</h2>
            <p className="mt-2 text-sm text-stone">Você já pode entrar na sua conta e começar a comprar.</p>
            <Link to="/login" className="mt-6 btn-primary">Fazer login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Cadastro" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'Cadastro' }]} />
      <div className="container-lg py-12 lg:py-16">
        <div className="mx-auto max-w-lg">
          <h2 className="font-serif text-2xl">Crie sua conta</h2>
          <p className="mt-2 text-sm text-stone">Acesse ofertas exclusivas, acompanhe seus pedidos e mais.</p>

          {error && (
            <div className="mt-4 border border-ink/20 bg-ink/5 p-3 text-sm text-ink">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label-field">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input-field pl-10" placeholder="Seu nome" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="seu@email.com" />
                </div>
              </div>
              <div>
                <label className="label-field">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field pl-10" placeholder="(11) 99999-9999" />
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-field">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-10" placeholder="Mín. 6 caracteres" />
                </div>
              </div>
              <div>
                <label className="label-field">Confirmar senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                  <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field pl-10" placeholder="••••••••" />
                </div>
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-stone">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-ink" />
              <span>Concordo com os <Link to="/politica/termos" className="text-ink underline">termos de uso</Link> e a <Link to="/politica/privacidade" className="text-ink underline">política de privacidade</Link>.</span>
            </label>
            <button type="submit" disabled={loading} className={cn('btn-primary w-full', loading && 'opacity-60')}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Criar conta <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone">
            Já tem conta? <Link to="/login" className="text-ink underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
