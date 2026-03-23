-- ============================================================
-- ALMA ORDERS EDUCACIÓN — Schema Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. COURSES
create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text,
  instructor_name text,
  created_at timestamptz default now()
);

-- 3. MODULES
create table if not exists public.modules (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  order_index int not null default 0,
  created_at timestamptz default now()
);

-- 4. LESSONS
create table if not exists public.lessons (
  id uuid default gen_random_uuid() primary key,
  module_id uuid references public.modules(id) on delete cascade not null,
  title text not null,
  video_url text,
  duration int, -- in minutes
  order_index int not null default 0,
  created_at timestamptz default now()
);

-- 5. USER PROGRESS
create table if not exists public.user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  is_completed boolean default false,
  created_at timestamptz default now(),
  unique(user_id, lesson_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.user_progress enable row level security;

-- PROFILES: users can read all, only update own
create policy "Public profiles read" on public.profiles for select using (true);
create policy "Own profile update" on public.profiles for update using (auth.uid() = id);
create policy "Own profile insert" on public.profiles for insert with check (auth.uid() = id);

-- COURSES: anyone authenticated can read; only admins can write
create policy "Authenticated read courses" on public.courses for select using (auth.role() = 'authenticated');
create policy "Admin insert courses" on public.courses for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin update courses" on public.courses for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin delete courses" on public.courses for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- MODULES: same as courses
create policy "Authenticated read modules" on public.modules for select using (auth.role() = 'authenticated');
create policy "Admin insert modules" on public.modules for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin update modules" on public.modules for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin delete modules" on public.modules for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- LESSONS: same
create policy "Authenticated read lessons" on public.lessons for select using (auth.role() = 'authenticated');
create policy "Admin insert lessons" on public.lessons for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin update lessons" on public.lessons for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin delete lessons" on public.lessons for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- USER PROGRESS: users manage their own
create policy "Own progress read" on public.user_progress for select using (auth.uid() = user_id);
create policy "Own progress insert" on public.user_progress for insert with check (auth.uid() = user_id);
create policy "Own progress update" on public.user_progress for update using (auth.uid() = user_id);

-- ============================================================
-- MAKE YOURSELF ADMIN
-- Reemplazá 'tu@email.com' con tu email real
-- ============================================================
-- update public.profiles set role = 'admin' where id = (
--   select id from auth.users where email = 'tu@email.com'
-- );
