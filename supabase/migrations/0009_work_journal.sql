-- Sprint 9 (expanded scope): work journal — free-text, human-authored daily
-- notes, distinct from activity_sessions.notes (per-session, often
-- auto-populated). See docs/ARCHITECTURE_EXPANSION.md item 6. No
-- dependency on roles or engagements — could have shipped standalone
-- before either; lands after them here only because that's the order
-- the sprints ran in.

create table if not exists work_journal_entries (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references consultants(id),
  date date not null,
  content text not null,
  engagement_id uuid references engagements(id),
  client_id uuid references clients(id),
  visibility text not null default 'private' check (visibility in ('private', 'manager', 'client')),
  user_id uuid,
  created_at timestamptz not null default now()
);

alter table work_journal_entries enable row level security;

drop policy if exists "work_journal_entries_own_read" on work_journal_entries;
create policy "work_journal_entries_own_read" on work_journal_entries for select using (auth.uid() = user_id);
drop policy if exists "work_journal_entries_own_insert" on work_journal_entries;
create policy "work_journal_entries_own_insert" on work_journal_entries for insert with check (auth.uid() = user_id);
drop policy if exists "work_journal_entries_own_update" on work_journal_entries;
create policy "work_journal_entries_own_update" on work_journal_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "work_journal_entries_own_delete" on work_journal_entries;
create policy "work_journal_entries_own_delete" on work_journal_entries for delete using (auth.uid() = user_id);

-- The 'manager'/'client' visibility values only mean something once a
-- manager can actually read them — 'client' has no client-facing surface
-- yet (out of scope, see docs/ARCHITECTURE_EXPANSION.md open decisions),
-- so this grants managers/admins read on anything the author marked above
-- 'private'. A consultant's own entries stay visible to them regardless of
-- the visibility value, via the _own_read policy above.
drop policy if exists "work_journal_entries_manager_read" on work_journal_entries;
create policy "work_journal_entries_manager_read" on work_journal_entries for select using (
  is_manager_or_admin() and visibility <> 'private'
);
