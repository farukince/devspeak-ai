with base_questions(role, technology_area, difficulty, question) as (
  values
    ('frontend_engineer', 'react', 'medium', 'Explain how React reconciliation works and why stable keys matter when rendering lists.'),
    ('frontend_engineer', 'react', 'hard', 'How would you diagnose and reduce unnecessary renders in a large React application?'),
    ('frontend_engineer', 'web_performance', 'medium', 'What are Core Web Vitals and which engineering changes can improve them?'),
    ('frontend_engineer', 'web_performance', 'hard', 'Design a performance strategy for a content-heavy web application used on slow mobile networks.'),
    ('backend_engineer', 'nodejs', 'medium', 'Explain the Node.js event loop and when CPU-intensive work becomes a problem.'),
    ('backend_engineer', 'nodejs', 'hard', 'How would you investigate memory growth and event-loop latency in a production Node.js service?'),
    ('backend_engineer', 'api_design', 'medium', 'How do you design an idempotent API endpoint and why is idempotency important?'),
    ('backend_engineer', 'api_design', 'hard', 'Design a resilient rate-limiting strategy for a globally distributed API.'),
    ('devops_engineer', 'containers', 'medium', 'Explain the difference between a container and a virtual machine and when you would use each.'),
    ('devops_engineer', 'containers', 'hard', 'How would you diagnose repeated Kubernetes pod restarts with intermittent traffic failures?'),
    ('devops_engineer', 'cicd', 'medium', 'Describe the essential stages of a safe CI/CD pipeline.'),
    ('devops_engineer', 'cicd', 'hard', 'Design a zero-downtime deployment and rollback strategy for a critical service.')
),
experience_levels(experience_level) as (
  values ('junior'), ('mid'), ('senior')
),
seed_rows as (
  select
    role,
    technology_area,
    difficulty,
    experience_level,
    question,
    concat(role, ':', technology_area, ':', experience_level, ':', difficulty) as seed_key
  from base_questions
  cross join experience_levels
)
insert into public.scenarios (module_type, title, description, prompt_context, difficulty, is_active)
select
  'interview',
  seed_key,
  question,
  jsonb_build_object(
    'role', role,
    'experienceLevel', experience_level,
    'technologyArea', technology_area,
    'seedKey', seed_key
  ),
  difficulty,
  true
from seed_rows
where not exists (
  select 1 from public.scenarios existing
  where existing.module_type = 'interview'
    and existing.prompt_context ->> 'seedKey' = seed_rows.seed_key
);
