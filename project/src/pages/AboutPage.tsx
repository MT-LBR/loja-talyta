import { useStoreSettings } from '@/hooks/useData';
import { PageHeader } from '@/components/PageHeader';

export function AboutPage() {
  const { data: settings } = useStoreSettings();
  return (
    <div>
      <PageHeader title="Sobre a marca" breadcrumb={[{ label: 'Início', to: '/' }, { label: 'Sobre' }]} />
      <div className="container-lg py-12 lg:py-16">
        <div className="mx-auto max-w-3xl">
          {settings?.hero_image && (
            <div className="mb-10 aspect-[16/9] overflow-hidden bg-stone-light">
              <img src={settings.hero_image} alt="TALYTA AMARAL" className="h-full w-full object-cover" />
            </div>
          )}
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone">Nossa essência</p>
          <h2 className="mt-3 font-serif text-3xl lg:text-4xl">A história da TALYTA AMARAL</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/80 lg:text-base">
            <p>{settings?.about_text ?? 'A TALYTA AMARAL nasce da vontade de vestir mulheres que enxergam na moda uma forma de expressão.'}</p>
            <p>
              Cada peça é pensada para valorizar a silhueta feminina, com tecidos cuidadosamente selecionados
              e modelagens que transitam entre o casual e o sofisticado. Acreditamos em moda atemporal —
              peças que permanecem relevantes sazão após sazão.
            </p>
            <p>
              Nossa boutique digital foi criada para oferecer uma experiência de compra elegante e segura,
              com atendimento próximo e dedicado a cada cliente. Da escolha da peça à entrega na sua porta,
              cada detalhe é planejado com cuidado.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="border border-stone-border p-5 text-center">
              <p className="font-serif text-2xl">100%</p>
              <p className="mt-1 text-xs text-stone">Peças selecionadas a dedo</p>
            </div>
            <div className="border border-stone-border p-5 text-center">
              <p className="font-serif text-2xl">Atemporal</p>
              <p className="mt-1 text-xs text-stone">Moda que transcendestações</p>
            </div>
            <div className="border border-stone-border p-5 text-center">
              <p className="font-serif text-2xl">Nacional</p>
              <p className="mt-1 text-xs text-stone">Entrega em todo o Brasil</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
