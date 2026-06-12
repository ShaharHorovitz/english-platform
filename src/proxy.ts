import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next 16 renamed the `middleware` convention to `proxy` (nodejs runtime).
 * Responsibilities:
 *   - refresh the Supabase session on every request
 *   - bounce unauthenticated users to /login (except public routes)
 *   - keep signed-in users away from /login + /redeem
 *   - block non-teachers from /admin (role read from app_metadata — no DB call)
 */

const PUBLIC_PATHS = ["/"];
const AUTH_PATHS = ["/login", "/redeem"];

function isPath(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const onAuthPage = isPath(pathname, AUTH_PATHS);
  const isPublic = PUBLIC_PATHS.includes(pathname) || onAuthPage;

  // Build a redirect that preserves the refreshed auth cookies.
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user && !isPublic) return redirectTo("/login");
  if (user && onAuthPage) return redirectTo("/dashboard");

  if (user && isPath(pathname, ["/admin"])) {
    const role = (user.app_metadata as { role?: string } | undefined)?.role;
    if (role !== "teacher") return redirectTo("/dashboard");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
