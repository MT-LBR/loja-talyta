/*
# TALYTA AMARAL — Comércio (parte 2 do schema)

## Resumo
Cria as tabelas de clientes, endereços, carrinho, favoritos, pedidos, itens,
pagamentos, envios, cupons, resgates, newsletter, contatos, banners, audit logs.

## Novas tabelas
- `addresses`, `carts`, `cart_items`, `favorites` — dados do cliente.
- `orders`, `order_items`, `order_status_history` — pedidos.
- `payments`, `shipments` — pagamento e envio.
- `coupons`, `coupon_redemptions` — cupons.
- `newsletters`, `contact_messages`, `banners`, `audit_logs`.

## Segurança
- RLS em todas as tabelas. Proprietário vê apenas suas linhas; admin vê tudo via is_admin().
- Newsletter e contatos aceitam escrita pública (anon + authenticated).
- Banners ativos são leitura pública.

## Notas
1. Carts suportam visitantes por cart_token.
2. Orders guardam snapshot de endereço e itens.
3. Triggers updated_at automáticos em tabelas principais.
*/

-- ============ addresses ============
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label text,
  recipient_name text not null,
  zip text not null,
  street text not null,
  number text not null,
  complement text,
  district text not null,
  city text not null,
  state text not null,
  reference text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_addresses_user on public.addresses(user_id);

alter table public.addresses enable row level security;

grant select, insert, update, delete on public.addresses to authenticated;

drop policy if exists "owner_read_addresses" on public.addresses;
create policy "owner_read_addresses" on public.addresses
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "admin_read_addresses" on public.addresses;
create policy "admin_read_addresses" on public.addresses
  for select to authenticated using (public.is_admin());
drop policy if exists "owner_insert_addresses" on public.addresses;
create policy "owner_insert_addresses" on public.addresses
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "owner_update_addresses" on public.addresses;
create policy "owner_update_addresses" on public.addresses
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "owner_delete_addresses" on public.addresses;
create policy "owner_delete_addresses" on public.addresses
  for delete to authenticated using (auth.uid() = user_id);

-- ============ carts ============
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  cart_token uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_carts_user on public.carts(user_id);
create index if not exists idx_carts_token on public.carts(cart_token);

alter table public.carts enable row level security;

grant select, insert, update, delete on public.carts to anon, authenticated;

drop policy if exists "read_carts" on public.carts;
create policy "read_carts" on public.carts
  for select to anon, authenticated
  using (user_id = auth.uid() or (user_id is null and cart_token is not null));
drop policy if exists "admin_read_carts" on public.carts;
create policy "admin_read_carts" on public.carts
  for select to authenticated using (public.is_admin());
drop policy if exists "insert_carts" on public.carts;
create policy "insert_carts" on public.carts
  for insert to anon, authenticated
  with check (user_id = auth.uid() or (user_id is null and cart_token is not null));
drop policy if exists "update_carts" on public.carts;
create policy "update_carts" on public.carts
  for update to anon, authenticated
  using (user_id = auth.uid() or (user_id is null and cart_token is not null))
  with check (user_id = auth.uid() or (user_id is null and cart_token is not null));
drop policy if exists "delete_carts" on public.carts;
create policy "delete_carts" on public.carts
  for delete to anon, authenticated
  using (user_id = auth.uid() or (user_id is null and cart_token is not null));

-- ============ cart_items ============
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  size text,
  color text,
  quantity int not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_cartitems_cart on public.cart_items(cart_id);

alter table public.cart_items enable row level security;

grant select, insert, update, delete on public.cart_items to anon, authenticated;

drop policy if exists "read_cart_items" on public.cart_items;
create policy "read_cart_items" on public.cart_items
  for select to anon, authenticated
  using (exists (select 1 from public.carts c where c.id = cart_items.cart_id and (c.user_id = auth.uid() or (c.user_id is null and c.cart_token is not null))));
drop policy if exists "insert_cart_items" on public.cart_items;
create policy "insert_cart_items" on public.cart_items
  for insert to anon, authenticated
  with check (exists (select 1 from public.carts c where c.id = cart_items.cart_id and (c.user_id = auth.uid() or (c.user_id is null and c.cart_token is not null))));
drop policy if exists "update_cart_items" on public.cart_items;
create policy "update_cart_items" on public.cart_items
  for update to anon, authenticated
  using (exists (select 1 from public.carts c where c.id = cart_items.cart_id and (c.user_id = auth.uid() or (c.user_id is null and c.cart_token is not null)))
)
  with check (exists (select 1 from public.carts c where c.id = cart_items.cart_id and (c.user_id = auth.uid() or (c.user_id is null and c.cart_token is not null))));
