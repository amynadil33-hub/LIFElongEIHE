-- Repair auth/profile synchronization and make course enrollment idempotent.
-- This also backfills profiles for users who signed up before the trigger existed.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email, 'EIHE Learner'),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, name, email, avatar)
select
  users.id,
  coalesce(users.raw_user_meta_data->>'name', users.email, 'EIHE Learner'),
  users.email,
  users.raw_user_meta_data->>'avatar_url'
from auth.users as users
on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

create or replace function public.enroll_in_course(p_course_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_is_new boolean := false;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to enroll.';
  end if;

  -- Self-heal accounts created while the profile trigger was unavailable.
  insert into public.profiles (id, name, email, avatar)
  select
    users.id,
    coalesce(users.raw_user_meta_data->>'name', users.email, 'EIHE Learner'),
    users.email,
    users.raw_user_meta_data->>'avatar_url'
  from auth.users as users
  where users.id = v_user_id
  on conflict (id) do nothing;

  insert into public.enrollments (user_id, course_id)
  values (v_user_id, p_course_id)
  on conflict (user_id, course_id) do nothing
  returning id into v_id;

  if v_id is not null then
    v_is_new := true;
  else
    select id into v_id
    from public.enrollments
    where user_id = v_user_id and course_id = p_course_id;

    update public.enrollments
    set last_accessed_at = now()
    where id = v_id;
  end if;

  if v_is_new then
    update public.courses
    set enrolled_count = enrolled_count + 1
    where id = p_course_id;
  end if;

  return v_id;
end;
$$;
