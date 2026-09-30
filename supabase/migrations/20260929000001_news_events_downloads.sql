create table if not exists public.news (
  id             uuid        primary key default gen_random_uuid(),
  title          text        not null,
  description    text        not null default '',
  image_url      text,
  category       text        not null,
  publish_date   date        not null default current_date,
  is_new         boolean     not null default false,
  pdf_url        text,
  display_order  integer     not null default 0,
  is_pinned      boolean     not null default false,
  published      boolean     not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists public.events (
  id                 uuid        primary key default gen_random_uuid(),
  title              text        not null,
  banner_url         text,
  event_date         date        not null,
  venue              text        not null,
  description        text        not null default '',
  registration_link  text,
  is_new             boolean     not null default false,
  display_order      integer     not null default 0,
  is_pinned           boolean     not null default false,
  published           boolean     not null default false,
  created_at          timestamptz not null default now()
);

create table if not exists public.downloads (
  id             uuid        primary key default gen_random_uuid(),
  title          text        not null,
  pdf_url        text        not null,
  file_size      text        not null default '',
  category       text        not null,
  is_new         boolean     not null default false,
  display_order  integer     not null default 0,
  is_pinned      boolean     not null default false,
  published      boolean     not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists news_visibility_order_idx
  on public.news(published, is_pinned desc, publish_date desc, display_order);
create index if not exists events_visibility_order_idx
  on public.events(published, is_pinned desc, event_date desc, display_order);
create index if not exists downloads_visibility_order_idx
  on public.downloads(published, is_pinned desc, display_order);

alter table public.news enable row level security;
alter table public.events enable row level security;
alter table public.downloads enable row level security;

drop policy if exists "public read published news" on public.news;
create policy "public read published news"
  on public.news for select to anon, authenticated
  using (published = true);
drop policy if exists "admins read all news" on public.news;
create policy "admins read all news"
  on public.news for select to authenticated
  using (public.is_navigation_admin());
drop policy if exists "admins manage news" on public.news;
create policy "admins manage news"
  on public.news for all to authenticated
  using (public.is_navigation_admin())
  with check (public.is_navigation_admin());

drop policy if exists "public read published events" on public.events;
create policy "public read published events"
  on public.events for select to anon, authenticated
  using (published = true);
drop policy if exists "admins read all events" on public.events;
create policy "admins read all events"
  on public.events for select to authenticated
  using (public.is_navigation_admin());
drop policy if exists "admins manage events" on public.events;
create policy "admins manage events"
  on public.events for all to authenticated
  using (public.is_navigation_admin())
  with check (public.is_navigation_admin());

drop policy if exists "public read published downloads" on public.downloads;
create policy "public read published downloads"
  on public.downloads for select to anon, authenticated
  using (published = true);
drop policy if exists "admins read all downloads" on public.downloads;
create policy "admins read all downloads"
  on public.downloads for select to authenticated
  using (public.is_navigation_admin());
drop policy if exists "admins manage downloads" on public.downloads;
create policy "admins manage downloads"
  on public.downloads for all to authenticated
  using (public.is_navigation_admin())
  with check (public.is_navigation_admin());