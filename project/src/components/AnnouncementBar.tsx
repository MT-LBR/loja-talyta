import { useStoreSettings } from '@/hooks/useData';
import { cn } from '@/lib/utils';

export function AnnouncementBar() {
  const { data: settings } = useStoreSettings();

  if (!settings?.announcement_active) return null;

  const messages: string[] = [];
  if (settings.announcement_text) {
    settings.announcement_text.split('·').map((s) => s.trim()).filter(Boolean).forEach((s) => messages.push(s));
  }
  if (settings.free_shipping_threshold && settings.free_shipping_threshold > 0) {
    messages.push(`Frete grátis em compras acima de R$ ${settings.free_shipping_threshold.toFixed(2).replace('.', ',')}`);
  }

  if (messages.length === 0) return null;

  return (
    <div className="bg-ink py-2.5 text-center">
      <div className="overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...messages, ...messages, ...messages, ...messages].map((item, i) => (
            <span
              key={i}
              className={cn(
                'mx-10 inline-flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.24em] text-pearl/85',
              )}
            >
              <span className="h-1 w-1 rounded-full bg-nude" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
