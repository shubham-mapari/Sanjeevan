create table if not exists public.leaders (
  id             uuid        primary key default gen_random_uuid(),
  name           text        not null,
  designation    text        not null check (designation in ('Chairman', 'Joint Secretary', 'Principal')),
  photo_url      text        not null,
  message_title  text        not null,
  message        jsonb       not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  signature_url  text,
  email          text,
  display_order  integer     not null default 0,
  is_active      boolean     not null default true,
  published      boolean     not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists leaders_visibility_order_idx
  on public.leaders(is_active, published, display_order);

alter table public.leaders enable row level security;

drop policy if exists "public read published leaders" on public.leaders;
create policy "public read published leaders"
  on public.leaders for select to anon, authenticated
  using (published = true and is_active = true);

drop policy if exists "admins read all leaders" on public.leaders;
create policy "admins read all leaders"
  on public.leaders for select to authenticated
  using (public.is_navigation_admin());

drop policy if exists "admins manage leaders" on public.leaders;
create policy "admins manage leaders"
  on public.leaders for all to authenticated
  using (public.is_navigation_admin())
  with check (public.is_navigation_admin());