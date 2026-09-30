import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_BASE_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_DASHBOARD_PATH,
} from "@/lib/admin-config";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // ── Block ALL legacy /admin/* routes ──────────────────────────────────────
  // Return 404-equivalent: rewrite to the built-in not-found handler.
  // The pages themselves also call notFound(), but the middleware ensures
  // no auth information leaks in redirect headers either.
  if (pathname.startsWith("/admin")) {
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  // ── Only run auth logic on the private admin tree ─────────────────────────
  const isSecureAdmin = pathname.startsWith(ADMIN_BASE_PATH);
  if (!isSecureAdmin) return response;

  const isLoginPage        = pathname === ADMIN_LOGIN_PATH;
  const isAccessDeniedPage = pathname === `${ADMIN_BASE_PATH}/access-denied`;

  // If Supabase isn't configured → redirect to login with error flag
  if (!url || !key) {
    if (!isLoginPage) {
      const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
      loginUrl.searchParams.set("error", "missing_config");
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Create SSR Supabase client (handles cookie refresh)
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Validate JWT — this is the real auth check, not just a cookie presence test
  const { data: { user } } = await supabase.auth.getUser();

  // ── Case 1: root /secure-institute-management → login or dashboard ─────────
  if (pathname === ADMIN_BASE_PATH || pathname === `${ADMIN_BASE_PATH}/`) {
    return NextResponse.redirect(
      new URL(user ? ADMIN_DASHBOARD_PATH : ADMIN_LOGIN_PATH, request.url),
    );
  }

  // ── Case 2: already authenticated hitting login → go to dashboard ──────────
  if (isLoginPage && user) {
    return NextResponse.redirect(new URL(ADMIN_DASHBOARD_PATH, request.url));
  }

  // ── Case 3: not authenticated → redirect to login ─────────────────────────
  if (!user && !isLoginPage && !isAccessDeniedPage) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Case 4: authenticated → verify admin_users row ────────────────────────
  // Only check non-login, non-access-denied pages to avoid loops
  if (user && !isLoginPage && !isAccessDeniedPage) {
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      // Authenticated but no admin row → Access Denied
      return NextResponse.redirect(
        new URL(`${ADMIN_BASE_PATH}/access-denied`, request.url),
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on /admin/* and /secure-institute-management/* but skip static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
