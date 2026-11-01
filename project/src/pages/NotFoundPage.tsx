import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="container-lg flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="font-serif text-6xl lg:text-8xl">404</p>
      <p className="mt-4 font-serif text-2xl">Página não encontrada</p>
      <p className="mt-2 text-sm text-stone">A página que você procura pode ter sido movida ou não existe.</p>
      <Link to="/" className="mt-6 btn-primary">Voltar ao início</Link>
    </div>
  );
}
