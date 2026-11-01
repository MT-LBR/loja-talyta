-- ============ Coupon usage tracking for admin ============
-- SECURITY DEFINER RPC so admins can see who used each coupon,
-- with order details and customer email (auth.users not directly accessible).

create or replace function public.admin_coupon_redemptions(p_coupon_id uuid)
returns table (
  redemption_id uuid,
  order_id uuid,
  order_number text,
  order_total numeric(12,2),
  order_discount numeric(12,2),
  order_status text,
  user_id uuid,
  user_email text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    cr.id as redemption_id,
    cr.order_id,
    o.order_number,
    o.total as order_total,
    o.discount as order_discount,
    o.status as order_status,
    cr.user_id,
    u.email as user_email,
    cr.created_at
  from public.coupon_redemptions cr
  join public.orders o on o.id = cr.order_id
  left join auth.users u on u.id = cr.user_id
  where cr.coupon_id = p_coupon_id
  order by cr.created_at desc;
$$;

revoke execute on function public.admin_coupon_redemptions(uuid) from public, anon;
grant execute on function public.admin_coupon_redemptions(uuid) to authenticated;
