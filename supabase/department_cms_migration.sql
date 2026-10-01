-- =============================================================
-- SANJEEVAN DEPARTMENT CMS — FULL MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. EXTEND EXISTING departments TABLE
--    Add HOD message fields + hod_designation + hod_qualification
-- ─────────────────────────────────────────────────────────────
alter table if exists public.departments
  add column if not exists hod_designation    text,
  add column if not exists hod_qualification  text,
  add column if not exists hod_experience     text,
  add column if not exists hod_short_intro    text,
  add column if not exists hod_message        text,
  add column if not exists hod_message_rich   jsonb,
  add column if not exists hod_email          text,
  add column if not exists hod_phone          text,
  add column if not exists hod_resume_pdf     text,
  add column if not exists overview           text,
  add column if not exists card_image         text;

-- ─────────────────────────────────────────────────────────────
-- 2. DEPARTMENT FEATURES (dynamic nav/menu items per dept)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.department_features (
  id                uuid        primary key default gen_random_uuid(),
  department_id     uuid        not null references public.departments(id) on delete cascade,
  name              text        not null,
  slug              text        not null,
  short_description text,
  full_description  jsonb,       -- Tiptap JSON
  cover_image       text,
  pdf_url           text,
  external_url      text,
  feature_icon      text,
  display_order     integer     not null default 0,
  is_active         boolean     not null default true,
  published         boolean     not null default true,
  open_in_new_page  boolean     not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (department_id, slug)
);

create index if not exists dept_features_dept_idx
  on public.department_features(department_id, is_active, published, display_order);

