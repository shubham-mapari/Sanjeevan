alter table public.menu_items
  add column if not exists parent_id uuid references public.menu_items(id) on delete cascade,
  add column if not exists level integer not null default 1,
  add column if not exists icon text;

update public.menu_items
set parent_id = null, level = 1
where parent_id is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'menu_items_level_check'
      and conrelid = 'public.menu_items'::regclass
  ) then
    alter table public.menu_items
      add constraint menu_items_level_check check (level between 1 and 3);
  end if;
end;
$$;

create index if not exists menu_items_parent_order_idx
  on public.menu_items(menu_id, parent_id, sort_order);

create or replace function public.validate_menu_item_hierarchy()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_menu_id uuid;
  parent_level integer;
  creates_cycle boolean;
begin
  if new.parent_id is null then
    new.level := 1;
  else
    if new.parent_id = new.id then
      raise exception 'A menu item cannot be its own parent.';
    end if;

    with recursive ancestors(id, parent_id) as (
      select id, parent_id from public.menu_items where id = new.parent_id
      union all
      select item.id, item.parent_id
      from public.menu_items item
      join ancestors on item.id = ancestors.parent_id
    )
    select exists(select 1 from ancestors where id = new.id) into creates_cycle;

    if creates_cycle then
      raise exception 'A menu item cannot be moved beneath its own child.';
    end if;

    select menu_id, level into parent_menu_id, parent_level
    from public.menu_items
    where id = new.parent_id;

    if not found then
      raise exception 'Parent menu item was not found.';
    end if;
    if parent_menu_id <> new.menu_id then
      raise exception 'Parent and child must belong to the same menu.';
    end if;
    if parent_level >= 3 then
      raise exception 'Navigation supports a maximum of three levels.';
    end if;
    new.level := parent_level + 1;
  end if;

  return new;
end;
$$;

drop trigger if exists menu_items_validate_hierarchy on public.menu_items;
create trigger menu_items_validate_hierarchy
  before insert or update of menu_id, parent_id, level
  on public.menu_items
  for each row execute function public.validate_menu_item_hierarchy();

create or replace function public.move_menu_item(
  p_item_id uuid,
  p_parent_id uuid,
  p_sort_order integer
)
returns public.menu_items
language plpgsql
set search_path = public
as $$
declare
  moving_item public.menu_items;
  target_menu_id uuid;
  target_level integer := 0;
  subtree_depth integer := 0;
  descendant record;
begin
  select * into moving_item
  from public.menu_items
  where id = p_item_id
  for update;
  if not found then
    raise exception 'Menu item was not found.';
  end if;

  if p_parent_id is not null then
    select menu_id, level into target_menu_id, target_level
    from public.menu_items where id = p_parent_id;
    if not found then
      raise exception 'Parent menu item was not found.';
    end if;
    if target_menu_id <> moving_item.menu_id then
      raise exception 'Parent and child must belong to the same menu.';
    end if;
    target_level := target_level + 1;
  else
    target_level := 1;
  end if;

  with recursive descendants(id, parent_id, depth) as (
    select id, parent_id, 1
    from public.menu_items
    where parent_id = p_item_id
    union all
    select child.id, child.parent_id, descendants.depth + 1
    from public.menu_items child
    join descendants on child.parent_id = descendants.id
  )
  select coalesce(max(depth), 0) into subtree_depth from descendants;

  if p_parent_id = p_item_id or exists (
    with recursive descendants(id, parent_id) as (
      select id, parent_id from public.menu_items where parent_id = p_item_id
      union all
      select child.id, child.parent_id
      from public.menu_items child
      join descendants on child.parent_id = descendants.id
    )
    select 1 from descendants where id = p_parent_id
  ) then
    raise exception 'A menu item cannot be moved beneath its own child.';
  end if;

  if target_level + subtree_depth > 3 then
    raise exception 'This move would exceed the three-level navigation limit.';
  end if;

  update public.menu_items
  set parent_id = p_parent_id,
      level = target_level,
      sort_order = p_sort_order
  where id = p_item_id
  returning * into moving_item;

  for descendant in
    with recursive descendants(id, parent_id, depth) as (
      select id, parent_id, 1
      from public.menu_items
      where parent_id = p_item_id
      union all
      select child.id, child.parent_id, descendants.depth + 1
      from public.menu_items child
      join descendants on child.parent_id = descendants.id
    )
    select id, parent_id from descendants order by depth
  loop
    update public.menu_items child
    set level = parent.level + 1
    from public.menu_items parent
    where child.id = descendant.id
      and parent.id = descendant.parent_id;
  end loop;

  return moving_item;
end;
$$;
