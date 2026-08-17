alter table public.evaluations
add column if not exists details jsonb not null default '{}'::jsonb;

alter table public.evaluations
drop constraint if exists evaluations_details_object;

alter table public.evaluations
add constraint evaluations_details_object
check (jsonb_typeof(details) = 'object');
