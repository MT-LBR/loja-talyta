import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/conta';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate(from);
    }
  };

  return (
    <div>
      <PageHeader title="Entrar" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'Entrar' }]} />
      <div className="container-lg py-12 lg:py-16">
        <div className="mx-auto max-w-md">
          <h2 className="font-serif text-2xl">Bem-vinda de volta</h2>
          <p className="mt-2 text-sm text-stone">Acesse sua conta para acompanhar pedidos e favoritos.</p>

          {error && (
            <div className="mt-4 border border-ink/20 bg-ink/5 p-3 text-sm text-ink">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label-field">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div>
              <label className="label-field">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm text-stone">
            <Link to="/recuperar-senha" className="hover:text-ink">Esqueci minha senha</Link>
            <span>Não tem conta? <Link to="/cadastro" className="text-ink underline">Cadastre-se</Link></span>
          </div>
        </div>
      </div>
    </div>
  );
}
