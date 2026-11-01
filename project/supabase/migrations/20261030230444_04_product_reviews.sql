/*
# Product reviews with fit feedback

## Purpose
Allow customers to leave product reviews with a star rating, optional text comment,
and a fit feedback indicator ("runs_small", "true_to_size", "runs_large").
The fit feedback is aggregated and displayed on the size guide popup to help shoppers
choose the right size.

## New Tables
- `product_reviews`
  - `id` (uuid, primary key)
  - `product_id` (uuid, FK → products, on delete cascade)
  - `user_id` (uuid, NOT NULL DEFAULT auth.uid(), FK → auth.users, on delete cascade)
  - `rating` (int, 1–5, not null)
  - `fit_feedback` (text, nullable; one of 'runs_small', 'true_to_size', 'runs_large')
  - `comment` (text, nullable)
  - `created_at` (timestamptz, default now())

## New Functions
- `get_fit_summary(product_id uuid)` — returns aggregated counts for each fit_feedback
  value and the total review count. Callable by anon + authenticated (public read).

## Security
- RLS enabled on `product_reviews`.
- SELECT: public (anon + authenticated) — reviews are visible to all shoppers.
- INSERT: authenticated only — must be the owner (user_id = auth.uid()).
- UPDATE/DELETE: authenticated owner only.
- Grants: SELECT to anon+authenticated; INSERT/UPDATE/DELETE to authenticated.
*/

-- ============ product_reviews ============
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  fit_feedback text check (fit_feedback in ('runs_small', 'true_to_size', 'runs_large')),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_product on public.product_reviews(product_id);
create index if not exists idx_reviews_user on public.product_reviews(user_id);
create unique index if not exists idx_reviews_one_per_user_product on public.product_reviews(product_id, user_id);

alter table public.product_reviews enable row level security;

-- Grants
grant select on public.product_reviews to anon, authenticated;
grant insert, update, delete on public.product_reviews to authenticated;

-- Policies
drop policy if exists "public_read_reviews" on public.product_reviews;
create policy "public_read_reviews"
  on public.product_reviews for select
  to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_reviews.product_id and p.published = true
  ));

drop policy if exists "insert_own_review" on public.product_reviews;
create policy "insert_own_review"
  on public.product_reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "update_own_review" on public.product_reviews;
create policy "update_own_review"
  on public.product_reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete_own_review" on public.product_reviews;
create policy "delete_own_review"
  on public.product_reviews for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============ get_fit_summary function ============
create or replace function public.get_fit_summary(p_product_id uuid)
returns table (
  runs_small int,
  true_to_size int,
  runs_large int,
  total_reviews int,
  avg_rating numeric(2,1)
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(sum(case when fit_feedback = 'runs_small' then 1 else 0 end), 0)::int as runs_small,
    coalesce(sum(case when fit_feedback = 'true_to_size' then 1 else 0 end), 0)::int as true_to_size,
    coalesce(sum(case when fit_feedback = 'runs_large' then 1 else 0 end), 0)::int as runs_large,
    count(*)::int as total_reviews,
    round(avg(rating), 1) as avg_rating
  from public.product_reviews
  where product_id = p_product_id;
$$;

grant execute on function public.get_fit_summary(uuid) to anon, authenticated;
