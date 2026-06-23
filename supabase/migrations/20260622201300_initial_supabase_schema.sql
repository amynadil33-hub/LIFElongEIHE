-- EIHE Lifelong Learning Hub Supabase schema
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  token_identifier text unique,
  name text,
  email text,
  avatar text,
  role text not null default 'student' check (role in ('student','instructor','admin')),
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text not null default '📚',
  color text not null default 'from-violet-500 to-pink-500',
  course_count integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text not null,
  description text,
  thumbnail_url text,
  category_id uuid not null references public.categories(id) on delete restrict,
  instructor_id uuid references public.profiles(id) on delete set null,
  instructor_name text not null,
  level text not null check (level in ('beginner','intermediate','advanced','all_levels')),
  language text not null default 'English',
  duration_days integer not null default 7 check (duration_days = 7),
  total_lessons integer not null default 0,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  tags text[] not null default '{}',
  what_you_learn text[] not null default '{}',
  enrolled_count integer not null default 0,
  rating_average numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.course_days (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 7),
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  unique(course_id, day_number)
);
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  day_id uuid not null references public.course_days(id) on delete cascade,
  title text not null,
  description text,
  content_type text not null check (content_type in ('video','text','quiz','assignment')),
  content_url text,
  content_text text,
  duration_minutes integer not null default 10,
  is_preview boolean not null default false,
  sort_order integer not null default 0,
  dhivehi_title text,
  dhivehi_description text,
  dhivehi_content_text text,
  created_at timestamptz not null default now()
);
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active' check (status in ('active','completed','dropped')),
  progress_percentage integer not null default 0 check (progress_percentage between 0 and 100),
  completed_at timestamptz,
  last_accessed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, course_id)
);
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  is_completed boolean not null default false,
  completed_at timestamptz,
  last_position_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  is_pinned boolean not null default false,
  like_count integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  content text,
  file_url text,
  file_name text,
  status text not null default 'submitted' check (status in ('submitted','reviewed','approved','rejected')),
  grade text,
  feedback text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  certificate_number text not null unique,
  issued_at timestamptz not null default now(),
  course_title text not null,
  user_name text not null,
  created_at timestamptz not null default now(),
  unique(user_id, course_id)
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  unique(user_id, course_id)
);
create table public.alumni_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  content text not null,
  media_url text,
  post_type text not null check (post_type in ('discussion','win','question','resource','story','project','testimonial','achievement')),
  is_published boolean not null default true,
  is_featured boolean not null default false,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.alumni_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.alumni_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  like_count integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.alumni_likes (
  post_id uuid not null references public.alumni_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(post_id, user_id)
);

