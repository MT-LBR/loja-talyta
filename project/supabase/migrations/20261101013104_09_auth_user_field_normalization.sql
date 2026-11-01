/*
# Normalize internal authentication user fields

1. Purpose
- Repairs authentication records that were created with direct SQL and left token fields NULL.
- Supabase Auth expects empty strings for unused token fields when scanning users during signup and login.

2. Modified data
- `auth.users.confirmation_token`: NULL becomes an empty string.
- `auth.users.recovery_token`: NULL becomes an empty string.
- `auth.users.email_change_token_new`: NULL becomes an empty string.
- `auth.users.is_super_admin`: NULL becomes false.
- `auth.users.raw_app_meta_data`: NULL becomes an empty JSON object.
- `auth.users.raw_user_meta_data`: NULL becomes an empty JSON object.

3. Safety
- No users, passwords, e-mails, orders, or product data are deleted or replaced.
- Existing non-null values are preserved.
*/

update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  is_super_admin = coalesce(is_super_admin, false),
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb),
  updated_at = coalesce(updated_at, now())
where confirmation_token is null
   or recovery_token is null
   or email_change_token_new is null
   or is_super_admin is null
   or raw_app_meta_data is null
   or raw_user_meta_data is null
   or updated_at is null;
