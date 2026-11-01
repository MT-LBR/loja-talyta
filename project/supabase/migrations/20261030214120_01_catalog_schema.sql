/*
# TALYTA AMARAL — Catálogo (parte 1 do schema)

## Resumo
Cria as tabelas centrais do catálogo da loja: configurações da loja,
categorias, coleções, produtos, variações (tamanho + cor) e imagens.

## Novas tabelas
- `store_settings` — configurações editáveis pela proprietária (nome, contato, redes, CEP de origem, faixa de anúncio, etc.). Linha única.
- `categories` — categorias de produtos (Vestidos, Blusas, etc.), com slug e ordem.
- `collections` — coleções/cápsulas (Nova Coleção, Verão, etc.).
- `products` — produto principal com nome, descrição, preços, SKU, peso, dimensões, flags (lançamento, destaque, promoção, mais vendido), status de publicação.
- `product_variants` — variações por cor + tamanho com estoque independente e SKU próprio.
- `product_images` — galeria de imagens por produto, com ordem e associação opcional a cor.

## Segurança
- RLS habilitado em todas as tabelas.
- `store_settings`, `categories`, `collections`, `products`, `product_variants`, `product_images`:
  - Leitura pública (anon + authenticated) apenas para registros publicados/ativos.
  - Escrita restrita a `authenticated` com role admin (via `is_admin()` em raw_app_meta_data).
- `is_admin()` SECURITY DEFINER lê raw_app_meta_data.role.
- Grants mínimos por verbo.

## Notas
1. `is_admin()` verifica `auth.jwt() -> raw_app_meta_data -> role = 'admin'`.
   A proprietária é promovida a admin definindo `raw_app_meta_data.role = 'admin'` no auth.users.
2. Produtos têm `published` boolean; não publicados não aparecem na vitrine.
3. Estoque por variação; produto sem variações usa uma variação "única".
*/

-- Função auxiliar: é admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'raw_app_meta_data' ->> 'role') = 'admin', false);
$$;

-- ============ store_settings (linha única) ============
create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null default 'TALYTA AMARAL',
  tagline text,
  announcement_text text,
  announcement_active boolean not null default true,
  email text,
  phone text,
  whatsapp text,
  instagram text,
  address_street text,
  address_number text,
  address_complement text,
  address_district text,
  address_city text,
  address_state text,
  address_zip text,
  cnpj text,
  business_hours text,
  origin_zip text,
  free_shipping_threshold numeric(10,2),
  default_shipping_price numeric(10,2) default 0,
  meta_pixel_id text,
  google_analytics_id text,
  hero_title text default 'Vista sua essência.',
  hero_subtitle text default 'Descubra uma nova forma de expressar sua elegância.',
  hero_cta text default 'Conheça a coleção',
  hero_image text,
  about_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;

grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;

drop policy if exists "public_read_settings" on public.store_settings;
create policy "public_read_settings" on public.store_settings
  for select to anon, authenticated using (true);

drop policy if exists "admin_update_settings" on public.store_settings;
create policy "admin_update_settings" on public.store_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_insert_settings" on public.store_settings;
create policy "admin_insert_settings" on public.store_settings
  for insert to authenticated with check (public.is_admin());

-- ============ categories ============
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_active on public.categories(active, display_order);

alter table public.categories enable row level security;

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

drop policy if exists "public_read_categories" on public.categories;
create policy "public_read_categories" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "admin_write_categories" on public.categories;
create policy "admin_write_categories" on public.categories
  for insert to authenticated with check (public.is_admin());
drop policy if exists "admin_update_categories" on public.categories;
create policy "admin_update_categories" on public.categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin_delete_categories" on public.categories;
create policy "admin_delete_categories" on public.categories
  for delete to authenticated using (public.is_admin());

-- ============ collections ============
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.collections enable row level security;

grant select on public.collections to anon, authenticated;
grant insert, update, delete on public.collections to authenticated;

