import { FitSummary } from '@/types/database';
import { cn } from '@/lib/utils';

interface FitSummaryBarProps {
  summary: FitSummary | null;
}

export function FitSummaryBar({ summary }: FitSummaryBarProps) {
  if (!summary || summary.total_reviews === 0) return null;

  const total = summary.runs_small + summary.true_to_size + summary.runs_large;
  if (total === 0) return null;

  const smallPct = (summary.runs_small / total) * 100;
  const truePct = (summary.true_to_size / total) * 100;
  const largePct = (summary.runs_large / total) * 100;

  const dominant = summary.true_to_size >= Math.max(summary.runs_small, summary.runs_large)
    ? 'true_to_size'
    : summary.runs_small > summary.runs_large
      ? 'runs_small'
      : 'runs_large';

  const labelMap = {
    runs_small: 'Veste menor',
    true_to_size: 'Veste no tamanho',
    runs_large: 'Veste maior',
  };

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-stone mb-2">
        Opinião sobre o caimento ({total} {total === 1 ? 'avaliação' : 'avaliações'})
      </p>

      {/* Stacked bar */}
      <div className="flex h-2 w-full overflow-hidden rounded-sm bg-stone-light">
        <div className="bg-clay transition-all duration-500 ease-editorial" style={{ width: `${smallPct}%` }} />
        <div className="bg-nude transition-all duration-500 ease-editorial" style={{ width: `${truePct}%` }} />
        <div className="bg-ink transition-all duration-500 ease-editorial" style={{ width: `${largePct}%` }} />
      </div>

      {/* Labels with percentages */}
      <div className="mt-3 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-clay" />
          <span className="text-stone">Menor</span>
          <span className="text-ink font-medium">{Math.round(smallPct)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-nude" />
          <span className="text-stone">No tamanho</span>
          <span className="text-ink font-medium">{Math.round(truePct)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-ink" />
          <span className="text-stone">Maior</span>
          <span className="text-ink font-medium">{Math.round(largePct)}%</span>
        </div>
      </div>

      {/* Dominant verdict */}
      <p className={cn('mt-3 text-xs text-ink/70 leading-relaxed')}>
        A maioria das clientes relata que esta peça <strong className="text-ink">{labelMap[dominant].toLowerCase()}</strong>.
      </p>
    </div>
  );
}
