import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Package, Boxes, ClipboardList, Users, Ticket, Image, Settings, LogOut, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/produtos', label: 'Produtos', icon: Package },
  { to: '/admin/estoque', label: 'Estoque', icon: Boxes },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/cupons', label: 'Cupons', icon: Ticket },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
  { to: '/admin/administradores', label: 'Administradores', icon: ShieldCheck },
];

export function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stone" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-pearl">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-ink text-pearl">
        <div className="flex h-14 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="font-serif text-lg tracking-[0.16em]">TALYTA AMARAL</Link>
            <span className="hidden text-[10px] uppercase tracking-[0.14em] text-pearl/50 sm:inline">Painel</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-[11px] uppercase tracking-[0.14em] text-pearl/70 hover:text-pearl">Ver loja</Link>
            <span className="text-xs text-pearl/50">{user?.email}</span>
            <button onClick={handleSignOut} className="text-pearl/70 hover:text-pearl">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-56 flex-shrink-0 border-r border-stone-border bg-pearl-pure lg:block">
          <nav className="p-4">
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors',
                      (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))
                        ? 'bg-ink text-pearl'
                        : 'text-ink/70 hover:bg-stone-light hover:text-ink',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="w-full overflow-x-auto border-b border-stone-border bg-pearl-pure lg:hidden">
          <nav className="flex gap-1 p-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-shrink-0 items-center gap-2 px-3 py-2 text-xs transition-colors',
                  (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))
                    ? 'bg-ink text-pearl'
                    : 'text-ink/70',
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
