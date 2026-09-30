create table if not exists public.quick_links (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null,
  category         text        not null default '',
  thumbnail_url    text        not null,
  slug             text        not null unique,
  short_description text       not null default '',
  full_description jsonb       not null default '{"type":"doc","content":[]}'::jsonb,
  pdf_url          text,
  display_order    integer     not null default 0,
  is_active        boolean     not null default true,
  published        boolean     not null default false,
  created_at       timestamptz not null default now()
);

create table if not exists public.quick_link_gallery (
  id             uuid        primary key default gen_random_uuid(),
  quick_link_id  uuid        not null references public.quick_links(id) on delete cascade,
  image_url      text        not null,
  display_order  integer     not null default 0
);

create index if not exists quick_links_visibility_order_idx
  on public.quick_links(is_active, published, display_order);
create index if not exists quick_links_category_idx
  on public.quick_links(category, display_order);
create index if not exists quick_link_gallery_item_order_idx
  on public.quick_link_gallery(quick_link_id, display_order);

alter table public.quick_links enable row level security;
alter table public.quick_link_gallery enable row level security;

drop policy if exists "public read published quick links" on public.quick_links;
create policy "public read published quick links"
  on public.quick_links for select to anon, authenticated
  using (is_active = true and published = true);
drop policy if exists "admins read all quick links" on public.quick_links;
create policy "admins read all quick links"
  on public.quick_links for select to authenticated
  using (public.is_navigation_admin());
drop policy if exists "admins manage quick links" on public.quick_links;
create policy "admins manage quick links"
  on public.quick_links for all to authenticated
  using (public.is_navigation_admin())
  with check (public.is_navigation_admin());

drop policy if exists "public read published quick link gallery" on public.quick_link_gallery;
create policy "public read published quick link gallery"
  on public.quick_link_gallery for select to anon, authenticated
  using (exists (
    select 1 from public.quick_links q
    where q.id = quick_link_id and q.is_active = true and q.published = true
  ));
drop policy if exists "admins read all quick link gallery" on public.quick_link_gallery;
create policy "admins read all quick link gallery"
  on public.quick_link_gallery for select to authenticated
  using (public.is_navigation_admin());
drop policy if exists "admins manage quick link gallery" on public.quick_link_gallery;
create policy "admins manage quick link gallery"
  on public.quick_link_gallery for all to authenticated
  using (public.is_navigation_admin())
  with check (public.is_navigation_admin());
