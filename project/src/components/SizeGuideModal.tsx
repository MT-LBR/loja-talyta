import { X, Ruler } from 'lucide-react';
import { useEffect } from 'react';
import { useFitSummary } from '@/hooks/useData';
import { FitSummaryBar } from '@/components/FitSummaryBar';
import type { FitSummary } from '@/types/database';

function FitSummaryInline({ productId }: { productId: string }) {
  const { data: summary } = useFitSummary(productId);
  if (!summary || summary.total_reviews === 0) return null;
  return <FitSummaryBar summary={summary as FitSummary} />;
}

interface SizeGuideModalProps {
  open: boolean;
  onClose: () => void;
  productName?: string;
  fit?: string | null;
  measurements?: string | null;
  sizes?: string[];
  productId?: string;
}

const SIZE_GUIDE_DATA: Record<string, { bust: string; waist: string; hip: string; length: string }> = {
  PP: { bust: '78–82 cm', waist: '60–64 cm', hip: '86–90 cm', length: '—' },
  P: { bust: '82–86 cm', waist: '64–68 cm', hip: '90–94 cm', length: '—' },
  M: { bust: '86–90 cm', waist: '68–72 cm', hip: '94–98 cm', length: '—' },
  G: { bust: '90–94 cm', waist: '72–76 cm', hip: '98–102 cm', length: '—' },
  GG: { bust: '94–98 cm', waist: '76–80 cm', hip: '102–106 cm', length: '—' },
  36: { bust: '80–84 cm', waist: '62–66 cm', hip: '88–92 cm', length: '—' },
  38: { bust: '84–88 cm', waist: '66–70 cm', hip: '92–96 cm', length: '—' },
  40: { bust: '88–92 cm', waist: '70–74 cm', hip: '96–100 cm', length: '—' },
  42: { bust: '92–96 cm', waist: '74–78 cm', hip: '100–104 cm', length: '—' },
  44: { bust: '96–100 cm', waist: '78–82 cm', hip: '104–108 cm', length: '—' },
  46: { bust: '100–104 cm', waist: '82–86 cm', hip: '108–112 cm', length: '—' },
};

export function SizeGuideModal({ open, onClose, productName, fit, measurements, sizes, productId }: SizeGuideModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const availableSizes = sizes ?? [];
  const tableSizes = availableSizes.filter((s) => SIZE_GUIDE_DATA[s]);
  const fallbackSizes = tableSizes.length > 0 ? tableSizes : Object.keys(SIZE_GUIDE_DATA).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-pearl-pure shadow-editorial animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-stone-border bg-pearl-pure px-6 py-5">
          <div className="flex items-center gap-3">
            <Ruler className="h-5 w-5 text-clay" strokeWidth={1.2} />
            <h3 className="font-serif text-xl">Tabela de Medidas</h3>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-stone-light" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {productName && (
            <p className="text-[11px] uppercase tracking-[0.16em] text-stone mb-1">{productName}</p>
          )}

          {/* Fit info */}
          {fit && (
            <div className="mb-5 rounded-sm bg-pearl-warm p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-stone mb-1.5">Modelagem</p>
              <p className="text-sm text-ink leading-relaxed">{fit}</p>
            </div>
          )}

          {/* Size table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-border">
                  <th className="py-3 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-stone">Tamanho</th>
                  <th className="py-3 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-stone">Busto</th>
                  <th className="py-3 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-stone">Cintura</th>
                  <th className="py-3 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-stone">Quadril</th>
                </tr>
              </thead>
              <tbody>
                {fallbackSizes.map((size) => {
                  const data = SIZE_GUIDE_DATA[size];
                  return (
                    <tr key={size} className="border-b border-stone-border/50 transition-colors hover:bg-pearl-warm">
                      <td className="py-3.5 font-medium text-ink">{size}</td>
                      <td className="py-3.5 text-ink/70">{data.bust}</td>
                      <td className="py-3.5 text-ink/70">{data.waist}</td>
                      <td className="py-3.5 text-ink/70">{data.hip}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Product-specific measurements */}
          {measurements && (
            <div className="mt-5 border-t border-stone-border pt-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-stone mb-1.5">Medidas da peça</p>
              <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">{measurements}</p>
            </div>
          )}

          {/* Fit feedback from reviews */}
          {productId && (
            <div className="mt-5 border-t border-stone-border pt-5">
              <FitSummaryInline productId={productId} />
            </div>
          )}

          {/* How to measure */}
          <div className="mt-6 border-t border-stone-border pt-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-stone mb-3">Como medir</p>
            <ul className="space-y-2.5 text-xs text-ink/70 leading-relaxed">
              <li className="flex gap-2">
                <span className="font-medium text-clay">•</span>
                <span><strong className="text-ink">Busto:</strong> meça a parte mais cheia do busto, mantendo a fita nivelada.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-clay">•</span>
                <span><strong className="text-ink">Cintura:</strong> meça a parte mais estreita do tronco, acima do umbigo.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-medium text-clay">•</span>
                <span><strong className="text-ink">Quadril:</strong> meça a parte mais larga, na altura dos glúteos.</span>
              </li>
            </ul>
          </div>

          {/* Note */}
          <p className="mt-6 text-[11px] text-stone leading-relaxed">
            As medidas são aproximadas e podem variar levemente entre lotes. Em caso de dúvida entre dois tamanhos, recomendamos escolher o maior.
          </p>
        </div>
      </div>
    </div>
  );
}
