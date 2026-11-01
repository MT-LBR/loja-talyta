/*
# Make administrator account creation compatible with Supabase Auth

1. Purpose
- Updates the protected administrator-creation routine so future accounts include the same empty token values expected by Supabase Auth.

2. Modified function
- `public.add_admin(text, text)` now populates all unused auth token fields with empty strings and sets internal booleans and JSON metadata explicitly.

3. Security
- The function remains SECURITY DEFINER.
- Only authenticated callers can execute it.
- It continues to verify `public.is_admin()` before changing auth.users.
*/

create or replace function public.add_admin(p_email text, p_password text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado';
  end if;

  select id into v_id from auth.users where email = lower(trim(p_email));
  if v_id is not null then
    update auth.users
      set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb,
          updated_at = now()
    where id = v_id;
    return v_id;
  end if;

  v_id := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new,
    email_change_token_current, phone_change, phone_change_token,
    email_change_confirm_status, reauthentication_token,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_sso_user, is_anonymous, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_id, 'authenticated', 'authenticated', lower(trim(p_email)),
    crypt(p_password, gen_salt('bf')), now(),
    '', '', '', '', '', '', 0, '',
    '{"role": "admin"}'::jsonb, '{}'::jsonb,
    false, false, false, now(), now()
  );
  return v_id;
end;
$$;

revoke execute on function public.add_admin(text, text) from public, anon;
grant execute on function public.add_admin(text, text) to authenticated;
