begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'scenarios', 'scenarios table exists');
select has_table('public', 'practice_sessions', 'practice_sessions table exists');
select has_table('public', 'evaluations', 'evaluations table exists');
select has_table('public', 'ai_runs', 'ai_runs table exists');
select has_table('public', 'user_goals', 'user_goals table exists');

select ok(
  (select bool_and(c.relrowsecurity)
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname in ('profiles', 'scenarios', 'practice_sessions', 'evaluations', 'ai_runs', 'user_goals')),
  'RLS is enabled on every Stage 3 table'
);

select is(
  (select count(*)::integer
   from pg_policies
   where schemaname = 'public'
     and tablename in ('profiles', 'scenarios', 'practice_sessions', 'evaluations', 'ai_runs', 'user_goals')),
  15,
  'all Stage 3 RLS policies exist'
);

select is(
  (select count(*)::integer
   from information_schema.role_table_grants
   where table_schema = 'public'
     and grantee = 'anon'
     and table_name in ('profiles', 'scenarios', 'practice_sessions', 'evaluations', 'ai_runs', 'user_goals')),
  0,
  'anonymous users have no Stage 3 table grants'
);

select * from finish();
rollback;
