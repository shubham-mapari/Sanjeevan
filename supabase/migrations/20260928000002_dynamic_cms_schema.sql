-- ==========================================================
-- DYNAMIC PAGE BUILDER — SCHEMA MIGRATION
-- ==========================================================

-- 1. Extend pages table with hero headings and CTA fields
alter table public.pages
  add column if not exists hero_heading text,
  add column if not exists hero_subtitle text,
  add column if not exists cta_text text,
  add column if not exists cta_link text;

-- 2. Create gallery_images table
create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists gallery_images_page_order_idx
  on public.gallery_images(page_id, sort_order);

-- 3. Create page_files table
create table if not exists public.page_files (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null default 'pdf',
  created_at timestamptz not null default now()
);

create index if not exists page_files_page_idx
  on public.page_files(page_id);

-- 4. Enable Row-Level Security
alter table public.gallery_images enable row level security;
alter table public.page_files enable row level security;

-- 5. Policies for gallery_images
create policy "public read gallery images" on public.gallery_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.pages p
      where p.id = page_id and p.published = true
    ) or (select auth.uid() is not null)
  );

create policy "admins manage gallery images" on public.gallery_images
  for all to authenticated
  using (public.is_navigation_admin())
  with check (public.is_navigation_admin());

-- 6. Policies for page_files
create policy "public read page files" on public.page_files
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.pages p
      where p.id = page_id and p.published = true
    ) or (select auth.uid() is not null)
  );

create policy "admins manage page files" on public.page_files
  for all to authenticated
  using (public.is_navigation_admin())
  with check (public.is_navigation_admin());
