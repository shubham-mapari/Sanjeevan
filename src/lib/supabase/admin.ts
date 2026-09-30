import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminContext =
  | { supabase: SupabaseClient; response?: never }
  | { supabase?: never; response: Response };

export async function requireNavigationAdmin(): Promise<AdminContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      response: Response.json(
        {
          error:
            "Supabase is not configured. Add the public URL and publishable key.",
        },
        { status: 503 },
      ),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return {
      response: Response.json(
        { error: "Sign in is required. Please sign in at /admin/login." },
        { status: 401 },
      ),
    };
  }

  // Check role in admin_users
  const { data: admin } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  // Auto-enroll authenticated staff user into admin_users if not present
  if (!admin) {
    await supabase
      .from("admin_users")
      .insert({ user_id: user.id, role: "admin" });
  }

  return { supabase };
}
