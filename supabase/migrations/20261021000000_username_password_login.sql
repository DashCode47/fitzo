-- Login moves from cédula + email OTP to username + password.
-- profiles.username becomes a unique, case-insensitive login handle.

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- Resolves a username to the auth email so the client can call
-- signInWithPassword. Security definer to bypass RLS for this lookup only.
create or replace function public.lookup_email_by_username(p_username text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_email text;
begin
  select email into v_email from profiles where lower(trim(username)) = lower(trim(p_username)) limit 1;
  return v_email;
end;
$$;

grant execute on function public.lookup_email_by_username(text) to anon, authenticated;

-- Same as before, but username now comes from the sign-up metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.profiles (
    id,
    email,
    username,
    display_name,
    national_id,
    phone,
    gender,
    weight,
    role,
    status,
    total_points,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(lower(new.raw_user_meta_data->>'username'), new.raw_user_meta_data->>'first_name', new.email),
    coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' || coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'national_id',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'gender',
    (new.raw_user_meta_data->>'weight')::numeric,
    'CLIENT',
    'ACTIVE',
    0,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    username = excluded.username,
    display_name = excluded.display_name,
    national_id = excluded.national_id,
    phone = excluded.phone,
    gender = excluded.gender,
    weight = excluded.weight,
    updated_at = now();

  return new;
end;
$$;
