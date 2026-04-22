create or replace function public.is_board_owner(board_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.boards b
    where b.id = board_uuid
      and b.owner_id = auth.uid()
  );
$$;

create or replace function public.is_board_member(board_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.board_members bm
    where bm.board_id = board_uuid
      and bm.user_id = auth.uid()
  );
$$;

create or replace function public.can_access_column(column_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.columns c
    where c.id = column_uuid
      and (
        public.is_board_owner(c.board_id)
        or public.is_board_member(c.board_id)
      )
  );
$$;

create or replace function public.can_access_task(task_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = task_uuid
      and public.can_access_column(t.column_id)
  );
$$;