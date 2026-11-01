/*
# TALYTA AMARAL — Funções RPC (parte 3)

## Resumo
- `validate_coupon(p_code, p_subtotal)` — valida cupom publicamente.
- `place_order(p_input jsonb)` — cria pedido atômico, decrementa estoque com FOR UPDATE, aplica cupom.
- `get_cart_id(p_user_id, p_cart_token)` — obtém/cria carrinho.
- `admin_dashboard_stats()` — estatísticas do painel admin.

## Segurança
- `validate_coupon`: anon + authenticated.
- `place_order`: SECURITY DEFINER, authenticated. SELECT FOR UPDATE evita overselling.
- `get_cart_id`: SECURITY DEFINER, anon + authenticated.
- `admin_dashboard_stats`: SECURITY DEFINER, authenticated (valida is_admin).
*/

-- ============ validate_coupon ============
create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns table(
  valid boolean,
  discount_amount numeric,
  message text,
  coupon_id uuid,
  code text,
  discount_type text,
  discount_value numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  v_discount numeric;
begin
  if p_code is null or p_code = '' then
    return query select false, 0::numeric, 'Informe um cupom.', null::uuid, '', '', 0::numeric;
    return;
  end if;

  select * into c from public.coupons where upper(code) = upper(p_code) and active = true limit 1;

  if not found then
    return query select false, 0::numeric, 'Cupom inválido ou inativo.', null::uuid, '', '', 0::numeric;
    return;
  end if;

  if c.starts_at is not null and now() < c.starts_at then
    return query select false, 0::numeric, 'Cupom ainda não está disponível.', null::uuid, '', '', 0::numeric;
    return;
  end if;

  if c.ends_at is not null and now() > c.ends_at then
    return query select false, 0::numeric, 'Cupom expirado.', null::uuid, '', '', 0::numeric;
    return;
  end if;

  if c.max_uses is not null and c.used_count >= c.max_uses then
    return query select false, 0::numeric, 'Cupom esgotado.', null::uuid, '', '', 0::numeric;
    return;
  end if;

  if p_subtotal < coalesce(c.min_order_value, 0) then
    return query select false, 0::numeric, 'Valor mínimo do pedido não atingido.', null::uuid, '', '', 0::numeric;
    return;
  end if;

  if c.discount_type = 'percentage' then
    v_discount := round((p_subtotal * c.discount_value / 100)::numeric, 2);
  else
    v_discount := c.discount_value;
  end if;

  if v_discount > p_subtotal then
    v_discount := p_subtotal;
  end if;

  return query select true, v_discount, 'Cupom aplicado.', c.id, c.code, c.discount_type, c.discount_value;
end;
$$;

revoke execute on function public.validate_coupon(text, numeric) from public, anon;
grant execute on function public.validate_coupon(text, numeric) to anon, authenticated;

-- ============ place_order ============
create or replace function public.place_order(p_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_seq int;
  v_user uuid := auth.uid();
  v_items jsonb := p_input -> 'items';
  v_address jsonb := p_input -> 'address';
  v_coupon_code text := coalesce(p_input ->> 'coupon_code', null);
  v_shipping numeric := coalesce((p_input ->> 'shipping_price')::numeric, 0);
  v_payment_method text := coalesce(p_input ->> 'payment_method', 'pix');
  v_shipping_method text := coalesce(p_input ->> 'shipping_method', 'Standard');
  v_estimated_days int := coalesce((p_input ->> 'estimated_days')::int, null);
  v_notes text := coalesce(p_input ->> 'notes', null);
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_total numeric := 0;
  v_coupon record;
  v_item jsonb;
  v_product record;
  v_variant record;
  v_unit_price numeric;
  v_line_total numeric;
  v_qty int;
  v_size text;
  v_color text;
  v_product_id uuid;
  v_variant_id uuid;
  v_user_uses int;
begin
  if v_user is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if jsonb_array_length(v_items) = 0 then
    raise exception 'Carrinho vazio.';
  end if;

  v_subtotal := 0;
  for v_item in select jsonb_array_elements(v_items) loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_variant_id := coalesce(nullif(v_item ->> 'variant_id','')::uuid, null);
    v_qty := (v_item ->> 'quantity')::int;
    v_size := v_item ->> 'size';
    v_color := v_item ->> 'color';

    if v_qty <= 0 then
      raise exception 'Quantidade inválida.';
    end if;

    select * into v_product from public.products where id = v_product_id and published = true;
    if not found then
      raise exception 'Produto não disponível: %', v_product_id;
    end if;

    if v_product.sale_price is not null and v_product.sale_price < v_product.price then
      v_unit_price := v_product.sale_price;
    else
      v_unit_price := v_product.price;
    end if;

    if v_variant_id is not null then
      select * into v_variant from public.product_variants
      where id = v_variant_id and product_id = v_product_id for update;
      if not found then
        raise exception 'Variação não encontrada.';
      end if;
      if v_variant.stock < v_qty then
        raise exception 'Estoque insuficiente para % (%/%)', v_product.name, coalesce(v_size,''), coalesce(v_color,'');
      end if;
    end if;

    v_line_total := round(v_unit_price * v_qty, 2);
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  if v_coupon_code is not null and v_coupon_code <> '' then
    select * into v_coupon from public.coupons where upper(code) = upper(v_coupon_code) and active = true;
    if not found then
      raise exception 'Cupom inválido.';
    end if;
    if v_coupon.ends_at is not null and now() > v_coupon.ends_at then
      raise exception 'Cupom expirado.';
    end if;
    if v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then
      raise exception 'Cupom esgotado.';
    end if;
    if v_subtotal < coalesce(v_coupon.min_order_value, 0) then
      raise exception 'Valor mínimo do cupom não atingido.';
    end if;

    select count(*) into v_user_uses from public.coupon_redemptions cr
    where cr.coupon_id = v_coupon.id and cr.user_id = v_user;
    if v_user_uses >= coalesce(v_coupon.max_uses_per_customer, 1) then
      raise exception 'Limite de uso do cupom atingido.';
    end if;

    if v_coupon.discount_type = 'percentage' then
      v_discount := round((v_subtotal * v_coupon.discount_value / 100)::numeric, 2);
    else
      v_discount := v_coupon.discount_value;
    end if;
    if v_discount > v_subtotal then
      v_discount := v_subtotal;
    end if;
  end if;

  v_total := round(v_subtotal - v_discount + v_shipping, 2);

  select coalesce(max(seq), 0) + 1 into v_seq from (
    select (split_part(order_number,'-',3))::int as seq
    from public.orders where order_number like 'TA-' || extract(year from now()) || '-%'
  ) s;
  v_order_number := 'TA-' || extract(year from now()) || '-' || lpad(v_seq::text, 6, '0');

  insert into public.orders (
    order_number, user_id, status, subtotal, discount, shipping_price, total,
    coupon_code, recipient_name, zip, street, number, complement, district, city, state, reference,
    payment_method, payment_status, shipping_method, estimated_days, notes
  ) values (
    v_order_number, v_user, 'awaiting_payment', v_subtotal, v_discount, v_shipping, v_total,
    v_coupon_code,
    v_address ->> 'recipient_name', v_address ->> 'zip', v_address ->> 'street',
    v_address ->> 'number', v_address ->> 'complement', v_address ->> 'district',
    v_address ->> 'city', v_address ->> 'state', v_address ->> 'reference',
    v_payment_method, 'pending', v_shipping_method, v_estimated_days, v_notes
  ) returning id into v_order_id;

  for v_item in select jsonb_array_elements(v_items) loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_variant_id := coalesce(nullif(v_item ->> 'variant_id','')::uuid, null);
    v_qty := (v_item ->> 'quantity')::int;
    v_size := v_item ->> 'size';
    v_color := v_item ->> 'color';

    select name, price, sale_price into v_product from public.products where id = v_product_id;
    if v_product.sale_price is not null and v_product.sale_price < v_product.price then
      v_unit_price := v_product.sale_price;
    else
      v_unit_price := v_product.price;
    end if;

    insert into public.order_items (order_id, product_id, product_name, variant_id, size, color, quantity, unit_price)
    values (v_order_id, v_product_id, v_product.name, v_variant_id, v_size, v_color, v_qty, v_unit_price);

    if v_variant_id is not null then
      update public.product_variants set stock = stock - v_qty where id = v_variant_id;
    end if;
  end loop;

  if v_coupon_code is not null and v_discount > 0 then
    update public.coupons set used_count = used_count + 1 where id = v_coupon.id;
    insert into public.coupon_redemptions (coupon_id, order_id, user_id)
    values (v_coupon.id, v_order_id, v_user);
  end if;

  insert into public.order_status_history (order_id, status, note, created_by)
  values (v_order_id, 'awaiting_payment', 'Pedido criado', v_user);

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_total
  );
end;
$$;

revoke execute on function public.place_order(jsonb) from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;

-- ============ get_cart_id ============
create or replace function public.get_cart_id(p_user_id uuid, p_cart_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_cart_id uuid;
begin
  if p_user_id is not null then
    select id into v_cart_id from public.carts where user_id = p_user_id and status = 'active' limit 1;
    if v_cart_id is null then
      insert into public.carts (user_id, status) values (p_user_id, 'active') returning id into v_cart_id;
    end if;
  elsif p_cart_token is not null then
    select id into v_cart_id from public.carts where cart_token = p_cart_token and status = 'active' limit 1;
    if v_cart_id is null then
      insert into public.carts (cart_token, status) values (p_cart_token, 'active') returning id into v_cart_id;
    end if;
  end if;
  return v_cart_id;
end;
$$;

revoke execute on function public.get_cart_id(uuid, uuid) from public, anon;
grant execute on function public.get_cart_id(uuid, uuid) to anon, authenticated;

-- ============ admin_dashboard_stats ============
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_revenue numeric;
  v_today_revenue numeric;
  v_month_revenue numeric;
  v_order_count int;
  v_pending int;
  v_paid int;
  v_shipped int;
  v_cancelled int;
  v_avg_ticket numeric;
  v_new_customers int;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado.';
  end if;

  select coalesce(sum(total),0) into v_total_revenue from public.orders where status in ('paid','preparing','awaiting_pickup','shipped','in_transit','delivered');
  select coalesce(sum(total),0) into v_today_revenue from public.orders where status in ('paid','preparing','awaiting_pickup','shipped','in_transit','delivered') and created_at::date = now()::date;
  select coalesce(sum(total),0) into v_month_revenue from public.orders where status in ('paid','preparing','awaiting_pickup','shipped','in_transit','delivered') and date_trunc('month', created_at) = date_trunc('month', now());
  select count(*) into v_order_count from public.orders;
  select count(*) into v_pending from public.orders where status = 'awaiting_payment';
  select count(*) into v_paid from public.orders where status in ('paid','preparing');
  select count(*) into v_shipped from public.orders where status in ('shipped','in_transit');
  select count(*) into v_cancelled from public.orders where status = 'cancelled';
  select coalesce(avg(total),0) into v_avg_ticket from public.orders where status in ('paid','preparing','awaiting_pickup','shipped','in_transit','delivered');
  select count(*) into v_new_customers from auth.users where created_at::date >= (now() - interval '30 days')::date;

  return jsonb_build_object(
    'total_revenue', v_total_revenue,
    'today_revenue', v_today_revenue,
    'month_revenue', v_month_revenue,
    'order_count', v_order_count,
    'pending', v_pending,
    'paid', v_paid,
    'shipped', v_shipped,
    'cancelled', v_cancelled,
    'avg_ticket', round(v_avg_ticket, 2),
    'new_customers', v_new_customers
  );
end;
$$;

revoke execute on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
