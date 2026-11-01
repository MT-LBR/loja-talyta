/*
# Harden database functions and restore auth compatibility

1. Purpose
- Keeps the restored default auth instance available for existing auth.users rows.
- Restricts SECURITY DEFINER RPCs to the roles that actually need them.
- Pins the trigger helper search path to prevent search-path hijacking.

2. Security changes
- Public product fit data remains callable by anon and authenticated because the storefront uses it before login.
- Coupon validation remains callable by anon and authenticated because guests can validate coupons in checkout.
- Cart creation remains callable by anon and authenticated because guest carts are supported.
- Admin and order-management functions remain authenticated-only.
*/

-- Keep the auth instance expected by existing auth.users records.
insert into auth.instances (id, uuid, raw_base_config, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  '{}', now(), now()
)
on conflict (id) do nothing;

-- Explicitly lock down security-definer RPC execution grants.
revoke execute on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

revoke execute on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
revoke execute on function public.admin_list_customers() from public, anon;
grant execute on function public.admin_list_customers() to authenticated;
revoke execute on function public.admin_customer_detail(uuid) from public, anon;
grant execute on function public.admin_customer_detail(uuid) to authenticated;
revoke execute on function public.admin_coupon_redemptions(uuid) from public, anon;
grant execute on function public.admin_coupon_redemptions(uuid) to authenticated;
revoke execute on function public.list_admins() from public, anon;
grant execute on function public.list_admins() to authenticated;
revoke execute on function public.list_all_users() from public, anon;
grant execute on function public.list_all_users() to authenticated;
revoke execute on function public.add_admin(text, text) from public, anon;
grant execute on function public.add_admin(text, text) to authenticated;
revoke execute on function public.remove_admin(uuid) from public, anon;
grant execute on function public.remove_admin(uuid) to authenticated;
revoke execute on function public.reset_admin_password(uuid, text) from public, anon;
grant execute on function public.reset_admin_password(uuid, text) to authenticated;
revoke execute on function public.place_order(jsonb) from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;

-- Trigger helper must not use a caller-controlled search_path.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
