create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update set full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.habits (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.habit_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  habit_id bigint not null,
  log_date date not null,
  value numeric,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, habit_id, log_date),
  foreign key (habit_id, user_id) references public.habits(id, user_id) on delete cascade
);

create table if not exists public.jobs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.shifts (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  job_id bigint not null,
  work_date date not null,
  hours numeric not null check (hours >= 0),
  hourly_rate numeric not null check (hourly_rate >= 0),
  tips numeric not null default 0 check (tips >= 0),
  total numeric generated always as ((hours * hourly_rate) + tips) stored,
  created_at timestamptz not null default now(),
  foreign key (job_id, user_id) references public.jobs(id, user_id) on delete cascade
);

create table if not exists public.expenses (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  expense_date date not null,
  amount numeric not null check (amount >= 0),
  description text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.jobs enable row level security;
alter table public.shifts enable row level security;
alter table public.expenses enable row level security;

alter table public.profiles force row level security;
alter table public.habits force row level security;
alter table public.habit_logs force row level security;
alter table public.jobs force row level security;
alter table public.shifts force row level security;
alter table public.expenses force row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are editable by owner" on public.profiles;
create policy "Profiles are editable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Habits are readable by owner" on public.habits;
create policy "Habits are readable by owner"
  on public.habits for select
  using (auth.uid() = user_id);

drop policy if exists "Habits are insertable by owner" on public.habits;
create policy "Habits are insertable by owner"
  on public.habits for insert
  with check (auth.uid() = user_id);

drop policy if exists "Habits are editable by owner" on public.habits;
create policy "Habits are editable by owner"
  on public.habits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Habits are deletable by owner" on public.habits;
create policy "Habits are deletable by owner"
  on public.habits for delete
  using (auth.uid() = user_id);

drop policy if exists "Habit logs are readable by owner" on public.habit_logs;
create policy "Habit logs are readable by owner"
  on public.habit_logs for select
  using (auth.uid() = user_id);

drop policy if exists "Habit logs are insertable by owner" on public.habit_logs;
create policy "Habit logs are insertable by owner"
  on public.habit_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Habit logs are editable by owner" on public.habit_logs;
create policy "Habit logs are editable by owner"
  on public.habit_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Habit logs are deletable by owner" on public.habit_logs;
create policy "Habit logs are deletable by owner"
  on public.habit_logs for delete
  using (auth.uid() = user_id);

drop policy if exists "Jobs are readable by owner" on public.jobs;
create policy "Jobs are readable by owner"
  on public.jobs for select
  using (auth.uid() = user_id);

drop policy if exists "Jobs are insertable by owner" on public.jobs;
create policy "Jobs are insertable by owner"
  on public.jobs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Jobs are editable by owner" on public.jobs;
create policy "Jobs are editable by owner"
  on public.jobs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Jobs are deletable by owner" on public.jobs;
create policy "Jobs are deletable by owner"
  on public.jobs for delete
  using (auth.uid() = user_id);

drop policy if exists "Shifts are readable by owner" on public.shifts;
create policy "Shifts are readable by owner"
  on public.shifts for select
  using (auth.uid() = user_id);

drop policy if exists "Shifts are insertable by owner" on public.shifts;
create policy "Shifts are insertable by owner"
  on public.shifts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Shifts are editable by owner" on public.shifts;
create policy "Shifts are editable by owner"
  on public.shifts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Shifts are deletable by owner" on public.shifts;
create policy "Shifts are deletable by owner"
  on public.shifts for delete
  using (auth.uid() = user_id);

drop policy if exists "Expenses are readable by owner" on public.expenses;
create policy "Expenses are readable by owner"
  on public.expenses for select
  using (auth.uid() = user_id);

drop policy if exists "Expenses are insertable by owner" on public.expenses;
create policy "Expenses are insertable by owner"
  on public.expenses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Expenses are editable by owner" on public.expenses;
create policy "Expenses are editable by owner"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Expenses are deletable by owner" on public.expenses;
create policy "Expenses are deletable by owner"
  on public.expenses for delete
  using (auth.uid() = user_id);