create index on public.courses(is_published);
create index on public.courses(is_featured) where is_featured;
create index on public.courses(category_id);
create index on public.course_days(course_id);
create index on public.lessons(course_id);
create index on public.lessons(day_id);
create index on public.enrollments(user_id);
create index on public.lesson_progress(user_id, course_id);
create index on public.comments(lesson_id, created_at desc);
create index on public.submissions(course_id);
create index on public.alumni_posts(is_published, created_at desc);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, avatar)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), new.email, new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.enroll_in_course(p_course_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.enrollments(user_id, course_id) values (auth.uid(), p_course_id)
  on conflict (user_id, course_id) do update set last_accessed_at = now()
  returning id into v_id;
  update public.courses set enrolled_count = enrolled_count + 1 where id = p_course_id and not exists (select 1 from public.enrollments where id = v_id and created_at < now() - interval '1 second');
  return v_id;
end; $$;
create or replace function public.complete_lesson(p_course_id uuid, p_lesson_id uuid) returns integer language plpgsql security definer set search_path = public as $$
declare total_count integer; complete_count integer; pct integer;
begin
  insert into public.lesson_progress(user_id, lesson_id, course_id, is_completed, completed_at)
  values (auth.uid(), p_lesson_id, p_course_id, true, now())
  on conflict (user_id, lesson_id) do update set is_completed = true, completed_at = coalesce(lesson_progress.completed_at, now());
  select count(*) into total_count from public.lessons where course_id = p_course_id;
  select count(*) into complete_count from public.lesson_progress where user_id = auth.uid() and course_id = p_course_id and is_completed;
  pct := case when total_count = 0 then 0 else round((complete_count::numeric / total_count::numeric) * 100)::integer end;
  update public.enrollments set progress_percentage = pct, status = case when pct >= 100 then 'completed' else 'active' end, completed_at = case when pct >= 100 then coalesce(completed_at, now()) else completed_at end, last_accessed_at = now() where user_id = auth.uid() and course_id = p_course_id;
  return pct;
end; $$;
create or replace function public.issue_certificate(p_course_id uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_course public.courses; v_profile public.profiles;
begin
  select * into v_course from public.courses where id = p_course_id;
  select * into v_profile from public.profiles where id = auth.uid();
  insert into public.certificates(user_id, course_id, certificate_number, course_title, user_name)
  values (auth.uid(), p_course_id, 'EIHE-' || extract(year from now())::text || '-' || lpad((floor(random()*999999))::int::text, 6, '0'), v_course.title, coalesce(v_profile.name, 'Student'))
  on conflict (user_id, course_id) do update set course_title = excluded.course_title
  returning id into v_id;
  return v_id;
end; $$;
create or replace function public.toggle_alumni_like(p_post_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.alumni_likes where post_id = p_post_id and user_id = auth.uid()) then
    delete from public.alumni_likes where post_id = p_post_id and user_id = auth.uid();
    update public.alumni_posts set like_count = greatest(like_count - 1, 0) where id = p_post_id;
  else
    insert into public.alumni_likes(post_id, user_id) values (p_post_id, auth.uid());
    update public.alumni_posts set like_count = like_count + 1 where id = p_post_id;
  end if;
end; $$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.courses enable row level security;
alter table public.course_days enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.comments enable row level security;
alter table public.submissions enable row level security;
alter table public.certificates enable row level security;
alter table public.reviews enable row level security;
alter table public.alumni_posts enable row level security;
alter table public.alumni_comments enable row level security;
alter table public.alumni_likes enable row level security;

create policy "Public profiles are readable" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());
create policy "Public read categories" on public.categories for select using (true);
create policy "Admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "Public read published courses" on public.courses for select using (is_published or public.is_admin());
create policy "Admins manage courses" on public.courses for all using (public.is_admin()) with check (public.is_admin());
create policy "Public read course days for published courses" on public.course_days for select using (exists (select 1 from public.courses c where c.id = course_id and (c.is_published or public.is_admin())));
create policy "Admins manage course days" on public.course_days for all using (public.is_admin()) with check (public.is_admin());
create policy "Public read lessons for published courses" on public.lessons for select using (exists (select 1 from public.courses c where c.id = course_id and (c.is_published or public.is_admin())));
create policy "Admins manage lessons" on public.lessons for all using (public.is_admin()) with check (public.is_admin());
create policy "Users read own enrollments" on public.enrollments for select using (auth.uid() = user_id or public.is_admin());
create policy "Users create own enrollments" on public.enrollments for insert with check (auth.uid() = user_id);
create policy "Users update own enrollments" on public.enrollments for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "Users read own lesson progress" on public.lesson_progress for select using (auth.uid() = user_id or public.is_admin());
create policy "Users manage own lesson progress" on public.lesson_progress for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "Course comments readable" on public.comments for select using (true);
create policy "Authenticated users add comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users manage own comments" on public.comments for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "Users delete own comments" on public.comments for delete using (auth.uid() = user_id or public.is_admin());
create policy "Users read own submissions" on public.submissions for select using (auth.uid() = user_id or public.is_admin());
create policy "Users create own submissions" on public.submissions for insert with check (auth.uid() = user_id);
create policy "Admins review submissions" on public.submissions for update using (public.is_admin()) with check (public.is_admin());
create policy "Users read own certificates" on public.certificates for select using (auth.uid() = user_id or public.is_admin());
create policy "Users create own reviews" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Public read reviews" on public.reviews for select using (true);
create policy "Public read alumni posts" on public.alumni_posts for select using (is_published or auth.uid() = user_id or public.is_admin());
create policy "Authenticated create alumni posts" on public.alumni_posts for insert with check (auth.uid() = user_id);
create policy "Users manage own alumni posts" on public.alumni_posts for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "Public read alumni comments" on public.alumni_comments for select using (true);
create policy "Authenticated create alumni comments" on public.alumni_comments for insert with check (auth.uid() = user_id);
create policy "Users manage own alumni comments" on public.alumni_comments for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "Users manage own alumni likes" on public.alumni_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
