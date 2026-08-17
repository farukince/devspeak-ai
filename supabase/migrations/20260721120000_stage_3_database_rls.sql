create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  job_title text,
  experience_level text,
  english_level text,
  native_language text,
  timezone text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  module_type text not null check (module_type in ('standup', 'writing', 'interview', 'code_review', 'pair_programming')),
  title text not null,
  description text,
  prompt_context jsonb not null default '{}'::jsonb check (jsonb_typeof(prompt_context) = 'object'),
  difficulty text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_type text not null check (module_type in ('standup', 'writing', 'interview', 'code_review', 'pair_programming')),
  scenario_id uuid references public.scenarios(id) on delete set null,
  client_request_id uuid not null unique,
  input_mode text not null default 'written' check (input_mode in ('written', 'voice')),
  user_answer text not null,
  transcript text,
  status text not null default 'draft' check (status in ('draft', 'processing', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.practice_sessions(id) on delete cascade,
  overall_score numeric(5, 2) not null check (overall_score between 0 and 100),
  category_scores jsonb not null default '{}'::jsonb check (jsonb_typeof(category_scores) = 'object'),
  summary text not null,
  strengths jsonb not null default '[]'::jsonb check (jsonb_typeof(strengths) = 'array'),
  improvements jsonb not null default '[]'::jsonb check (jsonb_typeof(improvements) = 'array'),
  improved_answer text not null,
  next_exercise text,
  prompt_version text not null,
  schema_version text not null,
  model_name text not null,
  created_at timestamptz not null default now()
);

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions(id) on delete cascade,
  provider text not null,
  model text not null,
  prompt_version text not null,
  status text not null check (status in ('started', 'completed', 'failed')),
  provider_request_id text,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost numeric(12, 6) check (estimated_cost is null or estimated_cost >= 0),
  error_code text,
  created_at timestamptz not null default now()
);

create table public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weekly_session_target integer not null default 3 check (weekly_session_target > 0),
  module_type text check (module_type is null or module_type in ('standup', 'writing', 'interview', 'code_review', 'pair_programming')),
  starts_on date not null default current_date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create index practice_sessions_user_created_idx on public.practice_sessions(user_id, created_at desc);
create index practice_sessions_user_module_idx on public.practice_sessions(user_id, module_type, created_at desc);
create index practice_sessions_scenario_idx on public.practice_sessions(scenario_id);
create index evaluations_session_idx on public.evaluations(session_id);
create index ai_runs_session_created_idx on public.ai_runs(session_id, created_at desc);
create index user_goals_user_dates_idx on public.user_goals(user_id, starts_on desc);
create index scenarios_module_active_idx on public.scenarios(module_type, is_active);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger scenarios_set_updated_at before update on public.scenarios
for each row execute function public.set_updated_at();
create trigger practice_sessions_set_updated_at before update on public.practice_sessions
for each row execute function public.set_updated_at();
create trigger user_goals_set_updated_at before update on public.user_goals
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.scenarios enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.evaluations enable row level security;
alter table public.ai_runs enable row level security;
alter table public.user_goals enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "scenarios_select_active" on public.scenarios for select to authenticated using (is_active);

create policy "practice_sessions_select_own" on public.practice_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "practice_sessions_insert_own" on public.practice_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "practice_sessions_update_own" on public.practice_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "evaluations_select_own" on public.evaluations for select to authenticated
using (exists (select 1 from public.practice_sessions ps where ps.id = evaluations.session_id and ps.user_id = (select auth.uid())));
create policy "evaluations_insert_own" on public.evaluations for insert to authenticated
with check (exists (select 1 from public.practice_sessions ps where ps.id = evaluations.session_id and ps.user_id = (select auth.uid())));

create policy "ai_runs_select_own" on public.ai_runs for select to authenticated
using (exists (select 1 from public.practice_sessions ps where ps.id = ai_runs.session_id and ps.user_id = (select auth.uid())));
create policy "ai_runs_insert_own" on public.ai_runs for insert to authenticated
with check (exists (select 1 from public.practice_sessions ps where ps.id = ai_runs.session_id and ps.user_id = (select auth.uid())));

create policy "user_goals_select_own" on public.user_goals for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_goals_insert_own" on public.user_goals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_goals_update_own" on public.user_goals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_goals_delete_own" on public.user_goals for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.profiles, public.scenarios, public.practice_sessions, public.evaluations, public.ai_runs, public.user_goals from anon;
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.scenarios to authenticated;
grant select, insert, update on public.practice_sessions to authenticated;
grant select, insert on public.evaluations to authenticated;
grant select, insert on public.ai_runs to authenticated;
grant select, insert, update, delete on public.user_goals to authenticated;