drop policy if exists "public_read_collections" on public.collections;
create policy "public_read_collections" on public.collections
  for select to anon, authenticated using (true);

drop policy if exists "admin_write_collections" on public.collections;
create policy "admin_write_collections" on public.collections
  for insert to authenticated with check (public.is_admin());
drop policy if exists "admin_update_collections" on public.collections;
create policy "admin_update_collections" on public.collections
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin_delete_collections" on public.collections;
create policy "admin_delete_collections" on public.collections
  for delete to authenticated using (public.is_admin());

-- ============ products ============
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  sku text,
  brand text default 'TALYTA AMARAL',
  category_id uuid references public.categories(id) on delete set null,
  collection_id uuid references public.collections(id) on delete set null,
  price numeric(10,2) not null,
  sale_price numeric(10,2),
  weight_g int default 0,
  height_cm numeric(6,2) default 0,
  width_cm numeric(6,2) default 0,
  length_cm numeric(6,2) default 0,
  fabric_composition text,
  care_instructions text,
  fit text,
  measurements text,
  published boolean not null default false,
  is_new boolean not null default false,
  is_launch boolean not null default false,
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  is_on_sale boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_published on public.products(published);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_collection on public.products(collection_id);
create index if not exists idx_products_flags on public.products(is_new, is_launch, is_featured, is_bestseller, is_on_sale);

alter table public.products enable row level security;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "public_read_products" on public.products;
create policy "public_read_products" on public.products
  for select to anon, authenticated using (published = true);

drop policy if exists "admin_read_all_products" on public.products;
create policy "admin_read_all_products" on public.products
  for select to authenticated using (public.is_admin());

drop policy if exists "admin_write_products" on public.products;
create policy "admin_write_products" on public.products
  for insert to authenticated with check (public.is_admin());
drop policy if exists "admin_update_products" on public.products;
create policy "admin_update_products" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin_delete_products" on public.products;
create policy "admin_delete_products" on public.products
  for delete to authenticated using (public.is_admin());

-- ============ product_variants ============
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text,
  size text,
  color text,
  color_hex text,
  stock int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_variants_product on public.product_variants(product_id);
create unique index if not exists idx_variants_unique on public.product_variants(product_id, coalesce(size,''), coalesce(color,''));

alter table public.product_variants enable row level security;

grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;

drop policy if exists "public_read_variants" on public.product_variants;
create policy "public_read_variants" on public.product_variants
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_variants.product_id and p.published = true));

drop policy if exists "admin_read_variants" on public.product_variants;
create policy "admin_read_variants" on public.product_variants
  for select to authenticated using (public.is_admin());

drop policy if exists "admin_write_variants" on public.product_variants;
create policy "admin_write_variants" on public.product_variants
  for insert to authenticated with check (public.is_admin());
drop policy if exists "admin_update_variants" on public.product_variants;
create policy "admin_update_variants" on public.product_variants
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin_delete_variants" on public.product_variants;
create policy "admin_delete_variants" on public.product_variants
  for delete to authenticated using (public.is_admin());

-- ============ product_images ============
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  color text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_images_product on public.product_images(product_id, display_order);

alter table public.product_images enable row level security;

grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;

drop policy if exists "public_read_images" on public.product_images;
create policy "public_read_images" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_images.product_id and p.published = true));

drop policy if exists "admin_read_images" on public.product_images;
create policy "admin_read_images" on public.product_images
  for select to authenticated using (public.is_admin());

drop policy if exists "admin_write_images" on public.product_images;
create policy "admin_write_images" on public.product_images
  for insert to authenticated with check (public.is_admin());
drop policy if exists "admin_update_images" on public.product_images;
create policy "admin_update_images" on public.product_images
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin_delete_images" on public.product_images;
create policy "admin_delete_images" on public.product_images
  for delete to authenticated using (public.is_admin());
