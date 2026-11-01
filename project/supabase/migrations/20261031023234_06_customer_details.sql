-- ============ Customer details for admin panel ============
-- SECURITY DEFINER RPC so admins can see all customers with purchase stats
-- and contact data (addresses) without direct auth.users access.

create or replace function public.admin_list_customers()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  is_admin boolean,
  total_orders bigint,
  total_spent numeric(12,2),
  last_order_date timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    coalesce(u.raw_app_meta_data ->> 'role' = 'admin', false) as is_admin,
    coalesce(o.total_orders, 0) as total_orders,
    coalesce(o.total_spent, 0) as total_spent,
    o.last_order_date
  from auth.users u
  left join (
    select
      user_id,
      count(*) as total_orders,
      sum(total) as total_spent,
      max(created_at) as last_order_date
    from public.orders
    group by user_id
  ) o on o.user_id = u.id
  where coalesce(u.raw_app_meta_data ->> 'role', '') <> 'admin'
    or u.raw_app_meta_data ->> 'role' is null
  order by coalesce(o.last_order_date, u.created_at) desc;
$$;

-- Customer detail: orders + addresses in a single call
create or replace function public.admin_customer_detail(p_user_id uuid)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'user', (
      select json_build_object(
        'id', u.id,
        'email', u.email,
        'created_at', u.created_at,
        'last_sign_in_at', u.last_sign_in_at
      )
      from auth.users u where u.id = p_user_id
    ),
    'orders', (
      select coalesce(json_agg(row_to_json(ox) order by ox.created_at desc), '[]'::json)
      from (
        select
          o.id, o.order_number, o.status, o.payment_status,
          o.total, o.subtotal, o.discount, o.shipping_price,
          o.payment_method, o.created_at,
          o.recipient_name, o.city, o.state
        from public.orders o
        where o.user_id = p_user_id
        order by o.created_at desc
      ) ox
    ),
    'addresses', (
      select coalesce(json_agg(row_to_json(ax) order by ax.is_default desc, ax.created_at desc), '[]'::json)
      from (
        select
          a.id, a.label, a.recipient_name, a.zip, a.street, a.number,
          a.complement, a.district, a.city, a.state, a.reference,
          a.is_default, a.created_at
        from public.addresses a
        where a.user_id = p_user_id
        order by a.is_default desc, a.created_at desc
      ) ax
    )
  );
$$;

revoke execute on function public.admin_list_customers() from public, anon;
revoke execute on function public.admin_customer_detail(uuid) from public, anon;

grant execute on function public.admin_list_customers() to authenticated;
grant execute on function public.admin_customer_detail(uuid) to authenticated;
