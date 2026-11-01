import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowRight, Shield, Truck, CreditCard, RefreshCw, Headphones } from 'lucide-react';
import { useBanners, useCategories, useProducts, useStoreSettings } from '@/hooks/useData';
import { ProductCard } from '@/components/ProductCard';
import { cn } from '@/lib/utils';

export function HomePage() {
  const { data: settings } = useStoreSettings();
  const { data: heroBanners } = useBanners('hero');
  const { data: secondaryBanners } = useBanners('secondary');
  const { data: categories } = useCategories();
  const { data: newProducts } = useProducts({ isNew: true, sort: 'newest', limit: 8 });
  const { data: bestsellers } = useProducts({ isBestseller: true, limit: 4 });
  const { data: featured } = useProducts({ isFeatured: true, limit: 3 });

  const [activeSlide, setActiveSlide] = useState(0);
  const slides = heroBanners ?? [];

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setActiveSlide((s) => (s + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [slides.length]);

  const benefits = [
    { icon: Shield, title: 'Compra segura', desc: 'Ambiente protegido e criptografado' },
    { icon: CreditCard, title: 'Pagamento facilitado', desc: 'PIX, cartão e boleto' },
    { icon: Truck, title: 'Entrega nacional', desc: 'Para todo o Brasil' },
    { icon: RefreshCw, title: 'Trocas fáceis', desc: 'Conforme nossa política' },
    { icon: Headphones, title: 'Atendimento', desc: 'Especializado e próximo' },
  ];

  return (
    <div>
      {/* Hero carousel */}
      {slides.length > 0 && (
        <section className="relative h-[75vh] min-h-[520px] w-full overflow-hidden bg-ink lg:h-[90vh]">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={cn(
                'absolute inset-0 transition-all duration-[1200ms] ease-editorial',
                i === activeSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none',
              )}
            >
              <img
                src={slide.image_url}
                alt={slide.title}
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/30 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="container-lg">
                  <div className="max-w-xl text-pearl">
                    {i === activeSlide && (
                      <>
                        <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-pearl/70 animate-fade-up" style={{ animationDelay: '0.15s' }}>
                          TALYTA AMARAL
                        </p>
                        <h2 className="font-serif text-4xl leading-[1.08] text-balance lg:text-6xl animate-fade-up" style={{ animationDelay: '0.25s' }}>
                          {slide.title}
                        </h2>
                        {slide.subtitle && (
                          <p className="mt-5 max-w-md text-base font-light leading-relaxed text-pearl/85 lg:text-lg animate-fade-up" style={{ animationDelay: '0.4s' }}>
                            {slide.subtitle}
                          </p>
                        )}
                        {slide.cta_text && slide.cta_link && (
                          <Link
                            to={slide.cta_link}
                            className="mt-10 inline-flex items-center gap-3 border border-pearl px-10 py-4 text-[11px] font-medium uppercase tracking-[0.2em] text-pearl transition-all duration-500 ease-editorial hover:bg-pearl hover:text-ink animate-fade-up"
                            style={{ animationDelay: '0.55s' }}
                          >
                            {slide.cta_text}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Slide indicators */}
          {slides.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={cn(
                    'h-px transition-all duration-500 ease-editorial',
                    i === activeSlide ? 'w-12 bg-pearl' : 'w-6 bg-pearl/30 hover:bg-pearl/50',
                  )}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
          {/* Scroll hint */}
          <div className="absolute bottom-8 right-8 hidden lg:block">
            <div className="flex flex-col items-center gap-2 text-pearl/50">
              <span className="text-[9px] uppercase tracking-[0.3em] [writing-mode:vertical-rl]">Scroll</span>
              <div className="h-12 w-px bg-gradient-to-b from-pearl/40 to-transparent" />
            </div>
          </div>
        </section>
      )}

      {/* Categories — editorial grid */}
      {categories && categories.length > 0 && (
        <section className="section-pad">
          <div className="container-lg">
            <div className="mb-12 text-center">
              <p className="eyebrow">Explore</p>
              <div className="editorial-divider mt-4" />
              <h2 className="mt-4 font-serif text-3xl lg:text-5xl">Categorias</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-5">
              {categories.slice(0, 10).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/catalogo/${cat.slug}`}
                  className="group relative aspect-[3/4] overflow-hidden bg-sand"
                >
                  {cat.image_url && (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-editorial group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/10 to-transparent transition-all duration-500 group-hover:from-ink/60 group-hover:via-ink/20" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-5 text-center">
                    <h3 className="font-serif text-lg text-pearl lg:text-xl transition-transform duration-500 ease-editorial group-hover:-translate-y-1">{cat.name}</h3>
                    <span className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-pearl/70 opacity-0 transition-all duration-500 ease-editorial group-hover:opacity-100">
                      Ver coleção <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New collection */}
      <section className="section-pad bg-pearl-warm">
        <div className="container-lg">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="eyebrow">Recém-chegadas</p>
              <div className="editorial-divider mt-4 !ml-0" />
              <h2 className="mt-4 font-serif text-3xl lg:text-5xl">Nova coleção</h2>
            </div>
            <Link to="/novidades" className="hidden items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-ink link-underline sm:flex">
              Ver tudo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {(newProducts ?? []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-10 text-center sm:hidden">
            <Link to="/novidades" className="btn-outline">Ver tudo</Link>
          </div>
        </div>
      </section>

      {/* Secondary banner — full bleed editorial */}
      {secondaryBanners && secondaryBanners.length > 0 && (
        <section className="relative h-[45vh] min-h-[340px] overflow-hidden bg-ink">
          {secondaryBanners.map((banner) => (
            <Link key={banner.id} to={banner.cta_link ?? '/'} className="group block h-full w-full">
              <img src={banner.image_url} alt={banner.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-editorial group-hover:scale-105" />
              <div className="absolute inset-0 bg-ink/45 transition-opacity duration-500 group-hover:bg-ink/55" />
              <div className="relative flex h-full items-center justify-center text-center">
                <div className="text-pearl px-6">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-pearl/60">Editorial</p>
                  <h2 className="mt-4 font-serif text-3xl lg:text-5xl">{banner.title}</h2>
                  {banner.subtitle && <p className="mt-3 max-w-md mx-auto text-sm font-light text-pearl/80 lg:text-base">{banner.subtitle}</p>}
                  {banner.cta_text && (
                    <span className="mt-8 inline-flex items-center gap-3 border border-pearl px-10 py-4 text-[11px] font-medium uppercase tracking-[0.2em] transition-all duration-500 ease-editorial hover:bg-pearl hover:text-ink">
                      {banner.cta_text} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Bestsellers */}
      {(bestsellers ?? []).length > 0 && (
        <section className="section-pad">
          <div className="container-lg">
            <div className="mb-12 text-center">
              <p className="eyebrow">Preferidas das clientes</p>
              <div className="editorial-divider mt-4" />
              <h2 className="mt-4 font-serif text-3xl lg:text-5xl">Mais vendidas</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
              {(bestsellers ?? []).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Special selection — dark editorial */}
      {(featured ?? []).length > 0 && (
        <section className="section-pad bg-ink text-pearl grain">
          <div className="container-lg relative z-10">
            <div className="mb-12 text-center">
              <p className="text-[11px] uppercase tracking-[0.3em] text-nude">Curadoria</p>
              <div className="mx-auto mt-4 h-px w-12 bg-nude/60" />
              <h2 className="mt-4 font-serif text-3xl lg:text-5xl">Seleção especial</h2>
              <p className="mx-auto mt-4 max-w-md text-sm font-light leading-relaxed text-pearl/60">
                Peças escolhidas pessoalmente pela proprietária para você.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {(featured ?? []).map((p) => (
                <Link key={p.id} to={`/produto/${p.slug}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-ink-soft">
                    {p.product_images?.[0]?.url && (
                      <img
                        src={p.product_images[0].url}
                        alt={p.name}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-all duration-[900ms] ease-editorial group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>
                  <div className="pt-5">
                    <h3 className="font-serif text-xl transition-colors duration-300 group-hover:text-nude">{p.name}</h3>
                    {p.short_description && <p className="mt-1.5 text-sm font-light text-pearl/50">{p.short_description}</p>}
                    <span className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-pearl/60 transition-colors group-hover:text-nude">
                      Descobrir <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits — refined strip */}
      <section className="border-y border-stone-border bg-pearl-pure">
        <div className="container-lg py-12 lg:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
            {benefits.map((b, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                  <b.icon className="h-6 w-6 text-clay" strokeWidth={1.2} />
                  <h3 className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-ink">{b.title}</h3>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-stone">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About teaser — editorial quote */}
      {settings?.about_text && (
        <section className="section-pad bg-pearl-warm">
          <div className="container-lg">
            <div className="mx-auto max-w-3xl text-center">
              <p className="eyebrow">A marca</p>
              <div className="editorial-divider mt-4" />
              <h2 className="mt-4 font-serif text-3xl lg:text-5xl">Nossa essência</h2>
              <p className="mt-6 text-sm font-light leading-relaxed text-ink/70 lg:text-base lg:leading-loose">{settings.about_text}</p>
              <Link to="/sobre" className="mt-10 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink link-underline">
                Conheça nossa história <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
