create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  icon text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid unique references public.menu_items(id) on delete cascade,
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  hero_image text,
  description jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  gallery text[] not null default '{}',
  pdf_file text,
  video_url text,
  cta_label text,
  cta_url text,
  seo_title text,
  seo_description text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists menu_items_menu_order_idx on public.menu_items(menu_id, sort_order);
create index if not exists menus_visible_order_idx on public.menus(is_visible, is_published, sort_order);
create index if not exists pages_published_slug_idx on public.pages(published, slug);

create or replace function public.is_navigation_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid() and role in ('admin', 'editor')
  );
$$;

alter table public.admin_users enable row level security;
alter table public.menus enable row level security;
alter table public.menu_items enable row level security;
alter table public.pages enable row level security;

create policy "admins read own role" on public.admin_users
  for select to authenticated using (user_id = auth.uid());
create policy "public read published menus" on public.menus
  for select to anon, authenticated using (is_visible and is_published);
create policy "admins manage menus" on public.menus
  for all to authenticated using (public.is_navigation_admin()) with check (public.is_navigation_admin());
create policy "public read published menu items" on public.menu_items
  for select to anon, authenticated using (
    is_visible and is_published and exists (
      select 1 from public.menus m
      where m.id = menu_id and m.is_visible and m.is_published
    )
  );
create policy "admins manage menu items" on public.menu_items
  for all to authenticated using (public.is_navigation_admin()) with check (public.is_navigation_admin());
create policy "public read published pages" on public.pages
  for select to anon, authenticated using (published);
create policy "admins manage pages" on public.pages
  for all to authenticated using (public.is_navigation_admin()) with check (public.is_navigation_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('page-assets', 'page-assets', true, 15728640, array['image/jpeg','image/png','image/webp','application/pdf','video/mp4'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "public read page assets" on storage.objects
  for select to anon, authenticated using (bucket_id = 'page-assets');
create policy "admins upload page assets" on storage.objects
  for insert to authenticated with check (bucket_id = 'page-assets' and public.is_navigation_admin());
create policy "admins update page assets" on storage.objects
  for update to authenticated using (bucket_id = 'page-assets' and public.is_navigation_admin()) with check (bucket_id = 'page-assets' and public.is_navigation_admin());
create policy "admins delete page assets" on storage.objects
  for delete to authenticated using (bucket_id = 'page-assets' and public.is_navigation_admin());

-- Seed the existing top-level navigation; apply the migration once before deploying.
insert into public.menus (title, slug, sort_order, is_visible, is_published)
values
  ('Home', 'home', 0, true, true),
  ('About Us', 'about-us', 1, true, true),
  ('Student Section', 'student-section', 2, true, true),
  ('Research', 'research', 3, true, true),
  ('Programs Offered', 'programs-offered', 4, true, true),
  ('Admission', 'admission', 5, true, true),
  ('Diploma', 'diploma', 6, true, true),
  ('IQAC', 'iqac', 7, true, true),
  ('Contact Us', 'contact', 8, true, true),
  ('Gallery', 'gallery', 9, true, true),
  ('T&P Cell', 'training-placement', 10, true, true),
  ('PSD', 'student-development', 11, true, true),
  ('RTI', 'rti', 12, true, true),
  ('FRA Fees', 'fra-fees', 13, true, true)
on conflict (slug) do nothing;

insert into public.pages (title, slug, published, description)
select m.title, m.slug, true, '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Page content will be published by the institute."}]}]}'::jsonb
from public.menus m
where m.slug <> 'home'
on conflict (slug) do nothing;

insert into public.menu_items (menu_id, title, slug, sort_order, is_visible, is_published)
select m.id, seed.title, seed.slug, seed.sort_order, true, true
from (values
  ('About Us','Vision & Mission','vision-mission',0),
  ('About Us','Principal Message','principal-message',1),
  ('About Us','Governing Body','governing-body',2),
  ('Programs Offered','Departments','departments',0),
  ('Programs Offered','Diploma','diploma-programs',1),
  ('Research','Publications','publications',0),
  ('Research','Patents','patents',1),
  ('Research','Innovation Cell','innovation-cell',2)
) as seed(menu_title,title,slug,sort_order)
join public.menus m on m.title = seed.menu_title
on conflict (slug) do nothing;

insert into public.pages (menu_item_id, title, slug, published, description)
select i.id, i.title, i.slug, true, '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Page content will be published by the institute."}]}]}'::jsonb
from public.menu_items i
where i.slug in ('vision-mission','principal-message','governing-body','departments','diploma-programs','publications','patents','innovation-cell')
on conflict (slug) do nothing;
