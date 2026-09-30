-- ==========================================================
-- PLACEMENT SECTION CMS — Homepage Placement Widget Schema
-- ==========================================================

create table if not exists public.placement_settings (
  id              uuid        primary key default gen_random_uuid(),

  -- Left column content
  eyebrow_text    text        not null default 'From classroom to career',
  heading_line1   text        not null default 'Your next chapter',
  heading_line2   text        not null default 'starts here.',
  body_text       text        not null default 'We build the skills, confidence and connections that help our graduates take their place in a changing world.',
  cta_text        text        not null default 'Explore career outcomes',
  cta_link        text        not null default '/training-placement',
  banner_label    text        not null default 'BUILDING CAREERS, ONE POSSIBILITY AT A TIME',

  -- Industry connections (comma-separated or JSON array)
  industry_label  text        not null default 'Industry connections',
  companies       jsonb       not null default '["Infosys","TCS","Capgemini","KPIT"]'::jsonb,

  -- Right visual column
  photo_url       text,
  photo_alt       text        not null default 'Engineering students collaborating on a project',

  -- Floating stat badge
  stat_number     text        not null default '95',
  stat_suffix     text        not null default '%',
  stat_label1     text        not null default 'placement support',
  stat_label2     text        not null default 'for our graduates',
  stat_link       text        not null default '/training-placement',

  -- Bottom outcome row
  stat1_value     text        not null default '₹12 LPA',
  stat1_label     text        not null default 'Highest package*',
  stat2_value     text        not null default '₹4.2 LPA',
  stat2_label     text        not null default 'Average package*',
  stat3_value     text        not null default '120+',
  stat3_label     text        not null default 'Recruiting partners*',
  disclaimer      text        default '*Based on recent placement data.',

  -- Control
  is_active       boolean     not null default true,
  updated_at      timestamptz not null default now()
);

-- Only ever one row in this table (singleton settings pattern)
create unique index if not exists placement_settings_singleton
  on public.placement_settings ((true));

-- Auto-update updated_at
create or replace function public.set_placement_settings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists placement_settings_set_updated_at on public.placement_settings;
create trigger placement_settings_set_updated_at
  before update on public.placement_settings
  for each row execute function public.set_placement_settings_updated_at();

-- RLS
alter table public.placement_settings enable row level security;

create policy "public read placement settings"
  on public.placement_settings for select to anon, authenticated
  using (is_active = true);

create policy "admins read all placement settings"
  on public.placement_settings for select to authenticated
  using (public.is_navigation_admin());

create policy "admins manage placement settings"
  on public.placement_settings for all to authenticated
  using (public.is_navigation_admin())
  with check (public.is_navigation_admin());

-- Insert default singleton row
insert into public.placement_settings (
  eyebrow_text, heading_line1, heading_line2, body_text,
  cta_text, cta_link, banner_label,
  industry_label, companies,
  photo_url, photo_alt,
  stat_number, stat_suffix, stat_label1, stat_label2, stat_link,
  stat1_value, stat1_label, stat2_value, stat2_label, stat3_value, stat3_label,
  disclaimer, is_active
) values (
  'From classroom to career',
  'Your next chapter',
  'starts here.',
  'We build the skills, confidence and connections that help our graduates take their place in a changing world.',
  'Explore career outcomes',
  '/training-placement',
  'BUILDING CAREERS, ONE POSSIBILITY AT A TIME',
  'Industry connections',
  '["Infosys","TCS","Capgemini","KPIT"]'::jsonb,
  null,
  'Engineering students collaborating on a project',
  '95', '%',
  'placement support', 'for our graduates',
  '/training-placement',
  '₹12 LPA', 'Highest package*',
  '₹4.2 LPA', 'Average package*',
  '120+', 'Recruiting partners*',
  '*Based on recent placement data from verified campus drives.',
  true
)
on conflict do nothing;
