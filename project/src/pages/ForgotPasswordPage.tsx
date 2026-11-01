import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Mail, Loader2, Check } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar-senha`,
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  return (
    <div>
      <PageHeader title="Recuperar senha" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'Recuperar senha' }]} />
      <div className="container-lg py-12 lg:py-16">
        <div className="mx-auto max-w-md">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center bg-ink text-pearl">
                <Check className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-serif text-2xl">E-mail enviado</h2>
              <p className="mt-2 text-sm text-stone">Verifique sua caixa de entrada para redefinir sua senha.</p>
              <Link to="/login" className="mt-6 btn-primary">Voltar ao login</Link>
            </div>
          ) : (
            <>
              <h2 className="font-serif text-2xl">Esqueci minha senha</h2>
              <p className="mt-2 text-sm text-stone">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
              {error && <div className="mt-4 border border-ink/20 bg-ink/5 p-3 text-sm text-ink">{error}</div>}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="label-field">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" placeholder="seu@email.com" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar link'}
                </button>
              </form>
              <p className="mt-6 text-center text-sm text-stone">
                Lembrou? <Link to="/login" className="text-ink underline">Entrar</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
