import { Link } from 'react-router-dom';
import { useStoreSettings } from '@/hooks/useData';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageHeader({ title, breadcrumb }: { title: string; breadcrumb?: { label: string; to?: string }[] }) {
  const { data: settings } = useStoreSettings();
  return (
    <div className="border-b border-stone-border bg-pearl-pure">
      <div className="container-lg py-10 lg:py-16">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-4 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-stone">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {b.to ? (
                  <Link to={b.to} className="transition-colors hover:text-ink">{b.label}</Link>
                ) : (
                  <span className="text-ink">{b.label}</span>
                )}
                {i < breadcrumb.length - 1 && <ChevronRight className="h-3 w-3" />}
              </span>
            ))}
          </nav>
        )}
        <h1 className={cn('font-serif text-3xl text-ink lg:text-4xl')}>{title}</h1>
        {settings?.tagline && !breadcrumb && <p className="mt-2 text-sm text-stone">{settings.tagline}</p>}
      </div>
    </div>
  );
}
