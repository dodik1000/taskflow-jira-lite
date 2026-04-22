create extension if not exists pgcrypto;

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.board_members (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  unique(board_id, user_id)
);

create table if not exists public.columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null,
  position integer not null default 0
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.columns(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz default now(),
  description text,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  assignee_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  email text
);