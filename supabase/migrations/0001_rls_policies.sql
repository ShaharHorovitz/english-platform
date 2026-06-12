-- =============================================================================
-- RLS policies + auth linkage for the English Learning Platform
--
-- Run this in the Supabase SQL Editor AFTER `npm run db:migrate` has created
-- the tables. Drizzle owns the table DDL; this file owns everything that
-- touches the Supabase `auth` schema and Row Level Security, which Drizzle
-- cannot model. It is idempotent (safe to re-run).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Link profiles.id -> auth.users.id  (ON DELETE CASCADE)
--    Deleting an auth user removes their profile (and, by FK cascade, their
--    progress rows).
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_id_auth_users_fk'
  ) then
    alter table public.profiles
      add constraint profiles_id_auth_users_fk
      foreign key (id) references auth.users (id) on delete cascade;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 2) Helper: is the current user a teacher?
--    SECURITY DEFINER so it can read profiles without tripping the profiles
--    RLS policy (avoids infinite recursion).
-- -----------------------------------------------------------------------------
create or replace function public.is_teacher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- Helper: the grade the current student is assigned to.
create or replace function public.my_grade_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select grade_id from public.profiles where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- 3) Enable RLS on every application table
-- -----------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.grades         enable row level security;
alter table public.units          enable row level security;
alter table public.tasks          enable row level security;
alter table public.vocab_items    enable row level security;
alter table public.user_progress  enable row level security;
alter table public.invite_codes   enable row level security;

-- -----------------------------------------------------------------------------
-- 4) Policies (drop-then-create for idempotency)
-- -----------------------------------------------------------------------------

-- profiles: a student sees/edits their own row; teachers see/edit all.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_teacher());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_teacher())
  with check (id = auth.uid() or public.is_teacher());

drop policy if exists profiles_teacher_write on public.profiles;
create policy profiles_teacher_write on public.profiles
  for all using (public.is_teacher()) with check (public.is_teacher());

-- grades: student reads only their assigned grade; teachers read/write all.
drop policy if exists grades_select on public.grades;
create policy grades_select on public.grades
  for select using (public.is_teacher() or id = public.my_grade_id());

drop policy if exists grades_teacher_write on public.grades;
create policy grades_teacher_write on public.grades
  for all using (public.is_teacher()) with check (public.is_teacher());

-- units: student reads units of their grade; teachers read/write all.
drop policy if exists units_select on public.units;
create policy units_select on public.units
  for select using (public.is_teacher() or grade_id = public.my_grade_id());

drop policy if exists units_teacher_write on public.units;
create policy units_teacher_write on public.units
  for all using (public.is_teacher()) with check (public.is_teacher());

-- tasks: student reads tasks of their grade's units; teachers read/write all.
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select using (
    public.is_teacher()
    or unit_id in (select id from public.units where grade_id = public.my_grade_id())
  );

drop policy if exists tasks_teacher_write on public.tasks;
create policy tasks_teacher_write on public.tasks
  for all using (public.is_teacher()) with check (public.is_teacher());

-- vocab_items: same visibility rule as tasks.
drop policy if exists vocab_select on public.vocab_items;
create policy vocab_select on public.vocab_items
  for select using (
    public.is_teacher()
    or unit_id in (select id from public.units where grade_id = public.my_grade_id())
  );

drop policy if exists vocab_teacher_write on public.vocab_items;
create policy vocab_teacher_write on public.vocab_items
  for all using (public.is_teacher()) with check (public.is_teacher());

-- user_progress: a student reads/writes only their own rows; teachers read all.
drop policy if exists progress_own on public.user_progress;
create policy progress_own on public.user_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists progress_teacher_read on public.user_progress;
create policy progress_teacher_read on public.user_progress
  for select using (public.is_teacher());

-- invite_codes: teachers only. Redemption by not-yet-registered users happens
-- server-side with the service-role key, which bypasses RLS.
drop policy if exists invite_codes_teacher on public.invite_codes;
create policy invite_codes_teacher on public.invite_codes
  for all using (public.is_teacher()) with check (public.is_teacher());
