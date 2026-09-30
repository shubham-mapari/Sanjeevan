# Sanjeevan Group of Institutions

Next.js 15 App Router frontend and Supabase-backed navigation/content manager.

## Local development

1. Copy `.env.example` to `.env.local` and add the Supabase project URL and publishable key.
2. Apply `supabase/migrations/20260928000000_navigation_cms.sql` in the Supabase SQL Editor (or through the Supabase CLI).
3. Start the app with `npm run dev` and open `http://localhost:3000`.

The migration creates `menus`, `menu_items`, `pages`, `admin_users`, the `page-assets` Storage bucket, RLS policies, and starter navigation/content. It is an initial migration intended to be applied once to a new project.

## Admin access

Open `/admin/navigation`. The admin dashboard does not include a sign-in screen yet. Its APIs require a valid Supabase Auth session and an `admin` or `editor` row in `public.admin_users`; database RLS remains the authority for writes. This deliberately fails closed when the project, user session, or role is missing.

After creating an Auth user in Supabase, grant it access from the SQL Editor:

```sql
insert into public.admin_users (user_id, role)
select id, 'admin'
from auth.users
where email = 'admin@example.edu'
on conflict (user_id) do update set role = excluded.role;
```

Connect an authentication UI before exposing the dashboard to administrators. Never add a Supabase service-role key to the browser or `.env.example`.

## Navigation and page APIs

- `GET /api/navigation`: published, visible menus and dropdown items for the public site.
- `GET /api/navigation?drafts=true`: administrator menu tree with linked page records.
- `POST /api/navigation`, `PATCH /api/navigation`, `/api/navigation/[menuId]`: create, reorder/publish, update and delete menus.
- `POST|PATCH /api/navigation/items`, `/api/navigation/items/[itemId]`: create, reorder, update and delete dropdowns.
- `POST /api/navigation/publish`: publish visible menus and dropdown items.
- `GET /api/pages/[slug]`, `POST /api/pages`: read published CMS content and create/update a dropdown page.
- `POST /api/uploads`: upload an image, PDF or MP4 to Supabase Storage (`page-assets`, 15 MB limit).

Page descriptions are stored as TipTap JSON. Hero/gallery assets and PDFs are referenced by public Storage URL. Public routes only resolve published pages; menu changes are loaded dynamically from Supabase by the root layout.

## Validation

```bash
npm run lint
npm run build
```