drop policy if exists "delete_cart_items" on public.cart_items;
create policy "delete_cart_items" on public.cart_items
  for delete to anon, authenticated
  using (exists (select 1 from public.carts c where c.id = cart_items.cart_id and (c.user_id = auth.uid() or (c.user_id is null and c.cart_token is not null))));

-- ============ favorites ============
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_favorites_unique on public.favorites(user_id, product_id);

alter table public.favorites enable row level security;

grant select, insert, delete on public.favorites to authenticated;

drop policy if exists "owner_read_favorites" on public.favorites;
create policy "owner_read_favorites" on public.favorites
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "owner_insert_favorites" on public.favorites;
create policy "owner_insert_favorites" on public.favorites
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "owner_delete_favorites" on public.favorites;
create policy "owner_delete_favorites" on public.favorites
  for delete to authenticated using (auth.uid() = user_id);

-- ============ orders ============
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'awaiting_payment',
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  shipping_price numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  coupon_code text,
  recipient_name text not null,
  zip text not null,
  street text not null,
  number text not null,
  complement text,
  district text not null,
  city text not null,
  state text not null,
  reference text,
  payment_method text,
  payment_status text not null default 'pending',
  tracking_code text,
  shipping_method text,
  estimated_days int,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);

alter table public.orders enable row level security;

grant select, insert, update on public.orders to authenticated;

drop policy if exists "owner_read_orders" on public.orders;
create policy "owner_read_orders" on public.orders
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "admin_read_orders" on public.orders;
create policy "admin_read_orders" on public.orders
  for select to authenticated using (public.is_admin());
drop policy if exists "owner_insert_orders" on public.orders;
create policy "owner_insert_orders" on public.orders
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "admin_update_orders" on public.orders;
create policy "admin_update_orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============ order_items ============
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  variant_id uuid,
  size text,
  color text,
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_orderitems_order on public.order_items(order_id);

alter table public.order_items enable row level security;

grant select, insert on public.order_items to authenticated;

drop policy if exists "owner_read_order_items" on public.order_items;
create policy "owner_read_order_items" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));
drop policy if exists "admin_read_order_items" on public.order_items;
create policy "admin_read_order_items" on public.order_items
  for select to authenticated using (public.is_admin());
drop policy if exists "owner_insert_order_items" on public.order_items;
create policy "owner_insert_order_items" on public.order_items
  for insert to authenticated with check (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));

-- ============ order_status_history ============
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_orderhist_order on public.order_status_history(order_id);

alter table public.order_status_history enable row level security;

grant select, insert on public.order_status_history to authenticated;

drop policy if exists "read_order_history" on public.order_status_history;
create policy "read_order_history" on public.order_status_history
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_status_history.order_id and (o.user_id = auth.uid() or public.is_admin())));
drop policy if exists "insert_order_history" on public.order_status_history;
create policy "insert_order_history" on public.order_status_history
  for insert to authenticated with check (exists (select 1 from public.orders o where o.id = order_status_history.order_id and (o.user_id = auth.uid() or public.is_admin())));

-- ============ payments ============
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  gateway text,
  gateway_payment_id text,
  method text,
  status text not null default 'pending',
  amount numeric(10,2) not null,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_order on public.payments(order_id);

alter table public.payments enable row level security;

grant select on public.payments to authenticated;
grant insert, update on public.payments to authenticated;

drop policy if exists "read_payments" on public.payments;
create policy "read_payments" on public.payments
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = payments.order_id and (o.user_id = auth.uid() or public.is_admin())));
drop policy if exists "insert_payments" on public.payments;
create policy "insert_payments" on public.payments
  for insert to authenticated with check (exists (select 1 from public.orders o where o.id = payments.order_id and (o.user_id = auth.uid() or public.is_admin())));
drop policy if exists "admin_update_payments" on public.payments;
create policy "admin_update_payments" on public.payments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============ shipments ============
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  carrier text,
  tracking_code text,
  method text,
  status text not null default 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_shipments_order on public.shipments(order_id);

alter table public.shipments enable row level security;

grant select on public.shipments to authenticated;
grant insert, update on public.shipments to authenticated;

