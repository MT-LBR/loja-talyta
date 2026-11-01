-- ============ Admin account management ============
-- SECURITY DEFINER functions so the browser (anon/authenticated) can list,
-- add, and remove admin roles on auth.users without direct table access.

-- List all admin accounts
create or replace function public.list_admins()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select u.id, u.email, u.created_at, u.last_sign_in_at
  from auth.users u
  where u.raw_app_meta_data ->> 'role' = 'admin'
  order by u.created_at;
$$;

-- List ALL users (for promoting existing accounts to admin)
create or replace function public.list_all_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  is_admin boolean
)
language sql
security definer
set search_path = public
as $$
  select u.id, u.email, u.created_at,
         coalesce(u.raw_app_meta_data ->> 'role' = 'admin', false) as is_admin
  from auth.users u
  order by u.created_at desc;
$$;

-- Promote a user to admin by email (creates account if it doesn't exist)
create or replace function public.add_admin(p_email text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado';
  end if;

  select id into v_id from auth.users where email = lower(p_email);
  if v_id is not null then
    update auth.users
      set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb,
          updated_at = now()
    where id = v_id;
    return v_id;
  end if;

  -- Create new user
  v_id := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_sso_user, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_id, 'authenticated', 'authenticated', lower(p_email),
    crypt(p_password, gen_salt('bf')), now(),
    '{"role": "admin"}'::jsonb, '{}'::jsonb,
    false, now(), now()
  );
  return v_id;
end;
$$;

-- Demote an admin (remove admin role)
create or replace function public.remove_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso negado';
  end if;

  -- Prevent self-demotion
  if p_user_id = auth.uid() then
    raise exception 'Você não pode remover sua própria conta de administrador';
  end if;

  update auth.users
    set raw_app_meta_data = raw_app_meta_data - 'role',
        updated_at = now()
  where id = p_user_id;
end;
$$;

-- Set a new password for an admin
create or replace function public.reset_admin_password(p_user_id uuid, p_new_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso negado';
  end if;

  update auth.users
    set encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
  where id = p_user_id
    and raw_app_meta_data ->> 'role' = 'admin';
end;
$$;

revoke execute on function public.list_admins() from public, anon;
revoke execute on function public.list_all_users() from public, anon;
revoke execute on function public.add_admin(text, text) from public, anon;
revoke execute on function public.remove_admin(uuid) from public, anon;
revoke execute on function public.reset_admin_password(uuid, text) from public, anon;

grant execute on function public.list_admins() to authenticated;
grant execute on function public.list_all_users() to authenticated;
grant execute on function public.add_admin(text, text) to authenticated;
grant execute on function public.remove_admin(uuid) to authenticated;
grant execute on function public.reset_admin_password(uuid, text) to authenticated;
