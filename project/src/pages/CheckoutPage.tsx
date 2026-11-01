import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useStoreSettings } from '@/hooks/useData';
import { useQuery } from '@tanstack/react-query';
import { formatBRL, effectivePrice, cn } from '@/lib/utils';
import { Loader2, Check, ChevronRight, MapPin, Truck, CreditCard, Package } from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5;

export function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useStoreSettings();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [address, setAddress] = useState({
    recipient_name: '',
    zip: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
    reference: '',
  });
  const [cep, setCep] = useState('');
  const [shipping, setShipping] = useState<{ price: number; method: string; days: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');

  const { data: savedAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('addresses').select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const lookupCep = async (cepValue: string) => {
    if (cepValue.length < 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepValue}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress((a) => ({ ...a, zip: cepValue, street: data.logradouro ?? a.street, district: data.bairro ?? a.district, city: data.localidade ?? a.city, state: data.uf ?? a.state }));
      }
    } catch { /* ignore */ }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data, error } = await supabase.rpc('validate_coupon', { p_code: couponCode, p_subtotal: subtotal });
    if (error) {
      setCouponMsg('Erro ao validar cupom.');
      return;
    }
    if (data && data.valid) {
      setDiscount(data.discount_amount);
      setCouponMsg(data.message);
    } else if (data) {
      setDiscount(0);
      setCouponMsg(data.message);
    }
  };

  const shippingTotal = shipping?.price ?? 0;
  const total = subtotal - discount + shippingTotal;

  const handleShippingCalc = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shipping-quote`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ zip: address.zip, subtotal, items }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setShipping({ price: settings?.default_shipping_price ?? 29.9, method: 'Standard', days: 5 });
        return;
      }
      const standard = data.options?.[0];
      if (standard) {
        setShipping({ price: standard.price, method: standard.method, days: standard.days });
      }
    } catch {
      const base = settings?.default_shipping_price ?? 29.9;
      const free = settings?.free_shipping_threshold;
      const isFree = free && subtotal >= free;
      setShipping({ price: isFree ? 0 : base, method: isFree ? 'Frete grátis' : 'Standard', days: 5 });
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) { navigate('/login', { state: { from: '/checkout' } }); return; }
    if (!address.recipient_name || !address.zip || !address.street || !address.number || !address.district || !address.city || !address.state) {
      setError('Preencha todos os campos obrigatórios do endereço.');
      setStep(2);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const itemsJson = items.map((i) => ({
        product_id: i.product_id,
        variant_id: i.variant_id ?? '',
        quantity: i.quantity,
        size: i.size ?? '',
        color: i.color ?? '',
      }));
      const { data, error: rpcError } = await supabase.rpc('place_order', {
        p_input: {
          items: itemsJson,
          address: { ...address },
          coupon_code: discount > 0 ? couponCode : '',
          shipping_price: shippingTotal,
          payment_method: paymentMethod,
          shipping_method: shipping?.method ?? 'Standard',
          estimated_days: shipping?.days ?? 5,
        },
      });
      if (rpcError) throw rpcError;
      const result = data as { order_number: string };
      await clear();
      navigate(`/pedido/confirmacao/${result.order_number}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      // Map known server messages to friendly Portuguese; default to generic
      if (msg.includes('Estoque insuficiente')) setError('Um dos itens não tem estoque suficiente. Revise sua sacola.');
      else if (msg.includes('Cupom')) setError('Houve um problema com o cupom. Verifique e tente novamente.');
      else if (msg.includes('não autenticado')) setError('Sua sessão expirou. Faça login novamente.');
      else if (msg.includes('Informe')) setError(msg);
      else setError('Não foi possível finalizar o pedido. Tente novamente.');
      console.error('place_order failed', err);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !loading) {
    return (
      <div className="container-lg py-20 text-center">
        <p className="font-serif text-2xl">Sua sacola está vazia</p>
        <Link to="/" className="mt-6 btn-primary">Explorar a loja</Link>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Identificação', icon: user ? Check : CreditCard },
    { num: 2, label: 'Endereço', icon: MapPin },
    { num: 3, label: 'Entrega', icon: Truck },
    { num: 4, label: 'Pagamento', icon: CreditCard },
    { num: 5, label: 'Revisão', icon: Package },
  ];

  return (
    <div className="container-lg py-8 lg:py-12">
      <h1 className="font-serif text-3xl lg:text-4xl">Checkout</h1>

      {/* Steps indicator */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {steps.map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={cn('flex items-center gap-2 border-b-2 pb-1 text-xs font-medium uppercase tracking-[0.12em] transition-colors', step >= s.num ? 'border-ink text-ink' : 'border-transparent text-stone')}>
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </div>
            {s.num < 5 && <ChevronRight className="h-3 w-3 text-stone" />}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Step 1: Identification */}
          {step === 1 && (
            <div className="border border-stone-border p-6">
              <h2 className="font-serif text-lg">Identificação</h2>
              {user ? (
                <div className="mt-4">
                  <p className="text-sm">Conectada como <span className="font-medium">{user.email}</span></p>
                  <button onClick={() => setStep(2)} className="mt-4 btn-primary">Continuar</button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-stone">Faça login ou cadastre-se para finalizar sua compra.</p>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/login" state={{ from: '/checkout' }} className="btn-primary">Entrar</Link>
                    <Link to="/cadastro" state={{ from: '/checkout' }} className="btn-outline">Cadastrar</Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <div className="border border-stone-border p-6">
              <h2 className="font-serif text-lg">Endereço de entrega</h2>
              {savedAddresses && savedAddresses.length > 0 && (
                <div className="mt-4 space-y-2">
                  {savedAddresses.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setAddress({
                          recipient_name: a.recipient_name,
                          zip: a.zip,
                          street: a.street,
                          number: a.number,
                          complement: a.complement ?? '',
                          district: a.district,
                          city: a.city,
                          state: a.state,
                          reference: a.reference ?? '',
                        });
                        setStep(3);
                      }}
                      className="block w-full border border-stone-border p-3 text-left text-sm hover:border-ink"
                    >
                      {a.recipient_name} — {a.street}, {a.number}, {a.city}/{a.state}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label-field">Destinatário</label>
                  <input type="text" required value={address.recipient_name} onChange={(e) => setAddress({ ...address, recipient_name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">CEP</label>
                  <input type="text" required value={cep || address.zip} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 8); setCep(v); setAddress({ ...address, zip: v }); }} onBlur={() => lookupCep(cep || address.zip)} className="input-field" maxLength={8} />
                </div>
                <div>
                  <label className="label-field">Número</label>
                  <input type="text" required value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} className="input-field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-field">Rua</label>
                  <input type="text" required value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Complemento</label>
                  <input type="text" value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Bairro</label>
                  <input type="text" required value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Cidade</label>
                  <input type="text" required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Estado</label>
                  <input type="text" required maxLength={2} value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })} className="input-field" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  disabled={!address.recipient_name || !address.zip || !address.street || !address.number || !address.district || !address.city || !address.state}
                  className="btn-primary"
                >
                  Continuar
                </button>
                <button onClick={() => setStep(1)} className="btn-ghost">Voltar</button>
              </div>
            </div>
          )}

          {/* Step 3: Shipping */}
          {step === 3 && (
            <div className="border border-stone-border p-6">
              <h2 className="font-serif text-lg">Forma de entrega</h2>
              <div className="mt-4">
                <button onClick={handleShippingCalc} className="btn-outline">Calcular frete</button>
              </div>
              {shipping && (
                <div className="mt-4 border border-stone-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{shipping.method}</p>
                      <p className="text-xs text-stone">Prazo: {shipping.days} dias úteis</p>
                    </div>
                    <span className="text-sm">{shipping.price === 0 ? 'Grátis' : formatBRL(shipping.price)}</span>
                  </div>
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep(4)} disabled={!shipping} className="btn-primary">Continuar</button>
                <button onClick={() => setStep(2)} className="btn-ghost">Voltar</button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="border border-stone-border p-6">
              <h2 className="font-serif text-lg">Forma de pagamento</h2>
              <p className="mt-2 text-xs text-stone">A cobrança será gerada após a confirmação do pedido. As credenciais do gateway de pagamento precisam ser configuradas.</p>
              <div className="mt-4 space-y-3">
                {[
                  { value: 'pix', label: 'PIX', desc: 'Aprovação imediata após pagamento' },
                  { value: 'credit_card', label: 'Cartão de crédito', desc: 'Parcele em até 6x' },
                  { value: 'boleto', label: 'Boleto bancário', desc: 'Vencimento em 3 dias' },
                ].map((m) => (
                  <label key={m.value} className={cn('flex cursor-pointer items-start gap-3 border p-4 transition-colors', paymentMethod === m.value ? 'border-ink' : 'border-stone-border hover:border-stone')}>
                    <input type="radio" name="payment" value={m.value} checked={paymentMethod === m.value} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 accent-ink" />
                    <div>
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-xs text-stone">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep(5)} className="btn-primary">Continuar</button>
                <button onClick={() => setStep(3)} className="btn-ghost">Voltar</button>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="border border-stone-border p-6">
              <h2 className="font-serif text-lg">Revisão do pedido</h2>
              <div className="mt-4 space-y-4">
                <div className="border-b border-stone-border pb-4">
                  <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-stone">Itens</h3>
                  {items.map((i) => (
                    <div key={i.id} className="mt-2 flex justify-between text-sm">
                      <span>{i.product?.name} {[i.color, i.size].filter(Boolean).join(' · ')} ×{i.quantity}</span>
                      <span>{formatBRL(i.unit_price * i.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-b border-stone-border pb-4">
                  <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-stone">Endereço</h3>
                  <p className="mt-1 text-sm">{address.recipient_name}</p>
                  <p className="text-xs text-stone">{address.street}, {address.number} — {address.city}/{address.state}</p>
                </div>
                <div className="border-b border-stone-border pb-4">
                  <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-stone">Pagamento</h3>
                  <p className="mt-1 text-sm capitalize">{paymentMethod.replace('_', ' ')}</p>
                </div>
                {error && <div className="border border-ink/20 bg-ink/5 p-3 text-sm text-ink">{error}</div>}
                <div className="flex gap-3">
                  <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary flex-1">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar pedido'}
                  </button>
                  <button onClick={() => setStep(4)} className="btn-ghost">Voltar</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="border border-stone-border p-6">
            <h2 className="font-serif text-lg">Resumo</h2>
            <div className="mt-4 space-y-3 text-sm">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span className="text-stone">{i.product?.name} ×{i.quantity}</span>
                  <span>{formatBRL(i.unit_price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-stone-border pt-4">
              <div className="flex gap-2">
                <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Cupom" className="input-field flex-1 py-2 text-xs" />
                <button onClick={handleApplyCoupon} className="btn-light py-2 text-xs">Aplicar</button>
              </div>
              {couponMsg && <p className="mt-2 text-xs text-stone">{couponMsg}</p>}
            </div>
            <div className="mt-4 space-y-2 border-t border-stone-border pt-4 text-sm">
              <div className="flex justify-between"><span className="text-stone">Subtotal</span><span>{formatBRL(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between"><span className="text-stone">Desconto</span><span>-{formatBRL(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-stone">Frete</span><span>{shippingTotal ? formatBRL(shippingTotal) : '—'}</span></div>
              <div className="flex justify-between border-t border-stone-border pt-2"><span className="font-medium">Total</span><span className="font-serif text-xl">{formatBRL(total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
