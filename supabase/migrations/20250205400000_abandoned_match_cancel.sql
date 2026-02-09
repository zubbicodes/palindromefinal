-- Add 'cancelled' status for matches that are abandoned (never fully joined).
-- Auto-cancel matches that are still 'waiting' after 60 seconds with fewer than 2 players.

-- 1. Add 'cancelled' to status check
alter table public.matches
  drop constraint if exists matches_status_check;

alter table public.matches
  add constraint matches_status_check
  check (status in ('waiting', 'active', 'finished', 'cancelled'));

-- 2. Enable pg_cron if not already enabled (idempotent)
create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- 3. Schedule job to cancel abandoned matches every minute
-- (If re-running, manually remove duplicate: SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cancel-abandoned-matches';)
select cron.schedule(
  'cancel-abandoned-matches',
  '* * * * *',
  $$
    update public.matches
    set status = 'cancelled'
    where status = 'waiting'
    and created_at < now() - interval '60 seconds'
    and (select count(*) from public.match_players mp where mp.match_id = matches.id) < 2
  $$
);