drop policy if exists "read_shipments" on public.shipments;
create policy "read_shipments" on public.shipments
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = shipments.order_id and (o.user_id = auth.uid() or public.is_admin())));
drop policy if exists "admin_write_shipments" on public.shipments;
create policy "admin_write_shipments" on public.shipments
  for insert to authenticated with check (public.is_admin());
drop policy if exists "admin_update_shipments" on public.shipments;
create policy "admin_update_shipments" on public.shipments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============ coupons ============
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null default 'percentage',
  discount_value numeric(10,2) not null,
  min_order_value numeric(10,2) default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses int,
  max_uses_per_customer int default 1,
  used_count int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_coupons_code on public.coupons(code);

alter table public.coupons enable row level security;

grant select on public.coupons to anon, authenticated;
grant insert, update, delete on public.coupons to authenticated;

drop policy if exists "read_coupons" on public.coupons;
create policy "read_coupons" on public.coupons
  for select to anon, authenticated using (active = true);
drop policy if exists "admin_write_coupons" on public.coupons;
create policy "admin_write_coupons" on public.coupons
  for insert to authenticated with check (public.is_admin());
drop policy if exists "admin_update_coupons" on public.coupons;
create policy "admin_update_coupons" on public.coupons
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin_delete_coupons" on public.coupons;
create policy "admin_delete_coupons" on public.coupons
  for delete to authenticated using (public.is_admin());

-- ============ coupon_redemptions ============
create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_redemptions_coupon on public.coupon_redemptions(coupon_id);
create index if not exists idx_redemptions_user on public.coupon_redemptions(user_id);

alter table public.coupon_redemptions enable row level security;

grant select, insert on public.coupon_redemptions to authenticated;

drop policy if exists "read_redemptions" on public.coupon_redemptions;
create policy "read_redemptions" on public.coupon_redemptions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "insert_redemptions" on public.coupon_redemptions;
create policy "insert_redemptions" on public.coupon_redemptions
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());

-- ============ newsletters ============
create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  consent boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_newsletters_email on public.newsletters(lower(email));

alter table public.newsletters enable row level security;

grant select, insert on public.newsletters to anon, authenticated;

drop policy if exists "insert_newsletters" on public.newsletters;
create policy "insert_newsletters" on public.newsletters
  for insert to anon, authenticated with check (true);
drop policy if exists "admin_read_newsletters" on public.newsletters;
create policy "admin_read_newsletters" on public.newsletters
  for select to authenticated using (public.is_admin());

-- ============ contact_messages ============
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;

drop policy if exists "insert_contacts" on public.contact_messages;
create policy "insert_contacts" on public.contact_messages
  for insert to anon, authenticated with check (true);
drop policy if exists "admin_read_contacts" on public.contact_messages;
create policy "admin_read_contacts" on public.contact_messages
  for select to authenticated using (public.is_admin());
drop policy if exists "admin_update_contacts" on public.contact_messages;
create policy "admin_update_contacts" on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin_delete_contacts" on public.contact_messages;
create policy "admin_delete_contacts" on public.contact_messages
  for delete to authenticated using (public.is_admin());

-- ============ banners ============
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  cta_text text,
  cta_link text,
  image_url text not null,
  position text not null default 'hero',
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_banners_active on public.banners(active, position, display_order);

alter table public.banners enable row level security;

grant select on public.banners to anon, authenticated;
grant insert, update, delete on public.banners to authenticated;

drop policy if exists "public_read_banners" on public.banners;
create policy "public_read_banners" on public.banners
  for select to anon, authenticated using (active = true);
drop policy if exists "admin_write_banners" on public.banners;
create policy "admin_write_banners" on public.banners
  for insert to authenticated with check (public.is_admin());
drop policy if exists "admin_update_banners" on public.banners;
create policy "admin_update_banners" on public.banners
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin_delete_banners" on public.banners;
create policy "admin_delete_banners" on public.banners
  for delete to authenticated using (public.is_admin());

-- ============ audit_logs ============
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  entity text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_created on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

grant select on public.audit_logs to authenticated;

drop policy if exists "admin_read_audit" on public.audit_logs;
create policy "admin_read_audit" on public.audit_logs
  for select to authenticated using (public.is_admin());

-- ============ updated_at triggers ============
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'store_settings','categories','collections','products','product_variants',
    'addresses','carts','orders','coupons','banners','payments'
  ] loop
    execute format('drop trigger if exists trg_set_updated_at on public.%I', t);
    execute format('create trigger trg_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end$$;
