-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- USERS are managed by Supabase Auth. We'll mirror minimal profile fields.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('student','employer')),
  name text,
  bio text,
  interests text[] default '{}',
  location text,
  phone text,
  experience text,
  avatar_url text,
  daily_digest_enabled boolean default false,
  created_at timestamptz default now()
);

-- COMPANIES (owned by employer profile)
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  location text,
  created_at timestamptz default now()
);
create index if not exists companies_owner_idx on public.companies(owner_user_id);

-- JOBS
create table if not exists public.jobs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  tags text[] default '{}',               -- e.g., {"cash register","customer service","heavy lifting"}
  is_paid boolean default false,
  stipend_amount numeric,                 -- nullable
  location text,
  images text[] default '{}',             -- store public URLs in Supabase Storage
  status text default 'open' check (status in ('open','closed')),
  created_at timestamptz default now()
);
create index if not exists jobs_company_idx on public.jobs(company_id);
create index if not exists jobs_trgm_idx on public.jobs using gin (title gin_trgm_ops, description gin_trgm_ops);
create index if not exists jobs_tags_gin on public.jobs using gin (tags);
create index if not exists jobs_location_idx on public.jobs(location);

-- APPLICATIONS
create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  student_user_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  status text default 'submitted' check (status in ('submitted','accepted','rejected')),
  created_at timestamptz default now(),
  unique (job_id, student_user_id)
);
create index if not exists applications_job_idx on public.applications(job_id);
create index if not exists applications_student_idx on public.applications(student_user_id);

-- THREADS & MESSAGES (1:1 per job between employer & student)
create table if not exists public.threads (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  employer_user_id uuid not null references public.profiles(id) on delete cascade,
  student_user_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz default now(),
  unique (job_id, employer_user_id, student_user_id)
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);
create index if not exists messages_thread_time_idx on public.messages(thread_id, created_at desc);

-- COMMENTS (public reviews under job listing, from people who worked there)
create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  author_user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);
create index if not exists comments_job_idx on public.comments(job_id);

-- RECOMMENDATIONS (employer-generated letters)
create table if not exists public.recommendations (
  id uuid primary key default uuid_generate_v4(),
  employer_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  content text,                 -- can store generated text; file uploads go to Storage with URL here
  created_at timestamptz default now()
);
create index if not exists recommendations_student_idx on public.recommendations(student_id);

-- CALENDAR EVENTS (interviews, shifts, etc.)
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.jobs(id) on delete cascade,
  organizer_user_id uuid not null references public.profiles(id) on delete cascade,
  participant_user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  notes text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz default now()
);
create index if not exists events_user_time_idx on public.events(organizer_user_id, start_at);

-- INTEREST MATCHES (materialized preferences for faster notifications)
create table if not exists public.student_preferences (
  student_user_id uuid primary key references public.profiles(id) on delete cascade,
  interest_tags text[] default '{}'
);

-- RLS: turn on and define policies
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.comments enable row level security;
alter table public.recommendations enable row level security;
alter table public.events enable row level security;
alter table public.student_preferences enable row level security;

-- Profiles: users can read themselves; admins (service role) can read all.
create policy "read own profile" on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);
create policy "insert self" on public.profiles for insert with check (auth.uid() = id);

-- Companies: owner only
create policy "company select public" on public.companies for select using (true);
create policy "company owner modify" on public.companies for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);

-- Jobs: anyone can read; only employer who owns company can write
create policy "jobs readable" on public.jobs for select using (true);
create policy "jobs owner write" on public.jobs
  for all using (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from public.companies c where c.id = company_id and c.owner_user_id = auth.uid())
  );

-- Applications: student can insert/read their own; employer can read apps to their jobs
create policy "apps student manage" on public.applications
  for all using (auth.uid() = student_user_id) with check (auth.uid() = student_user_id);
create policy "apps employer read" on public.applications
  for select using (
    exists (
      select 1 from public.jobs j join public.companies c on j.company_id = c.id
      where j.id = applications.job_id and c.owner_user_id = auth.uid()
    )
  );

-- Threads & messages: participants only
create policy "threads participants" on public.threads
  for all using (auth.uid() in (employer_user_id, student_user_id))
  with check (auth.uid() in (employer_user_id, student_user_id));
create policy "messages participants" on public.messages
  for all using (
    exists (select 1 from public.threads t where t.id = thread_id and auth.uid() in (t.employer_user_id, t.student_user_id))
  ) with check (
    exists (select 1 from public.threads t where t.id = thread_id and auth.uid() in (t.employer_user_id, t.student_user_id))
  );

-- Comments: public read, authenticated write
create policy "comments read" on public.comments for select using (true);
create policy "comments write own" on public.comments
  for all using (auth.uid() = author_user_id) with check (auth.uid() = author_user_id);

-- Recommendations: employer author, student can read their own
create policy "recs employer create" on public.recommendations
  for all using (auth.uid() = employer_id) with check (auth.uid() = employer_id);
create policy "recs student read" on public.recommendations
  for select using (auth.uid() = student_id or auth.uid() = employer_id);

-- Events: organizer can manage; participants read
create policy "events organizer manage" on public.events
  for all using (auth.uid() = organizer_user_id) with check (auth.uid() = organizer_user_id);
create policy "events participant read" on public.events
  for select using (auth.uid() = participant_user_id or auth.uid() = organizer_user_id);

-- Preferences: student only
create policy "prefs student manage" on public.student_preferences
  for all using (auth.uid() = student_user_id) with check (auth.uid() = student_user_id);

-- NOTIFY MATCHES: simple SQL function to find matching students by tags overlap
create or replace function public.matching_students_for_job(job_id_in uuid)
returns table(student_user_id uuid) language sql as $
  select sp.student_user_id
  from public.student_preferences sp
  where exists (
    select 1 from public.jobs j
    where j.id = job_id_in
      and (sp.interest_tags && j.tags) = true   -- overlap
  );
$;