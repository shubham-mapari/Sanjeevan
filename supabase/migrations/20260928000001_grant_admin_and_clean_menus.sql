-- ==========================================================
-- SANJEEVAN CMS — GRANT ADMIN ACCESS & CLEAN SEEDED MENUS
-- ==========================================================

-- 1. Clear hardcoded seed menus, menu items, and pages
truncate table public.pages, public.menu_items, public.menus cascade;

-- 2. Update is_navigation_admin() so any authenticated admin can create and manage menus
create or replace function public.is_navigation_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null;
$$;

-- 3. Allow authenticated users to register or maintain their role in admin_users
create policy "authenticated insert admin_users" on public.admin_users
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "authenticated update admin_users" on public.admin_users
  for update to authenticated
  using (user_id = auth.uid());

-- 4. Register all existing and newly created users in admin_users as 'admin'
insert into public.admin_users (user_id, role)
select id, 'admin'
from auth.users
on conflict (user_id) do update set role = 'admin';

create or replace function public.handle_new_admin_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.admin_users (user_id, role)
  values (new.id, 'admin')
  on conflict (user_id) do update set role = 'admin';
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_admin on auth.users;
create trigger on_auth_user_created_admin
  after insert on auth.users
  for each row execute function public.handle_new_admin_user();
