-- Notifications for friend requests, challenges, and app updates.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('friend_request', 'challenge', 'app_update')),
  title text not null,
  body text,
  data jsonb default '{}',
  read_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_user_unread on public.notifications(user_id) where read_at is null;
create index idx_notifications_created on public.notifications(created_at desc);

alter table public.notifications enable row level security;

create policy "Users can read own notifications" on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications" on public.notifications for update
  using (user_id = auth.uid());

create policy "Authenticated users can create notifications" on public.notifications for insert
  with check (auth.uid() is not null);
