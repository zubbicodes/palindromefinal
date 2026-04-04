-- Single-player run history + per-user best + leaderboard support.

create table if not exists public.single_player_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now() not null,
  score int not null check (score >= 0),
  time_seconds int not null check (time_seconds >= 0)
);

create index if not exists idx_single_player_runs_user_created on public.single_player_runs(user_id, created_at desc);
create index if not exists idx_single_player_runs_score_time on public.single_player_runs(score desc, time_seconds asc);

create table if not exists public.single_player_best (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  best_score int not null default 0 check (best_score >= 0),
  best_time_seconds int not null default 0 check (best_time_seconds >= 0),
  updated_at timestamp with time zone default now() not null
);

create index if not exists idx_single_player_best_score_time on public.single_player_best(best_score desc, best_time_seconds asc);

alter table public.single_player_runs enable row level security;
alter table public.single_player_best enable row level security;

drop policy if exists "Users can insert own single_player_runs" on public.single_player_runs;
drop policy if exists "Users can read own single_player_runs" on public.single_player_runs;
drop policy if exists "Single player leaderboard is viewable by everyone" on public.single_player_best;

-- Users can insert their own run rows.
create policy "Users can insert own single_player_runs"
  on public.single_player_runs for insert
  with check (auth.uid() = user_id);

-- Users can read only their own run rows.
create policy "Users can read own single_player_runs"
  on public.single_player_runs for select
  using (auth.uid() = user_id);

-- Leaderboard: everyone can read single_player_best.
create policy "Single player leaderboard is viewable by everyone"
  on public.single_player_best for select
  using (true);

-- Maintain best record (score desc, time asc) automatically after every run insert.
create or replace function public.update_single_player_best()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.single_player_best (user_id, best_score, best_time_seconds, updated_at)
  values (new.user_id, new.score, new.time_seconds, now())
  on conflict (user_id) do update
    set best_score = case
      when excluded.best_score > single_player_best.best_score then excluded.best_score
      when excluded.best_score = single_player_best.best_score and excluded.best_time_seconds < single_player_best.best_time_seconds then excluded.best_score
      else single_player_best.best_score
    end,
    best_time_seconds = case
      when excluded.best_score > single_player_best.best_score then excluded.best_time_seconds
      when excluded.best_score = single_player_best.best_score and excluded.best_time_seconds < single_player_best.best_time_seconds then excluded.best_time_seconds
      else single_player_best.best_time_seconds
    end,
    updated_at = case
      when excluded.best_score > single_player_best.best_score then now()
      when excluded.best_score = single_player_best.best_score and excluded.best_time_seconds < single_player_best.best_time_seconds then now()
      else single_player_best.updated_at
    end;

  return new;
end;
$$;

drop trigger if exists trg_update_single_player_best on public.single_player_runs;
create trigger trg_update_single_player_best
after insert on public.single_player_runs
for each row execute procedure public.update_single_player_best();
