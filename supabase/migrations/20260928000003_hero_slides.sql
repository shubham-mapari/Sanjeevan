-- ==========================================================
-- HERO SLIDES — CMS-powered image slider
-- ==========================================================

create table if not exists public.hero_slides (
  id            uuid        primary key default gen_random_uuid(),
  image_url     text        not null,
  label         text,
  heading       text        not null,
  highlight     text,
  description   text,
  quote         text,
  quote_author  text,
  button_text   text,
  button_link   text,
  image_ratio   text        default '4 / 4.5',
  display_order integer     not null default 0,
  is_active     boolean     not null default true,
  published     boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Ensure image_ratio exists if table already created
alter table public.hero_slides
  add column if not exists image_ratio text default '4 / 4.5';

create index if not exists hero_slides_order_idx
  on public.hero_slides(display_order, is_active, published);

-- Auto-update updated_at
create or replace function public.set_hero_slides_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hero_slides_set_updated_at on public.hero_slides;
create trigger hero_slides_set_updated_at
  before update on public.hero_slides
  for each row execute function public.set_hero_slides_updated_at();

-- RLS
alter table public.hero_slides enable row level security;

create policy "public read published hero slides"
  on public.hero_slides for select to anon, authenticated
  using (published = true and is_active = true);

create policy "admins read all hero slides"
  on public.hero_slides for select to authenticated
  using (public.is_navigation_admin());

create policy "admins manage hero slides"
  on public.hero_slides for all to authenticated
  using (public.is_navigation_admin())
  with check (public.is_navigation_admin());

-- Migration ready: clean schema with RLS and triggers, no dummy slides.
