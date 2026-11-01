import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
  { q: 'Como faço para acompanhar meu pedido?', a: 'Após o login, acesse "Meus pedidos" na sua conta. Você verá o status atual e o histórico de cada pedido, incluindo o código de rastreio quando disponível.' },
  { q: 'Quais são as formas de pagamento?', a: 'Aceitamos PIX, cartão de crédito (em até 6x sem juros) e boleto bancário. A cobrança é processada após a confirmação do pedido.' },
  { q: 'Como é calculado o frete?', a: 'O frete é calculado com base no CEP de destino, peso e dimensões do produto. O valor e prazo são exibidos na página do produto e no checkout.' },
  { q: 'Qual o prazo de entrega?', a: 'O prazo varia conforme a região e a transportadora. Geralmente, de 3 a 10 dias úteis após a confirmação do pagamento.' },
  { q: 'Posso trocar ou devolver um produto?', a: 'Sim. Você tem até 7 dias após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor. Acesse "Trocas e devoluções" para mais detalhes.' },
  { q: 'Como faço para trocar de tamanho?', a: 'Entre em contato via WhatsApp ou e-mail informando o número do pedido e o tamanho desejado. Enviaremos as instruções de envio da peça original.' },
  { q: 'Vocês entregam para todo o Brasil?', a: 'Sim, entregamos para todo o território nacional. O frete é calculado automaticamente no checkout.' },
  { q: 'Como funciona o frete grátis?', a: 'Para compras que atingam o valor mínimo configurado pela loja, o frete é gratuito. O valor é exibido na faixa de anúncio no topo da página.' },
];

export function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      <PageHeader title="Perguntas frequentes" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'FAQ' }]} />
      <div className="container-lg py-12 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-stone-border">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <span className="font-serif text-base lg:text-lg">{faq.q}</span>
                  <ChevronDown className={cn('h-5 w-5 flex-shrink-0 text-stone transition-transform', open === i && 'rotate-180')} />
                </button>
                <div className={cn('overflow-hidden transition-all duration-300', open === i ? 'max-h-60' : 'max-h-0')}>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-stone">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
