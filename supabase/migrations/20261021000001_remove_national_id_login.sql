-- The cédula is no longer collected or used for login (see
-- 20261021000000_username_password_login.sql). Remove the RPCs that resolved
-- a cédula to an email, which let anyone with the anon key look up emails,
-- and clear the stored cédulas. The column itself is kept for now.

drop function if exists public.lookup_email_by_national_id(text);
drop function if exists public.get_email_by_national_id(text);

update public.profiles set national_id = null;
