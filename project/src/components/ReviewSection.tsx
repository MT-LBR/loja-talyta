import { useState } from 'react';
import { Star, Check, MessageSquare } from 'lucide-react';
import { useProductReviews, useFitSummary, submitReview } from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { FitSummaryBar } from '@/components/FitSummaryBar';
import type { FitFeedback } from '@/types/database';

const FIT_OPTIONS: { value: FitFeedback; label: string; desc: string }[] = [
  { value: 'runs_small', label: 'Veste menor', desc: 'A peça é menor que o esperado' },
  { value: 'true_to_size', label: 'Veste no tamanho', desc: 'A peça corresponde ao tamanho' },
  { value: 'runs_large', label: 'Veste maior', desc: 'A peça é maior que o esperado' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(dim, n <= rating ? 'fill-clay text-clay' : 'text-stone-border')}
        />
      ))}
    </div>
  );
}

export function ReviewSection({ productId }: { productId: string }) {
  const { data: reviews } = useProductReviews(productId);
  const { data: fitSummary } = useFitSummary(productId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [fitFeedback, setFitFeedback] = useState<FitFeedback | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const userHasReviewed = reviews?.some((r) => r.user_id === user?.id) ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitReview(productId, rating, fitFeedback, comment.trim() || null);
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['fit-summary', productId] });
      setSuccess(true);
      setShowForm(false);
      setComment('');
      setFitFeedback(null);
      setRating(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="mt-16 border-t border-stone-border">
      <div className="flex items-end justify-between border-b border-stone-border pb-4">
        <div>
          <h2 className="font-serif text-2xl lg:text-3xl">Avaliações</h2>
          {avgRating && (
            <div className="mt-2 flex items-center gap-2">
              <Stars rating={Math.round(Number(avgRating))} />
              <span className="text-sm text-stone">{avgRating} · {reviews?.length} {reviews?.length === 1 ? 'avaliação' : 'avaliações'}</span>
            </div>
          )}
          {!avgRating && (
            <p className="mt-2 text-sm text-stone">Ainda não há avaliações. Seja a primeira!</p>
          )}
        </div>
        {!showForm && !userHasReviewed && (
          <button
            onClick={() => user ? setShowForm(true) : navigate('/login')}
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink link-underline"
          >
            Escrever avaliação
          </button>
        )}
      </div>

      {/* Fit summary bar */}
      <div className="mt-6 max-w-md">
        <FitSummaryBar summary={fitSummary ?? null} />
      </div>

      {/* Review form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-8 rounded-sm border border-stone-border bg-pearl-warm p-6 animate-fade-in">
          <h3 className="font-serif text-lg mb-4">Sua avaliação</h3>

          {/* Star rating */}
          <div className="mb-5">
            <p className="label-field">Nota</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn('h-6 w-6', n <= (hoverRating || rating) ? 'fill-clay text-clay' : 'text-stone-border')}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Fit feedback selector */}
          <div className="mb-5">
            <p className="label-field">Caimento da peça</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {FIT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFitFeedback(opt.value)}
                  className={cn(
                    'border p-3 text-left transition-all duration-300',
                    fitFeedback === opt.value ? 'border-ink bg-pearl-pure' : 'border-stone-border bg-pearl-pure/50 hover:border-stone',
                  )}
                >
                  <span className={cn('block text-xs font-medium', fitFeedback === opt.value ? 'text-ink' : 'text-ink/70')}>
                    {opt.label}
                  </span>
                  <span className="block text-[10px] text-stone mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-5">
            <p className="label-field">Comentário (opcional)</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Conte sobre o caimento, qualidade e se recomenda..."
              className="input-field resize-none"
              maxLength={500}
            />
            <p className="mt-1 text-[11px] text-stone">{comment.length}/500</p>
          </div>

          {error && <p className="mb-4 text-xs text-ink">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Enviando...' : 'Enviar avaliação'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Success message */}
      {success && !showForm && (
        <div className="mt-6 flex items-center gap-3 rounded-sm bg-pearl-warm p-4 animate-fade-in">
          <Check className="h-5 w-5 text-clay" />
          <p className="text-sm text-ink/80">Avaliação enviada com sucesso! Obrigada pelo seu feedback.</p>
        </div>
      )}

      {/* Reviews list */}
      <div className="mt-8 space-y-6">
        {reviews?.map((review) => (
          <div key={review.id} className="border-b border-stone-border/50 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Stars rating={review.rating} />
                <span className="text-[11px] text-stone">{formatDate(review.created_at)}</span>
              </div>
              {review.fit_feedback && (
                <span className="text-[10px] uppercase tracking-[0.12em] text-stone">
                  {FIT_OPTIONS.find((o) => o.value === review.fit_feedback)?.label}
                </span>
              )}
            </div>
            {review.comment && (
              <p className="mt-3 text-sm leading-relaxed text-ink/80">{review.comment}</p>
            )}
          </div>
        ))}
      </div>

      {/* Empty state with icon */}
      {!reviews || reviews.length === 0 ? (
        !showForm && (
          <div className="mt-8 flex flex-col items-center py-12 text-center">
            <MessageSquare className="h-10 w-10 text-stone-border" strokeWidth={1} />
            <p className="mt-4 text-sm text-stone">Nenhuma avaliação ainda. Compre e seja a primeira a avaliar!</p>
          </div>
        )
      ) : null}
    </div>
  );
}
