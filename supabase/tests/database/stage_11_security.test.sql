begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

select has_table('public', 'api_rate_limits', 'rate limit table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.api_rate_limits'::regclass), 'rate limit table has RLS');
select has_function('public', 'consume_rate_limit', array['text', 'integer', 'integer'], 'rate limit function exists');
select has_function('public', 'delete_current_user', array[]::text[], 'current-user deletion function exists');
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.practice_sessions'::regclass
      and conname = 'practice_sessions_user_client_request_unique'
      and contype = 'u'
  ),
  'practice sessions enforce idempotency'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'practice_sessions' and policyname = 'practice_sessions_select_own' and qual like '%auth.uid%'),
  'practice session ownership policy uses auth uid'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'evaluations' and policyname = 'evaluations_select_own' and qual like '%auth.uid%'),
  'evaluation ownership policy uses auth uid'
);

select * from finish();
rollback;
