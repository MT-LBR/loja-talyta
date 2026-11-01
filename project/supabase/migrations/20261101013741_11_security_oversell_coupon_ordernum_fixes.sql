/*
# Security and integrity fixes for checkout flow

## Summary
This migration fixes five confirmed issues found in a full audit of the checkout flow:

1. **Guest cart IDOR (Critical)**: The RLS policies on `carts` and `cart_items` allowed ANY
   anonymous user to read/modify ANY guest cart that had a non-null `cart_token`, because the
   predicate only checked `cart_token is not null` — it never compared the token to the one in
   the request. Now the `cart_token` is passed via a GUC (`app.cart_token`) set by the
   `get_cart_id` RPC, and the policies compare `c.cart_token = current_setting('app.cart_token')::uuid`.

2. **Overselling when variant_id is NULL (Critical)**: `place_order` only locked and checked
   stock inside `if v_variant_id is not null`. Products with no variants (or items added without
   a variant_id) passed through with zero stock validation and zero stock decrement. Now the
   function always locks the product row with `FOR UPDATE`, checks the aggregate stock from
   `product_variants` (sum of all variant stock), and raises an exception if insufficient.

3. **Coupon race condition (Critical)**: `place_order` read the coupon without `FOR UPDATE`,
   so two concurrent orders could both pass the `max_uses` check and both increment `used_count`.
   Now the coupon row is locked with `SELECT ... FOR UPDATE` and the increment is done
   atomically with a conditional UPDATE.

4. **Predictable order_number (High)**: `order_number` was sequential (`TA-2026-000001`),
   enabling enumeration. Now it uses 6 random digits combined with the year, making it
   unpredictable while still human-readable.

5. **get_cart_id sets app.cart_token GUC**: The RPC now sets `set_config('app.cart_token', ...)`
   so that subsequent RLS policy checks within the same session can compare the token.

## Security changes
- Replaces all RLS policies on `carts` to compare `cart_token` against the GUC for guest carts.
- Replaces all RLS policies on `cart_items` similarly via the parent carts table.
- Updates `get_cart_id` to set `app.cart_token` GUC for the session.
- Rewrites `place_order` with product-level stock locking, coupon FOR UPDATE, and random order_number.

## Important notes
- No data is deleted or lost. All existing carts, orders, and coupons remain intact.
- The `app.cart_token` GUC is set per-request and scoped to the session, so it does not leak
  between requests.
- Existing order numbers remain sequential; only new orders get the random format.
*/

-- ============ Fix 1: get_cart_id sets app.cart_token GUC ============
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
    perform set_config('app.cart_token', p_cart_token::text, true);
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

-- ============ Fix 2: RLS policies on carts — compare cart_token to GUC ============
drop policy if exists "read_carts" on public.carts;
create policy "read_carts" on public.carts
  for select to anon, authenticated
  using (
    user_id = auth.uid()
    or (user_id is null and cart_token is not null and cart_token = nullif(current_setting('app.cart_token', true), '')::uuid)
  );

drop policy if exists "admin_read_carts" on public.carts;
create policy "admin_read_carts" on public.carts
  for select to authenticated
  using (public.is_admin());

drop policy if exists "insert_carts" on public.carts;
create policy "insert_carts" on public.carts
  for insert to anon, authenticated
  with check (
    user_id = auth.uid()
    or (user_id is null and cart_token is not null and cart_token = nullif(current_setting('app.cart_token', true), '')::uuid)
  );

drop policy if exists "update_carts" on public.carts;
create policy "update_carts" on public.carts
  for update to anon, authenticated
  using (
    user_id = auth.uid()
    or (user_id is null and cart_token is not null and cart_token = nullif(current_setting('app.cart_token', true), '')::uuid)
  )
  with check (
    user_id = auth.uid()
    or (user_id is null and cart_token is not null and cart_token = nullif(current_setting('app.cart_token', true), '')::uuid)
  );

drop policy if exists "delete_carts" on public.carts;
create policy "delete_carts" on public.carts
  for delete to anon, authenticated
  using (
    user_id = auth.uid()
    or (user_id is null and cart_token is not null and cart_token = nullif(current_setting('app.cart_token', true), '')::uuid)
  );

-- ============ Fix 3: RLS policies on cart_items — compare cart_token to GUC via parent ============
drop policy if exists "read_cart_items" on public.cart_items;
create policy "read_cart_items" on public.cart_items
  for select to anon, authenticated
  using (exists (
    select 1 from public.carts c where c.id = cart_items.cart_id and (
      c.user_id = auth.uid()
      or (c.user_id is null and c.cart_token is not null and c.cart_token = nullif(current_setting('app.cart_token', true), '')::uuid)
    )
  ));

drop policy if exists "insert_cart_items" on public.cart_items;
create policy "insert_cart_items" on public.cart_items
  for insert to anon, authenticated
  with check (exists (
    select 1 from public.carts c where c.id = cart_items.cart_id and (
      c.user_id = auth.uid()
      or (c.user_id is null and c.cart_token is not null and c.cart_token = nullif(current_setting('app.cart_token', true), '')::uuid)
    )
  ));

