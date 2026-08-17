create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'name',
          concat_ws(
            ' ',
            new.raw_user_meta_data ->> 'given_name',
            new.raw_user_meta_data ->> 'family_name'
          )
        )
      ),
      ''
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

insert into public.profiles (id, display_name)
select
  users.id,
  nullif(
    trim(
      coalesce(
        users.raw_user_meta_data ->> 'full_name',
        users.raw_user_meta_data ->> 'name',
        concat_ws(
          ' ',
          users.raw_user_meta_data ->> 'given_name',
          users.raw_user_meta_data ->> 'family_name'
        )
      )
    ),
    ''
  )
from auth.users as users
on conflict (id) do nothing;

revoke all on function public.handle_new_user_profile() from public, anon, authenticated;
