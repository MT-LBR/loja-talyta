import { useStoreSettings } from '@/hooks/useData';
import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const { data: settings } = useStoreSettings();
  if (!settings?.whatsapp) return null;
  const message = encodeURIComponent('Olá! Gostaria de tirar uma dúvida sobre um produto da TALYTA AMARAL.');
  const href = `https://wa.me/${settings.whatsapp}?text=${message}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Fale no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-pearl shadow-lift transition-transform duration-300 hover:scale-110"
    >
      <MessageCircle className="h-5 w-5" />
    </a>
  );
}