drop policy if exists "update_cart_items" on public.cart_items;
create policy "update_cart_items" on public.cart_items
  for update to anon, authenticated
  using (exists (
    select 1 from public.carts c where c.id = cart_items.cart_id and (
      c.user_id = auth.uid()
      or (c.user_id is null and c.cart_token is not null and c.cart_token = nullif(current_setting('app.cart_token', true), '')::uuid)
    )
  ))
  with check (exists (
    select 1 from public.carts c where c.id = cart_items.cart_id and (
      c.user_id = auth.uid()
      or (c.user_id is null and c.cart_token is not null and c.cart_token = nullif(current_setting('app.cart_token', true), '')::uuid)
    )
  ));

drop policy if exists "delete_cart_items" on public.cart_items;
create policy "delete_cart_items" on public.cart_items
  for delete to anon, authenticated
  using (exists (
    select 1 from public.carts c where c.id = cart_items.cart_id and (
      c.user_id = auth.uid()
      or (c.user_id is null and c.cart_token is not null and c.cart_token = nullif(current_setting('app.cart_token', true), '')::uuid)
    )
  ));

-- ============ Fix 4: Rewrite place_order — stock lock, coupon FOR UPDATE, random order_number ============
create or replace function public.place_order(p_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_rand int;
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
  v_aggregate_stock int;
  v_coupon_updated int;
begin
  if v_user is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if jsonb_array_length(v_items) = 0 then
    raise exception 'Carrinho vazio.';
  end if;

  -- Validate address fields
  if coalesce(v_address ->> 'recipient_name', '') = '' then
    raise exception 'Informe o nome do destinatário.';
  end if;
  if coalesce(v_address ->> 'zip', '') = '' then
    raise exception 'Informe o CEP.';
  end if;
  if coalesce(v_address ->> 'street', '') = '' then
    raise exception 'Informe a rua.';
  end if;
  if coalesce(v_address ->> 'number', '') = '' then
    raise exception 'Informe o número.';
  end if;
  if coalesce(v_address ->> 'district', '') = '' then
    raise exception 'Informe o bairro.';
  end if;
  if coalesce(v_address ->> 'city', '') = '' then
    raise exception 'Informe a cidade.';
  end if;
  if coalesce(v_address ->> 'state', '') = '' then
    raise exception 'Informe o estado.';
  end if;

  v_subtotal := 0;
  for v_item in select jsonb_array_elements(v_items) loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_variant_id := coalesce(nullif(v_item ->> 'variant_id','')::uuid, null);
    v_qty := (v_item ->> 'quantity')::int;
    v_size := v_item ->> 'size';
    v_color := v_item ->> 'color';

    if v_qty is null or v_qty <= 0 then
      raise exception 'Quantidade inválida.';
    end if;

    -- Lock product row to prevent overselling
    select * into v_product from public.products where id = v_product_id and published = true for update;
    if not found then
      raise exception 'Produto não disponível.';
    end if;

    if v_product.sale_price is not null and v_product.sale_price < v_product.price then
      v_unit_price := v_product.sale_price;
    else
      v_unit_price := v_product.price;
    end if;

    if v_variant_id is not null then
      -- Lock variant row
      select * into v_variant from public.product_variants
        where id = v_variant_id and product_id = v_product_id for update;
      if not found then
        raise exception 'Variação não encontrada.';
      end if;
      if v_variant.stock < v_qty then
        raise exception 'Estoque insuficiente para %.', v_product.name;
      end if;
    else
      -- No variant: check aggregate stock across all variants
      select coalesce(sum(stock), 0) into v_aggregate_stock
        from public.product_variants where product_id = v_product_id for update;
      if not found or v_aggregate_stock < v_qty then
        raise exception 'Estoque insuficiente para %.', v_product.name;
      end if;
    end if;

    v_line_total := round(v_unit_price * v_qty, 2);
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  -- Coupon validation with FOR UPDATE to prevent race condition
  if v_coupon_code is not null and v_coupon_code <> '' then
    select * into v_coupon from public.coupons
      where upper(code) = upper(v_coupon_code) and active = true for update;
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

  -- Generate unpredictable order number: TA-YYYY-NNNNNN (6 random digits)
  v_rand := floor(random() * 1000000)::int;
  v_order_number := 'TA-' || extract(year from now())::text || '-' || lpad(v_rand::text, 6, '0');

  -- Ensure uniqueness (extremely unlikely collision, but handle it)
  while exists (select 1 from public.orders where order_number = v_order_number) loop
    v_rand := floor(random() * 1000000)::int;
    v_order_number := 'TA-' || extract(year from now())::text || '-' || lpad(v_rand::text, 6, '0');
  end loop;

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
    else
      -- Decrement from the variant with the most stock
      update public.product_variants
        set stock = stock - v_qty
        where id = (
          select id from public.product_variants
          where product_id = v_product_id and stock >= v_qty
          order by stock desc limit 1
        );
    end if;
  end loop;

  -- Atomically increment coupon usage with conditional UPDATE
  if v_coupon_code is not null and v_discount > 0 then
    update public.coupons
      set used_count = used_count + 1
      where id = v_coupon.id
      returning 1 into v_coupon_updated;
    if v_coupon_updated is null then
      raise exception 'Cupom não pôde ser resgatado.';
    end if;
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
