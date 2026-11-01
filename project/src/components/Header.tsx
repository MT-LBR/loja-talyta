import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Search, User, Heart, ShoppingBag, Menu, X, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useData';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Início', to: '/' },
  { label: 'Novidades', to: '/novidades' },
  { label: 'Lançamentos', to: '/lancamentos' },
  { label: 'Vestidos', to: '/catalogo/vestidos' },
  { label: 'Conjuntos', to: '/catalogo/conjuntos' },
  { label: 'Blusas', to: '/catalogo/blusas' },
  { label: 'Calças', to: '/catalogo/calcas' },
  { label: 'Saias', to: '/catalogo/saias' },
  { label: 'Shorts', to: '/catalogo/shorts' },
  { label: 'Jeans', to: '/catalogo/jeans' },
  { label: 'Promoções', to: '/promocoes' },
];

export function Header() {
  const { count, setCartOpen } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchOpen(false);
      setSearchValue('');
    }
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 transition-all duration-500 ease-editorial',
          scrolled ? 'bg-pearl-pure/95 shadow-soft backdrop-blur-md' : 'bg-pearl/90 backdrop-blur-sm',
        )}
      >
        <nav className="container-lg">
          <div className="flex h-16 items-center justify-between gap-4 lg:h-[72px]">
            {/* Mobile menu button */}
            <button className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Menu">
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <span className="font-serif text-xl font-medium tracking-[0.22em] text-ink lg:text-2xl">
                TALYTA AMARAL
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center">
              <ul className="flex items-center gap-7">
                {NAV_LINKS.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      end={link.to === '/'}
                      className={({ isActive }) =>
                        cn(
                          'text-[10px] font-medium uppercase tracking-[0.16em] transition-colors duration-300 link-underline',
                          isActive ? 'text-ink' : 'text-ink/60 hover:text-ink',
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 lg:gap-4">
              <button onClick={() => setSearchOpen(!searchOpen)} aria-label="Buscar" className="transition-opacity hover:opacity-60">
                <Search className="h-[18px] w-[18px]" />
              </button>
              <Link to={user ? '/conta' : '/login'} aria-label="Conta" className="transition-opacity hover:opacity-60">
                <User className="h-[18px] w-[18px]" />
              </Link>
              {isAdmin && (
                <Link to="/admin" aria-label="Painel" className="text-[10px] font-medium uppercase tracking-[0.16em] text-clay hover:text-ink transition-colors">
                  Painel
                </Link>
              )}
              <Link to="/favoritos" aria-label="Favoritos" className="transition-opacity hover:opacity-60 hidden sm:block">
                <Heart className="h-[18px] w-[18px]" />
              </Link>
              <button onClick={() => setCartOpen(true)} aria-label="Sacola" className="relative transition-opacity hover:opacity-60">
                <ShoppingBag className="h-[18px] w-[18px]" />
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center bg-ink px-1 text-[10px] font-medium text-pearl">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search bar */}
          {searchOpen && (
            <div className="border-t border-stone-border pb-4 pt-3 animate-fade-in">
              <form onSubmit={handleSearch} className="flex items-center gap-3">
                <Search className="h-4 w-4 text-stone" />
                <input
                  autoFocus
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="O que você procura?"
                  className="flex-1 bg-transparent text-sm text-ink placeholder-stone focus:outline-none"
                />
                <button type="button" onClick={() => setSearchOpen(false)}>
                  <X className="h-4 w-4 text-stone" />
                </button>
              </form>
            </div>
          )}
        </nav>
      </header>

      {/* Mobile menu drawer */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', menuOpen ? 'pointer-events-auto' : 'pointer-events-none')}>
        <div
          className={cn('absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-500', menuOpen ? 'opacity-100' : 'opacity-0')}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={cn(
            'absolute left-0 top-0 h-full w-[85%] max-w-sm bg-pearl-pure shadow-editorial transition-transform duration-500 ease-editorial',
            menuOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-between border-b border-stone-border px-6 py-5">
            <span className="font-serif text-lg tracking-[0.2em]">TALYTA AMARAL</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Fechar">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(100vh - 80px)' }}>
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.to} className="border-b border-stone-border/50">
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between py-3.5 text-sm font-medium uppercase tracking-[0.12em] transition-colors',
                        isActive ? 'text-ink' : 'text-ink/60',
                      )
                    }
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 text-stone" />
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-3">
              <Link to={user ? '/conta' : '/login'} onClick={() => setMenuOpen(false)} className="block text-[11px] font-medium uppercase tracking-[0.16em] text-stone">
                {user ? 'Minha conta' : 'Entrar / Cadastrar'}
              </Link>
              <Link to="/favoritos" onClick={() => setMenuOpen(false)} className="block text-[11px] font-medium uppercase tracking-[0.16em] text-stone">
                Favoritos
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-[11px] font-medium uppercase tracking-[0.16em] text-clay">
                  Painel administrativo
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
