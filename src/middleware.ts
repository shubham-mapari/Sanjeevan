import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // If Supabase credentials are missing and trying to access admin
  if (!url || !key) {
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "missing_config");
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Create server client for session validation with secure cookie handling
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Securely fetch and validate user session via JWT claims
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  if (isAdminRoute) {
    // 1. Direct /admin root access -> route to dashboard or login
    if (pathname === "/admin" || pathname === "/admin/") {
      const target = user ? "/admin/dashboard" : "/admin/login";
      return NextResponse.redirect(new URL(target, request.url));
    }

    // 2. Already authenticated user trying to access /admin/login -> redirect to /admin/dashboard
    if (isLoginPage && user) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    // 3. Unauthenticated public visitor trying to access any protected admin route -> redirect to /admin/login
    if (!isLoginPage && !user) {
      const loginUrl = new URL("/admin/login", request.url);
      if (pathname !== "/admin/dashboard") {
        loginUrl.searchParams.set("next", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