-- ─────────────────────────────────────────────────────────────
-- 3. FEATURE IMAGES (gallery per feature)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.department_feature_images (
  id          uuid        primary key default gen_random_uuid(),
  feature_id  uuid        not null references public.department_features(id) on delete cascade,
  image_url   text        not null,
  caption     text,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists dept_feat_images_feat_idx
  on public.department_feature_images(feature_id, sort_order);

-- ─────────────────────────────────────────────────────────────
-- 4. FEATURE DOCUMENTS (PDFs, DOCX, etc. per feature)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.department_feature_documents (
  id            uuid        primary key default gen_random_uuid(),
  feature_id    uuid        not null references public.department_features(id) on delete cascade,
  display_title text        not null,
  file_url      text        not null,
  file_name     text,
  file_type     text,
  file_size     text,
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists dept_feat_docs_feat_idx
  on public.department_feature_documents(feature_id, sort_order);

-- ─────────────────────────────────────────────────────────────
-- 5. HOD / HEAD OF DEPARTMENT (proper relational table)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.department_hods (
  id            uuid        primary key default gen_random_uuid(),
  department_id uuid        not null references public.departments(id) on delete cascade,
  name          text        not null,
  designation   text,
  qualification text,
  experience    text,
  photo_url     text,
  short_intro   text,
  full_message  jsonb,       -- Tiptap JSON rich text
  email         text,
  phone         text,
  resume_pdf    text,
  display_order integer     not null default 0,
  is_active     boolean     not null default true,
  published     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists dept_hods_dept_idx
  on public.department_hods(department_id, is_active, published);

-- ─────────────────────────────────────────────────────────────
-- 6. FACULTY (proper relational table per department)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.department_faculty (
  id              uuid        primary key default gen_random_uuid(),
  department_id   uuid        not null references public.departments(id) on delete cascade,
  name            text        not null,
  designation     text,
  qualification   text,
  experience      text,
  specialization  text,
  photo_url       text,
  email           text,
  phone           text,
  short_bio       text,
  full_bio        jsonb,      -- Tiptap JSON
  resume_pdf      text,
  research_info   text,
  publications    text,
  display_order   integer     not null default 0,
  is_active       boolean     not null default true,
  published       boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists dept_faculty_dept_idx
  on public.department_faculty(department_id, is_active, published, display_order);

-- ─────────────────────────────────────────────────────────────
-- 7. LABORATORIES (proper relational table)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.department_labs (
  id            uuid        primary key default gen_random_uuid(),
  department_id uuid        not null references public.departments(id) on delete cascade,
  name          text        not null,
  lab_code      text,
  description   text,
  incharge      text,
  cover_image   text,
  equipment     text,
  facilities    text,
  pdf_url       text,
  external_url  text,
  display_order integer     not null default 0,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists dept_labs_dept_idx
  on public.department_labs(department_id, is_active, display_order);

-- ─────────────────────────────────────────────────────────────
-- 8. LAB IMAGES (gallery per lab)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.department_lab_images (
  id          uuid        primary key default gen_random_uuid(),
  lab_id      uuid        not null references public.department_labs(id) on delete cascade,
  image_url   text        not null,
  caption     text,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 9. DEPARTMENT GALLERY (standalone gallery per dept)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.department_gallery (
  id            uuid        primary key default gen_random_uuid(),
  department_id uuid        not null references public.departments(id) on delete cascade,
  image_url     text        not null,
  caption       text,
  album_name    text,
  sort_order    integer     not null default 0,
  published     boolean     not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists dept_gallery_dept_idx
  on public.department_gallery(department_id, published, sort_order);

-- ─────────────────────────────────────────────────────────────
-- 10. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

alter table public.department_features         enable row level security;
alter table public.department_feature_images   enable row level security;
alter table public.department_feature_documents enable row level security;
alter table public.department_hods             enable row level security;
alter table public.department_faculty          enable row level security;
alter table public.department_labs             enable row level security;
alter table public.department_lab_images       enable row level security;
alter table public.department_gallery          enable row level security;

-- PUBLIC READ (published + active only)
create policy "public read features"
  on public.department_features for select to anon, authenticated
  using (published = true and is_active = true);

create policy "public read feature images"
  on public.department_feature_images for select to anon, authenticated
  using (true);

create policy "public read feature docs"
  on public.department_feature_documents for select to anon, authenticated
  using (true);

create policy "public read hods"
  on public.department_hods for select to anon, authenticated
  using (published = true and is_active = true);

create policy "public read faculty"
  on public.department_faculty for select to anon, authenticated
  using (published = true and is_active = true);

create policy "public read labs"
  on public.department_labs for select to anon, authenticated
  using (is_active = true);

create policy "public read lab images"
  on public.department_lab_images for select to anon, authenticated
  using (true);

create policy "public read gallery"
  on public.department_gallery for select to anon, authenticated
  using (published = true);

-- ADMIN FULL ACCESS
create policy "admins manage features"
  on public.department_features for all to authenticated
  using (public.is_navigation_admin()) with check (public.is_navigation_admin());

create policy "admins manage feature images"
  on public.department_feature_images for all to authenticated
  using (public.is_navigation_admin()) with check (public.is_navigation_admin());

create policy "admins manage feature docs"
  on public.department_feature_documents for all to authenticated
  using (public.is_navigation_admin()) with check (public.is_navigation_admin());

create policy "admins manage hods"
  on public.department_hods for all to authenticated
  using (public.is_navigation_admin()) with check (public.is_navigation_admin());

create policy "admins manage faculty"
  on public.department_faculty for all to authenticated
  using (public.is_navigation_admin()) with check (public.is_navigation_admin());

create policy "admins manage labs"
  on public.department_labs for all to authenticated
  using (public.is_navigation_admin()) with check (public.is_navigation_admin());

create policy "admins manage lab images"
  on public.department_lab_images for all to authenticated
  using (public.is_navigation_admin()) with check (public.is_navigation_admin());

create policy "admins manage gallery"
  on public.department_gallery for all to authenticated
  using (public.is_navigation_admin()) with check (public.is_navigation_admin());

-- ─────────────────────────────────────────────────────────────
-- 11. updated_at TRIGGER (auto-update on row change)
-- ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_dept_features_updated_at') then
    create trigger set_dept_features_updated_at before update on public.department_features
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_dept_hods_updated_at') then
    create trigger set_dept_hods_updated_at before update on public.department_hods
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_dept_faculty_updated_at') then
    create trigger set_dept_faculty_updated_at before update on public.department_faculty
      for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_dept_labs_updated_at') then
    create trigger set_dept_labs_updated_at before update on public.department_labs
      for each row execute function public.set_updated_at();
  end if;
end $$;
