import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT call getUser() on every request.
  // On Vercel serverless, this causes cookie concatenation issues.
  // Only check auth for protected routes.
  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin") && !path.startsWith("/admin/login");

  let user = null;

  if (isAdminRoute) {
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      user = null;
    }

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: Do NOT manipulate cookies after this point.
  // The supabase client may have modified supabaseResponse cookies already.
  // ANY further cookie modification will cause concatenation on Vercel.
  // Return the response as-is from Supabase SSR — do not add, re-set, or copy cookies.

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
