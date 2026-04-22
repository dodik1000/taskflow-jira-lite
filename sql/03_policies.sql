alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.columns enable row level security;
alter table public.tasks enable row level security;
alter table public.comments enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Users can view accessible boards" on public.boards;
drop policy if exists "Users can create own boards" on public.boards;
drop policy if exists "Owners can update boards" on public.boards;
drop policy if exists "Owners can delete boards" on public.boards;

drop policy if exists "Users can view memberships of accessible boards" on public.board_members;
drop policy if exists "Users can create owner membership for own board" on public.board_members;
drop policy if exists "Owners can add board members" on public.board_members;
drop policy if exists "Owners can remove board members" on public.board_members;

drop policy if exists "Users can view columns" on public.columns;
drop policy if exists "Users can create columns" on public.columns;
drop policy if exists "Users can update columns" on public.columns;
drop policy if exists "Users can delete columns" on public.columns;

drop policy if exists "Users can view tasks" on public.tasks;
drop policy if exists "Users can create tasks" on public.tasks;
drop policy if exists "Users can update tasks" on public.tasks;
drop policy if exists "Users can delete tasks" on public.tasks;

drop policy if exists "Users can view comments" on public.comments;
drop policy if exists "Users can create comments" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;

drop policy if exists "Users can view profiles" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view accessible boards"
on public.boards
for select
using (
  owner_id = auth.uid()
  or public.is_board_member(id)
);

create policy "Users can create own boards"
on public.boards
for insert
to authenticated
with check (
  owner_id = auth.uid()
);

create policy "Owners can update boards"
on public.boards
for update
using (
  public.is_board_owner(id)
)
with check (
  owner_id = auth.uid()
);

create policy "Owners can delete boards"
on public.boards
for delete
using (
  public.is_board_owner(id)
);

create policy "Users can view memberships of accessible boards"
on public.board_members
for select
using (
  user_id = auth.uid()
  or public.is_board_owner(board_id)
  or public.is_board_member(board_id)
);

create policy "Users can create owner membership for own board"
on public.board_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'owner'
  and public.is_board_owner(board_id)
);

create policy "Owners can add board members"
on public.board_members
for insert
to authenticated
with check (
  public.is_board_owner(board_id)
);

create policy "Owners can remove board members"
on public.board_members
for delete
using (
  public.is_board_owner(board_id)
);

create policy "Users can view columns"
on public.columns
for select
using (
  public.is_board_owner(board_id)
  or public.is_board_member(board_id)
);

create policy "Users can create columns"
on public.columns
for insert
to authenticated
with check (
  public.is_board_owner(board_id)
);

create policy "Users can update columns"
on public.columns
for update
using (
  public.is_board_owner(board_id)
)
with check (
  public.is_board_owner(board_id)
);

create policy "Users can delete columns"
on public.columns
for delete
using (
  public.is_board_owner(board_id)
);

create policy "Users can view tasks"
on public.tasks
for select
using (
  public.can_access_column(column_id)
);

create policy "Users can create tasks"
on public.tasks
for insert
to authenticated
with check (
  public.can_access_column(column_id)
);

create policy "Users can update tasks"
on public.tasks
for update
using (
  public.can_access_column(column_id)
)
with check (
  public.can_access_column(column_id)
);

create policy "Users can delete tasks"
on public.tasks
for delete
using (
  public.can_access_column(column_id)
);

create policy "Users can view comments"
on public.comments
for select
using (
  public.can_access_task(task_id)
);

create policy "Users can create comments"
on public.comments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.can_access_task(task_id)
);

create policy "Users can delete own comments"
on public.comments
for delete
using (
  user_id = auth.uid()
);

create policy "Users can view profiles"
on public.profiles
for select
using (
  id = auth.uid()
  or auth.role() = 'authenticated'
);

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
);

create policy "Users can update own profile"
on public.profiles
for update
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);