-- Align single-player score tables with auth.users, avoiding dependence on profiles rows.

alter table public.single_player_runs
  drop constraint if exists single_player_runs_user_id_fkey;

alter table public.single_player_runs
  add constraint single_player_runs_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.single_player_best
  drop constraint if exists single_player_best_user_id_fkey;

alter table public.single_player_best
  add constraint single_player_best_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

