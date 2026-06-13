-- =============================================================================
-- RLS for the analytics tables (task_attempts, vocab_mastery).
-- Run in the Supabase SQL Editor AFTER `npm run db:migrate` creates the tables.
-- Reuses the public.is_teacher() helper from 0001. Idempotent.
--
-- Students insert/update/read ONLY their own rows; teachers read all (no write).
-- =============================================================================

alter table public.task_attempts enable row level security;
alter table public.vocab_mastery enable row level security;

-- task_attempts -------------------------------------------------------------
drop policy if exists task_attempts_own on public.task_attempts;
create policy task_attempts_own on public.task_attempts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists task_attempts_teacher_read on public.task_attempts;
create policy task_attempts_teacher_read on public.task_attempts
  for select using (public.is_teacher());

-- vocab_mastery -------------------------------------------------------------
drop policy if exists vocab_mastery_own on public.vocab_mastery;
create policy vocab_mastery_own on public.vocab_mastery
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists vocab_mastery_teacher_read on public.vocab_mastery;
create policy vocab_mastery_teacher_read on public.vocab_mastery
  for select using (public.is_teacher());
