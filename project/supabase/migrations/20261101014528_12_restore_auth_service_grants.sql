/*
# Restore GoTrue auth service permissions

1. Purpose
- The GoTrue auth service runs as `supabase_auth_admin` but only `postgres` had
  grants on `auth.users`, so login and signup both failed. This restores the
  standard Supabase auth role grants.

2. Safety
- These are internal service-role grants, not anon/authenticated grants.
- No data is modified or deleted.
*/

grant usage on schema auth to supabase_auth_admin;
grant select, insert, update, delete on auth.users to supabase_auth_admin;
grant select, insert, update, delete on auth.refresh_tokens to supabase_auth_admin;
grant select, insert, update, delete on auth.instances to supabase_auth_admin;
grant select, insert, update, delete on auth.identities to supabase_auth_admin;
grant select, insert, update, delete on auth.sessions to supabase_auth_admin;
grant select, insert, update, delete on auth.audit_log_entries to supabase_auth_admin;
grant select, insert, update, delete on auth.flow_state to supabase_auth_admin;
grant select, insert, update, delete on auth.sso_providers to supabase_auth_admin;
grant select, insert, update, delete on auth.sso_domains to supabase_auth_admin;
grant select, insert, update, delete on auth.saml_relay_states to supabase_auth_admin;
grant select, insert, update, delete on auth.mfa_factors to supabase_auth_admin;
grant select, insert, update, delete on auth.mfa_challenges to supabase_auth_admin;
grant select, insert, update, delete on auth.mfa_amr_claims to supabase_auth_admin;
grant select, insert, update, delete on auth.mfa_recovery_codes to supabase_auth_admin;
grant select, insert, update, delete on auth.mfa_recovery_code_sets to supabase_auth_admin;
grant select, insert, update, delete on auth.one_time_tokens to supabase_auth_admin;
grant select, insert, update, delete on auth.oauth_clients to supabase_auth_admin;
grant select, insert, update, delete on auth.oauth_client_states to supabase_auth_admin;
grant select, insert, update, delete on auth.oauth_authorizations to supabase_auth_admin;
grant select, insert, update, delete on auth.oauth_consents to supabase_auth_admin;
grant select, insert, update, delete on auth.custom_oauth_providers to supabase_auth_admin;
grant select, insert, update, delete on auth.scim_tokens to supabase_auth_admin;
grant select, insert, update, delete on auth.scim_users to supabase_auth_admin;
grant select, insert, update, delete on auth.webauthn_challenges to supabase_auth_admin;
grant select, insert, update, delete on auth.webauthn_credentials to supabase_auth_admin;
