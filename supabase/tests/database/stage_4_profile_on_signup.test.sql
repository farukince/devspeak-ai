begin;

create extension if not exists pgtap with schema extensions;
select plan(3);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created_create_profile'
      and not tgisinternal
  ),
  'auth user profile trigger exists'
);

select ok(
  exists (
    select 1
    from pg_proc
    join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
    where pg_namespace.nspname = 'public'
      and pg_proc.proname = 'handle_new_user_profile'
  ),
  'profile creation function exists'
);

select is(
  (
    select count(*)::integer
    from auth.users
    left join public.profiles on profiles.id = users.id
    where profiles.id is null
  ),
  0,
  'every existing auth user has a profile'
);

select * from finish();
rollback;
